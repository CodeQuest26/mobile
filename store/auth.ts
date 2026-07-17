import { api } from "@/services/api";
import { mmkvStorage } from "@/store/mmkv";
import axios from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: string;
  fullName: string;
  phoneNumber?: string;
  role: "SME_OWNER" | "FACTORY_OWNER" | "ENTERPRISE" | "ADMIN";
  isVerified: boolean;
  region?: string;
  profileImageUrl?: string;
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

interface AuthState {
  [x: string]: any;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // OTP verification flow
  pendingVerificationPhone: string | null;
  isVerifying: boolean;

  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;

  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<string>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;

  setToken: (token: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  clearError: () => void;
}

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://backendtest-production-9132.up.railway.app/api/v1/";

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

      pendingVerificationPhone: null,
      isVerifying: false,

      isLoading: false,
      hasHydrated: false,
      error: null,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      clearError: () => set({ error: null }),

      setToken: (token) => {
        if (token) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
          delete api.defaults.headers.common.Authorization;
        }

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
            `${BASE_URL}auth/register`,
            payload,
          );

          console.log("OTP CODE (register):", data.otpCode);

          // DON'T set isAuthenticated yet - user needs to verify OTP
          set({
            user: {
              id: data.id,
              fullName: data.fullName,
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

          const { data } = await axios.post<{ message: string }>(
            `${BASE_URL}auth/verify`,
            { phoneNumber, otp },
          );

          // Update user verification status and clear the pending flag —
          // this is the only place pendingVerificationPhone should be
          // cleared on success. (If a user abandons verification instead
          // of completing it, make sure your OTP screen's back handler
          // also clears this, or they'll keep getting redirected back
          // to OTP on every future app launch.)
          set((state) => ({
            user: state.user ? { ...state.user, isVerified: true } : state.user,
            pendingVerificationPhone: null,
          }));

          const currentState = get();
          if (currentState.token && currentState.user?.isVerified) {
            set({ isAuthenticated: true });
          }

          return data.message;
        } catch (error) {
          const message = handleApiError(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isVerifying: false });
        }
      },

      /* ---------------- Login ---------------- */
      login: async (phoneNumber, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data } = await axios.post(`${BASE_URL}auth/login`, {
            phoneNumber,
            password,
          });

          // Test/staging backend echoes the OTP directly in the response —
          // remove this log before shipping a production build.
          console.log("📱 OTP CODE (login):", data.otpCode);

          api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

          set({
            token: data.accessToken,
            refreshToken: data.refreshToken,
          });

          // Fetch the profile BEFORE deciding auth state — this tells us
          // whether the account still needs OTP verification, or whether
          // this session can be considered fully authenticated right away.
          await get().getMe();

          const { user } = get();
          if (user?.isVerified) {
            // Account already verified — nothing left to verify this
            // session. Don't force OTP on every login.
            set({ isAuthenticated: true, pendingVerificationPhone: null });
          } else {
            // Not yet verified — route through OTP before granting access.
            set({
              isAuthenticated: false,
              pendingVerificationPhone: phoneNumber,
            });
          }
        } catch (error: any) {
          const message = handleApiError(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      /* ---------------- Current User ---------------- */
      getMe: async () => {
        try {
          if (!get().token) return;
          set({ isLoading: true });

          const { data } = await api.get("users/me");

          set({ user: data });
        } catch (err) {
          // Only treat this as a real session failure on 401/403 — an
          // expired/invalid token. A network error, timeout, or 5xx
          // shouldn't silently log the user out; that was previously
          // wiping valid sessions on any transient failure.
          const status = axios.isAxiosError(err)
            ? err.response?.status
            : undefined;
          if (status === 401 || status === 403) {
            await get().logout();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      /* ---------------- Logout ---------------- */
      logout: async () => {
        delete api.defaults.headers.common.Authorization;

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingVerificationPhone: null,
          error: null,
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

        if (state?.token) {
          api.defaults.headers.common.Authorization = `Bearer ${state.token}`;
        }

        state?.setHasHydrated(true);
      },
    },
  ),
);
