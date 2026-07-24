import { mmkvStorage } from "@/store/mmkv";
import axios from "axios";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Lazy-import to avoid circular dependency: auth.ts → api.ts → auth.ts.
// The api instance is only needed inside getMe, which runs after module init.
const getApi = () =>
  require("@/services/api").api as import("axios").AxiosInstance;

interface User {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: "SME_OWNER" | "FACTORY_OWNER" | "ENTERPRISE" | "ADMIN";
  isVerified: boolean;
  region?: string;
  profileImageUrl?: string;
  createdAt?: string;
}

interface RegisterPayload {
  fullName: string;
  password: string;
  phoneNumber: string;
  role: "SME_OWNER" | "FACTORY_OWNER" | "ENTERPRISE" | "ADMIN";
  ghanaCardNumber?: string;
  region?: string;
  town?: string;
}

interface VerifyOtpResponse {
  accessToken: string;
  accessTokenExpiry: string;
  refreshToken: string;
  user: any;
  refreshTokenExpiry: string;
  tokenType: string;
}

interface AuthState {
  [x: string]: any;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  /** Populated by forceLogout when the session ends due to token expiry or
   *  account suspension. Read by SessionExpiredToast to display the message. */
  sessionExpiredMessage: string | null;

  // OTP verification flow
  pendingVerificationPhone: string | null;
  isVerifying: boolean;

  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;

  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
  resendOtp: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Called by the API interceptor when a refresh definitively fails.
   *  Clears the session and sets sessionExpiredMessage for the toast. */
  forceLogout: (message: string) => Promise<void>;
  getMe: () => Promise<void>;

  setToken: (token: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  clearError: () => void;
  /** Called by SessionExpiredToast after the message has been displayed. */
  clearSessionMessage: () => void;
}

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://backendtest-production-9132.up.railway.app/api/v1/";

const joinUrl = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.violations?.length) {
      return data.violations.map((v: any) => v.message).join("\n");
    }
    return (
      data?.detail ??
      data?.message ??
      data?.error ??
      error.message ??
      "Something went wrong"
    );
  }
  return "An unexpected error occurred";
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      sessionExpiredMessage: null,

      pendingVerificationPhone: null,
      isVerifying: false,

      isLoading: false,
      hasHydrated: false,
      error: null,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      clearError: () => set({ error: null }),

      clearSessionMessage: () => set({ sessionExpiredMessage: null }),

      setToken: (token) => {
        set({
          token,
          isAuthenticated: !!token,
        });
      },

      /* ---------------- Register ---------------- */
      register: async (payload) => {
        try {
          set({ isLoading: true, error: null });

          const { data } = await axios.post(
            joinUrl(BASE_URL, "auth/register"),
            payload,
          );

          console.log(data);

          set({
            user: {
              id: data.id,
              fullName: data.fullName,
              email: data.email,
              phoneNumber: data.phoneNumber,
              role: data.role,
              isVerified: data.isVerified,
              region: data.region,
              profileImageUrl: data.profileImageUrl,
            },
            pendingVerificationPhone: payload.phoneNumber,
            isAuthenticated: false,
            token: null,
            refreshToken: null,
          });
        } catch (error) {
          const message = handleApiError(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      /* ---------------- Verify OTP ---------------- */
      verifyOtp: async (phoneNumber, otp) => {
        try {
          set({ isVerifying: true, error: null });

          const { data } = await axios.post<VerifyOtpResponse>(
            joinUrl(BASE_URL, "auth/verify"),
            { phoneNumber, otp },
          );
          console.log(data);
          set({
            user: {
              id: data.user?.id,
              fullName: data?.user?.fullName,
              email: data.user?.email,
              phoneNumber: data?.user?.phoneNumber,
              role: data.user?.role,
              isVerified: data.user.isVerified,
              region: data.user?.region,
              profileImageUrl: data.user?.profileImageUrl,
            },
            pendingVerificationPhone: null,
            isAuthenticated: true,
            token: data.accessToken,
            refreshToken: data.refreshToken,
          });
        } catch (error) {
          const message = handleApiError(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isVerifying: false });
        }
      },

      /* ---------------- Resend OTP ---------------- */
      resendOtp: async (phoneNumber) => {
        try {
          set({ isLoading: true, error: null });

          await axios.post(joinUrl(BASE_URL, "auth/resend-otp"), {
            phoneNumber,
          });
        } catch (error) {
          const message = handleApiError(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      /* ---------------- Login ---------------- */
      login: async (phoneNumber, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data } = await axios.post(joinUrl(BASE_URL, "auth/login"), {
            phoneNumber,
            password,
          });

          Alert.alert("OTP Verification code", data?.otpCode);

          // Test/staging backend echoes the OTP directly in the response —
          // remove this log before shipping a production build.
          console.log("📱 OTP CODE (login):", data);
        } catch (error: any) {
          const message = handleApiError(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      /* ---------------- Current User ---------------- */
      // Uses the api instance (not bare axios) so that the response interceptor
      // handles 401 → silent refresh transparently, without a second manual
      // refresh path that could conflict with the interceptor's queue.
      getMe: async () => {
        try {
          if (!get().token) throw new Error("No session token");
          set({ isLoading: true });

          const api = getApi();
          const { data } = await api.get("users/me");
          set({ user: data });
        } catch (err) {
          // The api interceptor already handles 401 → refresh → retry.
          // If we still land here, the refresh definitively failed (or
          // there was no token to begin with) — rethrow so callers like
          // biometric login can react (e.g. fall back to password login).
          console.warn("getMe failed:", err);
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      /* ---------------- Logout ---------------- */
      logout: async () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingVerificationPhone: null,
          error: null,
          sessionExpiredMessage: null,
        });
      },

      /* ---------------- Force Logout (session expired) ---------------- */
      // Called by the API interceptor when refresh definitively fails.
      // Unlike logout(), this sets sessionExpiredMessage so the toast can
      // display the server's reason (e.g. "Account suspended").
      forceLogout: async (message) => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingVerificationPhone: null,
          error: null,
          sessionExpiredMessage: message,
        });
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        // DON'T persist isAuthenticated - recalculated on hydration
        pendingVerificationPhone: state.pendingVerificationPhone,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate auth store:", error);
          return;
        }

        // Mutate the incoming state object directly instead of calling
        // useAuthStore.setState — that reference isn't safely available
        // yet at this point in the store's own initialization, and
        // referencing it here caused "Cannot read property 'setState'
        // of undefined".
        if (state) {
          state.isAuthenticated = !!state.token;
        }

        state?.setHasHydrated(true);
      },
    },
  ),
);
