import { router } from "expo-router";
import { useEffect } from "react";

import { hasCompletedOnboarding } from "@/storage/storage";
import { useAuthStore } from "@/store/auth";

import { getSavedRole, hasSelectedRole } from "@/storage/storage";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hasHydrated) return;

    const onboarded = hasCompletedOnboarding();
    const rolePicked = hasSelectedRole();
    const savedRole = getSavedRole();

    // 1. ROLE SELECTION FIRST
    if (!rolePicked) {
      router.replace("/(auth)");
      return;
    }

    // 2. ONBOARDING
    if (!onboarded) {
      router.replace("/(onboarding)");
      return;
    }

    // 3. NOT LOGGED IN
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    // 4. ROLE ROUTING
    switch (user?.role || savedRole) {
      case "FACTORY_OWNER":
        router.replace("/(screens)/(manufacturer)/(tabs)");
        break;

      case "SME_OWNER":
        router.replace("/(screens)/(sme)/(tabs)");
        break;

      default:
        router.replace("/(auth)/login");
    }
  }, [hasHydrated, isAuthenticated, user]);

  return null;
}
