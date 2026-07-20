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
  onSuccess?: () => void;
  onClose?: () => void;
};

export type PaystackAuthorizationModalProps = {
  visible: boolean;
  authorizationUrl: string;
  loading: boolean;
  theme: PaystackAuthorizationModalTheme;
  onClose: () => void;
  onSuccess: () => void;
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
    console.log(authorizationUrl);
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
 *   - closeAuthorizationSilent() → resets state WITHOUT firing onClose (use for retry flow)
 *   - openAuthorizationUrl(url) → opens the modal with the given URL
 */
export const usePaystackAuthorization = (
  options: UsePaystackAuthorizationOptions = {},
) => {
  const [visible, setVisible] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const successFiredRef = useRef(false);
  const onSuccessRef = useRef(options.onSuccess);
  const onCloseRef = useRef(options.onClose);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onCloseRef.current = options.onClose;
  }, [options.onSuccess, options.onClose]);

  useEffect(() => {
    if (visible) {
      successFiredRef.current = false;
      setLoading(true);
    }
  }, [visible, authorizationUrl]);

  /** Resets modal state only — does NOT fire onClose callback. Use this for retries. */
  const closeAuthorizationSilent = useCallback(() => {
    setVisible(false);
    setAuthorizationUrl("");
    setLoading(true);
  }, []);

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
    setLoading(true);
    onCloseRef.current?.();
  }, []);

  const resolveSuccess = useCallback(() => {
    setVisible(false);
    setAuthorizationUrl("");
    setLoading(true);
    onSuccessRef.current?.();
  }, []);

  const openAuthorizationUrl = useCallback((url: string) => {
    if (!url) {
      throw new Error("No payment authorization URL received from server");
    }
    successFiredRef.current = false;
    setAuthorizationUrl(url);
    setLoading(true);
    setVisible(true);
  }, []);

  const handleShouldStartLoad = useCallback(
    (request: { url: string }): boolean => {
      const url = request.url || "";

      const isSuccess =
        url.includes("callback") ||
        url.includes("trxref") ||
        url.includes("success") ||
        url.includes("reference");

      const isCancel = url.includes("cancel") || url.includes("close");

      if (isSuccess && !successFiredRef.current) {
        successFiredRef.current = true;
        resolveSuccess();
        return false;
      }

      if (isCancel) {
        closeAuthorization();
        return false;
      }

      return true;
    },
    [closeAuthorization, resolveSuccess],
  );

  return {
    openAuthorizationUrl,
    closeAuthorization,
    closeAuthorizationSilent,
    visible,
    authorizationUrl,
    loading,
    setLoading,
    handleLoadStart,
    handleLoadEnd,
    handleShouldStartLoad,
  };
};
