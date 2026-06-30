import { storage } from "@/store/mmkv";

const FIRST_LAUNCH_KEY = "has_launched";

export const hasCompletedOnboarding = (): boolean => {
  return storage.getBoolean(FIRST_LAUNCH_KEY) ?? false;
};

export const completeOnboarding = (): void => {
  storage.set(FIRST_LAUNCH_KEY, true);
};

export const resetOnboarding = (): void => {
  storage.remove(FIRST_LAUNCH_KEY);
};

const ROLE_KEY = "has_selected_role";
const ROLE_VALUE_KEY = "user_role";

export const hasSelectedRole = (): boolean => {
  return storage.getBoolean(ROLE_KEY) ?? false;
};

export const setSelectedRole = (role: "sme" | "manufacturer") => {
  storage.set(ROLE_KEY, true);
  storage.set(ROLE_VALUE_KEY, role);
};

export const getSavedRole = (): "sme" | "manufacturer" | null => {
  return storage.getString(ROLE_VALUE_KEY) as any;
};
