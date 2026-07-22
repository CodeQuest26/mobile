import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { storage } from "@/store/mmkv";

// MMKV key used to persist the user's opt-in choice.
const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export interface BiometricState {
  /** Hardware is present and at least one credential is enrolled. */
  isAvailable: boolean;
  /** User has explicitly opted in to biometric login. */
  isEnabled: boolean;
  /** Type label shown in the UI ("Face ID", "Touch ID", "Fingerprint", …). */
  biometricLabel: string;
  /** True while the auth prompt is open or we're querying hardware. */
  isAuthenticating: boolean;
  /** Enable / disable the opt-in preference (persisted to MMKV). */
  setEnabled: (value: boolean) => void;
  /** Trigger the OS authentication prompt. Resolves true on success. */
  authenticate: (reason?: string) => Promise<boolean>;
}

/**
 * Derives a human-readable label from the list of enrolled authenticator types
 * returned by `expo-local-authentication`.
 */
function resolveLabel(
  types: LocalAuthentication.AuthenticationType[],
): string {
  if (Platform.OS === "ios") {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
      return "Face ID";
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
      return "Touch ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
    return "Fingerprint";
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
    return "Face Recognition";
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS))
    return "Iris Scan";
  return "Biometrics";
}

export function useBiometrics(): BiometricState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(
    () => storage.getBoolean(BIOMETRIC_ENABLED_KEY) ?? false,
  );
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // On mount: probe hardware capability and enrolled credentials.
  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return;

      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricLabel(resolveLabel(types));
      setIsAvailable(true);
    })();
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    storage.set(BIOMETRIC_ENABLED_KEY, value);
    setIsEnabledState(value);
  }, []);

  const authenticate = useCallback(
    async (reason = "Authenticate to continue"): Promise<boolean> => {
      if (!isAvailable) return false;

      setIsAuthenticating(true);
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          // Falls back to device PIN/pattern/password if biometric fails.
          disableDeviceFallback: false,
          cancelLabel: "Cancel",
        });
        return result.success;
      } catch {
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [isAvailable],
  );

  return {
    isAvailable,
    isEnabled,
    biometricLabel,
    isAuthenticating,
    setEnabled,
    authenticate,
  };
}
