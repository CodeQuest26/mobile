import { useAuthStore } from "@/store/auth";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Falls back to the real backend server from the OpenAPI spec if the
// env var isn't set, so dev/testing doesn't silently hit a dead domain.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://backendtest-production-9132.up.railway.app/api/v1/";

// Joins base + path with exactly one slash between them, regardless of
// whether either side already has one (avoids ".../v1auth/refresh"-style
// bugs from raw template-literal concatenation).
const joinUrl = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

/* ================= INSTANCE ================= */

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ================= HYDRATION GATE ================= */

// Resolves once the persisted auth store has finished rehydrating from
// MMKV. Requests fired before that point don't yet know whether there's
// a real token, so we hold them here instead of letting them go out
// unauthenticated — which was causing false 401 -> refresh -> logout
// cascades that could wipe a valid session before it ever loaded.
const waitForHydration = (() => {
  let hydratedPromise: Promise<void> | null = null;
  return () => {
    if (useAuthStore.getState().hasHydrated) return Promise.resolve();
    if (!hydratedPromise) {
      hydratedPromise = new Promise((resolve) => {
        const unsub = useAuthStore.subscribe((state) => {
          if (state.hasHydrated) {
            unsub();
            resolve();
          }
        });
      });
    }
    return hydratedPromise;
  };
})();

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    await waitForHydration();
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ================= RESPONSE INTERCEPTOR ================= */

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const { token, refreshToken } = useAuthStore.getState();

    // Only treat this as "session expired" if we actually had a token.
    // A 401 with no token at all is just an unauthenticated request,
    // not a reason to attempt refresh or log the user out.
    if (error.response?.status === 401 && !original._retry && token) {
      if (!refreshToken) {
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue subsequent requests until the in-flight refresh resolves.
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Per the spec's RefreshRequest schema, refreshToken goes in the
        // JSON body — not an Authorization header.
        const { data } = await axios.post(joinUrl(BASE_URL, "auth/refresh"), {
          refreshToken,
        });

        // Matches TokenResponse schema.
        const newToken: string = data.accessToken;
        const newRefreshToken: string | undefined = data.refreshToken;

        useAuthStore.getState().setToken(newToken);
        if (newRefreshToken) {
          useAuthStore.setState({ refreshToken: newRefreshToken });
        }

        processQueue(null, newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/* ================= HELPERS ================= */

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.violations?.length) {
      return data.violations.map((v: any) => v.message).join("\n");
    }
    return (
      data?.message ?? data?.error ?? error.message ?? "Something went wrong"
    );
  }
  return "An unexpected error occurred";
};
