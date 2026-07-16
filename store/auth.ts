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
      // NOTE: register does NOT return tokens per the API schema —
      // it just creates the (unverified) user. The next step is verifyOtp.
      register: async (payload) => {
        try {
          set({ isLoading: true, error: null });

          const { data } = await axios.post(
            `${BASE_URL}auth/register`,
            payload,
          );

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
          });

          console.log(data);
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

          set((state) => ({
            user: state.user ? { ...state.user, isVerified: true } : state.user,
            pendingVerificationPhone:
              state.pendingVerificationPhone === phoneNumber
                ? null
                : state.pendingVerificationPhone,
          }));

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

          api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

          set({
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });

          console.log(data);

          // login response has no user object, so fetch it separately
          await get().getMe();
        } catch (error: any) {
          console.log(error);
          console.log("response:", error?.response?.data);
          console.log("status:", error?.response?.status);
          console.log("headers:", error?.response?.headers);
          console.log("message:", error?.message);
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

          set({
            user: data,
            isAuthenticated: true,
          });
        } catch {
          await get().logout();
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
        isAuthenticated: state.isAuthenticated,
        pendingVerificationPhone: state.pendingVerificationPhone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common.Authorization = `Bearer ${state.token}`;
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
