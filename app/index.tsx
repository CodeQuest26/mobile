import { router } from "expo-router";
import { useEffect } from "react";

import {
  getSavedRole,
  hasCompletedOnboarding,
  hasSelectedRole,
} from "@/storage/storage";
import { useAuthStore } from "@/store/auth";

export default function Index() {
  const {
    isAuthenticated,
    hasHydrated,
    user,
    pendingVerificationPhone,
    token,
  } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    const onboarded = hasCompletedOnboarding();
    const rolePicked = hasSelectedRole();
    const savedRole = getSavedRole();
    const liveRole = user?.role ?? savedRole;

    // First launch -> onboarding
    if (!onboarded) {
      router.replace("/(onboarding)");
      return;
    }

    // No role selected
    if (!rolePicked) {
      router.replace("/(auth)");
      return;
    }

    // Not logged in
    if (!token && !isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    // Pending OTP
    if (pendingVerificationPhone) {
      router.replace({
        pathname: "/(auth)/OTPVerification",
        params: {
          phoneNumber: pendingVerificationPhone,
          role: liveRole,
        },
      });
      return;
    }

    if (!isAuthenticated || !user?.role) {
      return;
    }

    switch (liveRole) {
      case "FACTORY_OWNER":
        router.replace("/(screens)/(manufacturer)/(tabs)");
        break;

      case "SME_OWNER":
        router.replace("/(screens)/(sme)/(tabs)");
        break;

      case "ADMIN":
        router.replace("/(screens)/(admin)/(tabs)");
        break;

      default:
        router.replace("/(auth)/login");
    }
  }, [hasHydrated, isAuthenticated, pendingVerificationPhone, token, user]);

  return null;
}
