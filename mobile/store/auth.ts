import { mmkvStorage } from "@/store/mmkv";
import axios from "axios";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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

const showTestOtpIfPresent = (otpCode?: string) => {
  if (otpCode) {
    Alert.alert("OTP Verification code", otpCode);
  }
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

      // Register
      register: async (payload) => {
        try {
          set({ isLoading: true, error: null });

          const { data } = await axios.post(
            joinUrl(BASE_URL, "auth/register"),
            payload,
          );

          console.log(data);
          showTestOtpIfPresent(data?.otpCode);

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

      // Verify OTP
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

          const { data } = await axios.post(
            joinUrl(BASE_URL, "auth/resend-otp"),
            { phoneNumber },
          );

          showTestOtpIfPresent(data?.otpCode);
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

          showTestOtpIfPresent(data?.otpCode);

          console.log("OTP CODE (login):", data);

          set({ pendingVerificationPhone: phoneNumber });
        } catch (error: any) {
          const message = handleApiError(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      //  current user
      getMe: async () => {
        try {
          if (!get().token) throw new Error("No session token");
          set({ isLoading: true });

          const api = getApi();
          const { data } = await api.get("users/me");
          set({ user: data });
        } catch (err) {
          console.warn("getMe failed:", err);
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      //  log out
      logout: async () => {
        const refreshToken = get().refreshToken;

        try {
          if (refreshToken) {
            const api = getApi();
            await api.post("auth/logout", { refreshToken });
          }
        } catch (err) {
          console.warn("Backend logout failed or token already invalid:", err);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            pendingVerificationPhone: null,
            error: null,
            sessionExpiredMessage: null,
          });
        }
      },

      //  Force Logout (session expired) when refresh definitively fails
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
        pendingVerificationPhone: state.pendingVerificationPhone,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate auth store:", error);
          return;
        }

        if (state) {
          state.isAuthenticated = !!state.token;
        }

        state?.setHasHydrated(true);
      },
    },
  ),
);
