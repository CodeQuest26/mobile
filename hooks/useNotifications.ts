import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Safely require expo-notifications so missing native modules (e.g. standard Expo Go or unbuilt dev client) don't crash at app startup.
let Notifications: typeof import("expo-notifications") | null = null;
try {
  Notifications = require("expo-notifications");
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () =>
        ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }) as any,
    });
  }
} catch (error) {
  console.warn(
    "[Notifications] expo-notifications native module unavailable. Build a native dev client to enable push notifications.",
  );
}

/* ─── Token registration ──────────────────────────────────────────────────── */

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications) return null;

  try {
    /* Android: create a notification channel required since Android 8. */
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });
    }

    /* Ask the user for permission. */
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[Notifications] Permission not granted.");
      return null;
    }

    /* Get device push token. */
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data as string;
  } catch (err) {
    console.warn("[Notifications] Error obtaining push token:", err);
    return null;
  }
}

async function sendTokenToBackend(token: string): Promise<void> {
  try {
    await api.post("auth/fcm-token", { token });
    console.log("[Notifications] FCM token registered with backend.");
  } catch (err) {
    console.warn("[Notifications] Failed to register FCM token:", err);
  }
}

/* ─── React hook ─────────────────────────────────────────────────────────── */

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  /* ── Register token only after the user is authenticated ── */
  useEffect(() => {
    if (!isAuthenticated || !Notifications) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) sendTokenToBackend(token);
    });
  }, [isAuthenticated]);

  /* ── Listeners ── */
  useEffect(() => {
    if (!Notifications) return;

    try {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log(
            "[Notifications] Received in foreground:",
            notification.request.content,
          );
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as Record<
            string,
            any
          >;

          console.log("[Notifications] Tapped:", data);

          if (data?.screen) {
            try {
              router.push(data.screen as any);
            } catch {
              // Ignore invalid route fallback
            }
          }
        });
    } catch (err) {
      console.warn("[Notifications] Failed to initialize listeners:", err);
    }

    return () => {
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
    };
  }, []);
}
