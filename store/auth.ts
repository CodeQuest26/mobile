import { api, handleApiError } from "@/services/api";
import { mmkvStorage } from "@/store/mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "sme" | "manufacturer";
  verified: boolean;
  location?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "sme" | "manufacturer";
  location?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  updateUser: (fields: Partial<User>) => Promise<void>;

  setToken: (token: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

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

      /* ---------------- Login ---------------- */

      login: async (email, password) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const { data } = await api.post("/auth/login", {
            email,
            password,
          });

          api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });
        } catch (error) {
          const message = handleApiError(error);

          set({
            error: message,
          });

          throw new Error(message);
        } finally {
          set({
            isLoading: false,
          });
        }
      },

      /* ---------------- Register ---------------- */
      register: async (payload) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const { data } = await api.post("/auth/register", payload);

          api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });
        } catch (error) {
          const message = handleApiError(error);

          set({
            error: message,
          });

          throw new Error(message);
        } finally {
          set({
            isLoading: false,
          });
        }
      },

      /* ---------------- Current User ---------------- */

      getMe: async () => {
        try {
          if (!get().token) return;

          set({
            isLoading: true,
          });

          const { data } = await api.get("/auth/me");

          set({
            user: data.user,
            isAuthenticated: true,
          });
        } catch {
          await get().logout();
        } finally {
          set({
            isLoading: false,
          });
        }
      },

      /* ---------------- Update User ---------------- */

      updateUser: async (fields) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const { data } = await api.patch("/auth/me", fields);

          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  ...data.user,
                }
              : null,
          }));
        } catch (error) {
          const message = handleApiError(error);

          set({
            error: message,
          });

          throw new Error(message);
        } finally {
          set({
            isLoading: false,
          });
        }
      },

      /* ---------------- Logout ---------------- */

      logout: async () => {
        try {
          await api.post("/auth/logout").catch(() => {});
        } finally {
          delete api.defaults.headers.common.Authorization;

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },
    }),
    {
      name: "auth",

      storage: createJSONStorage(() => mmkvStorage),

      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
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
