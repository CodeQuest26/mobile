import { router } from "expo-router";
import { useEffect } from "react";

import {
  getSavedRole,
  hasCompletedOnboarding,
  hasSelectedRole,
} from "@/storage/storage";
import { useAuthStore } from "@/store/auth";

export default function Index() {
  const { isAuthenticated, hasHydrated, user, pendingVerificationPhone } =
    useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    const onboarded = hasCompletedOnboarding();
    const rolePicked = hasSelectedRole();
    const savedRole = getSavedRole();

    const state = useAuthStore.getState();
    console.log("ROOT GATE:", {
      isAuthenticated: state.isAuthenticated,
      pendingVerificationPhone: state.pendingVerificationPhone,
      userVerified: state.user?.isVerified,
    });

    if (!rolePicked) {
      router.replace("/(auth)");
      return;
    }

    if (!onboarded) {
      router.replace("/(onboarding)");
      return;
    }

    // 🚨 Force OTP whenever there's a pending phone number
    if (pendingVerificationPhone) {
      router.replace({
        pathname: "/(auth)/OTPVerification",
        params: {
          phoneNumber: pendingVerificationPhone,
          role: savedRole,
        },
      });
      return;
    }

    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    // At this point user is fully authenticated and verified
    switch (user?.role) {
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
  }, [hasHydrated]);

  return null;
}
