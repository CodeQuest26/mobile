import { useAuthStore } from "@/store/auth";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** Duration (ms) the toast is visible before auto-dismissing. */
const DISPLAY_DURATION = 4000;

/**
 * Floating session-expiry toast.
 *
 * Mounts once in the root layout and listens to `sessionExpiredMessage`
 * in the Zustand auth store. When a message appears (set by `forceLogout`
 * inside the API interceptor), it slides in from the top, stays for 4 s,
 * then fades out and clears the message.
 *
 * No third-party packages required — uses React Native's `Animated` API.
 */
export const SessionExpiredToast: React.FC = () => {
  const message = useAuthStore((s) => s.sessionExpiredMessage);
  const clearSessionMessage = useAuthStore((s) => s.clearSessionMessage);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      opacity.setValue(0);
      translateY.setValue(-24);
      clearSessionMessage();
    });
  }, [clearSessionMessage, opacity, translateY]);

  useEffect(() => {
    if (!message) return;

    // Reset before animating in (handles rapid back-to-back messages).
    opacity.setValue(0);
    translateY.setValue(-24);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(dismiss, DISPLAY_DURATION);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      {/* Icon column */}
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>🔒</Text>
      </View>

      {/* Message */}
      <Text style={styles.text} numberOfLines={3}>
        {message}
      </Text>

      {/* Dismiss button */}
      <TouchableOpacity
        onPress={dismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Dismiss session expired notification"
        accessibilityRole="button"
      >
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: "#12121e",
    borderLeftWidth: 4,
    borderLeftColor: "#e94560",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9999,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  iconWrapper: {
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    color: "#f0f0f0",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
    marginRight: 8,
  },
  dismiss: {
    color: "#888",
    fontSize: 16,
    paddingLeft: 4,
  },
});
