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

          console.log(data);

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

          const { data } = await axios.post<VerifyOtpResponse>(
            `${BASE_URL}auth/verify`,
            { phoneNumber, otp },
          );
          console.log(data);
          set({
            user: {
              id: data.user?.id,
              fullName: data?.user?.fullName,
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

          await axios.post(`${BASE_URL}auth/resend-otp`, { phoneNumber });
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

          const { data } = await axios.post(`${BASE_URL}auth/login`, {
            phoneNumber,
            password,
          });

          // Test/staging backend echoes the OTP directly in the response —
          // remove this log before shipping a production build.
          console.log("📱 OTP CODE (login):", data.otpCode);
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
          // Only a 401 proves that the access token was rejected. A 403 can
          // be a valid authenticated user lacking permission, while network
          // errors, timeouts, and 5xx responses must never log the user out.
          const status = axios.isAxiosError(err)
            ? err.response?.status
            : undefined;
          if (status === 401) {
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
