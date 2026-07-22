import { Ionicons } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export type PaystackAuthorizationModalTheme = {
  background: string;
  borderColor: string;
  card: string;
  textColor: string;
  primary: string;
};

export type UsePaystackAuthorizationOptions = {
  /** Called after Paystack reaches our configured callback URL. */
  onCheckoutComplete?: (reference: string) => void;
  onClose?: () => void;
};

export type PaystackAuthorizationModalProps = {
  visible: boolean;
  authorizationUrl: string;
  loading: boolean;
  theme: PaystackAuthorizationModalTheme;
  onClose: () => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onShouldStartLoadWithRequest: (request: { url: string }) => boolean;
};

export const PaystackAuthorizationModal = memo(
  ({
    visible,
    authorizationUrl,
    loading,
    theme,
    onClose,
    onLoadStart,
    onLoadEnd,
    onShouldStartLoadWithRequest,
  }: PaystackAuthorizationModalProps) => {
    if (!visible) return null;
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.header,
              {
                borderBottomColor: theme.borderColor,
                backgroundColor: theme.card,
              },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.textColor }]}>
              Secure Payment
            </Text>
            <View style={styles.badge}>
              <Ionicons name="lock-closed" size={14} color={theme.primary} />
              <Text style={styles.badgeText}>Paystack</Text>
            </View>
          </View>

          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator animating size="small" color={theme.primary} />
            </View>
          )}

          <WebView
            key={authorizationUrl}
            source={{ uri: authorizationUrl }}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            scalesPageToFit
          />
        </View>
      </Modal>
    );
  },
);

PaystackAuthorizationModal.displayName = "PaystackAuthorizationModal";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#10B981",
  },
  loaderOverlay: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  webview: {
    flex: 1,
  },
});

/**
 * Hook that manages a Paystack hosted-checkout flow driven by an authorization_url.
 * It exposes a modal component so screens can keep the flow reusable and consistent.
 *
 * Key methods:
 *   - closeAuthorization()      → resets state AND fires onClose callback (user dismissed)
 *   - openAuthorizationUrl(url, reference) → opens the modal with the given URL
 *
 * This hook deliberately does not verify or report payment success. The host
 * screen owns the native verification experience after checkout completes.
 */
export const usePaystackAuthorization = (
  options: UsePaystackAuthorizationOptions = {},
) => {
  const [visible, setVisible] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const completionHandledRef = useRef(false);
  const paymentReferenceRef = useRef("");
  const onCheckoutCompleteRef = useRef(options.onCheckoutComplete);
  const onCloseRef = useRef(options.onClose);

  useEffect(() => {
    onCheckoutCompleteRef.current = options.onCheckoutComplete;
    onCloseRef.current = options.onClose;
  }, [options.onCheckoutComplete, options.onClose]);

  useEffect(() => {
    if (visible) {
      completionHandledRef.current = false;
      setLoading(true);
    }
  }, [visible, authorizationUrl]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  /** Resets modal state AND fires the onClose callback. Use for user-initiated dismissal. */
  const closeAuthorization = useCallback(() => {
    setVisible(false);
    setAuthorizationUrl("");
    paymentReferenceRef.current = "";
    setLoading(true);
    onCloseRef.current?.();
  }, []);

  const completeCheckout = useCallback((reference: string) => {
    setVisible(false);
    setAuthorizationUrl("");
    paymentReferenceRef.current = "";
    setLoading(true);
    onCheckoutCompleteRef.current?.(reference);
  }, []);

  const openAuthorizationUrl = useCallback((url: string, reference: string) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("No payment authorization URL received from server");
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "checkout.paystack.com" ||
      parsedUrl.port !== "" ||
      !reference
    ) {
      throw new Error("The server returned an invalid Paystack checkout URL.");
    }

    completionHandledRef.current = false;
    paymentReferenceRef.current = reference;
    setAuthorizationUrl(url);
    setLoading(true);
    setVisible(true);
  }, []);

  const isCallbackUrl = useCallback((url: string) => {
    try {
      const target = new URL(url);
      const callback = new URL(
        process.env.EXPO_PUBLIC_PAYSTACK_CALLBACK_URL ??
          "https://backendtest-production-9132.up.railway.app/api/v1/payments/callback",
      );
      return (
        target.protocol === callback.protocol &&
        target.hostname === callback.hostname &&
        target.port === callback.port &&
        target.pathname === callback.pathname
      );
    } catch {
      return false;
    }
  }, []);

  const isPaystackCloseUrl = useCallback((url: string) => {
    try {
      const target = new URL(url);
      return (
        target.protocol === "https:" &&
        target.hostname === "standard.paystack.co" &&
        target.port === "" &&
        target.pathname === "/close" &&
        target.search === "" &&
        target.hash === ""
      );
    } catch {
      return false;
    }
  }, []);

  const handleShouldStartLoad = useCallback(
    (request: { url: string }): boolean => {
      const url = request.url || "";
      if (isPaystackCloseUrl(url)) {
        if (!completionHandledRef.current) {
          completionHandledRef.current = true;
          closeAuthorization();
        }
        return false;
      }

      if (isCallbackUrl(url)) {
        if (completionHandledRef.current) return false;
        completionHandledRef.current = true;
        const reference = paymentReferenceRef.current;
        completeCheckout(reference);
        return false;
      }

      return true;
    },
    [closeAuthorization, completeCheckout, isCallbackUrl, isPaystackCloseUrl],
  );

  return {
    openAuthorizationUrl,
    closeAuthorization,
    visible,
    authorizationUrl,
    loading,
    setLoading,
    handleLoadStart,
    handleLoadEnd,
    handleShouldStartLoad,
  };
};
