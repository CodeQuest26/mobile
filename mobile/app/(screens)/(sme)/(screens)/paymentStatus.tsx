import MainContainer from "@/components/MainContainer";
import { Colors } from "@/constants/colors";
import { api } from "@/services/api";
import {
  clearPaymentCompletionHandler,
  notifyPaymentCompleted,
} from "@/services/paymentCompletion";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type VerificationState = "verifying" | "verified" | "unverified";

type PaymentVerificationResponse = {
  verified: boolean;
};

/**
 * The only screen that interprets a completed Paystack checkout as payment
 * success. A callback merely gets the customer here; the backend decides the
 * transaction's final status using the original reference.
 */
export default function PaymentStatus() {
  const { reference, orderId, jobId, originRoute } = useLocalSearchParams<{
    reference?: string;
    orderId?: string;
    jobId?: string;
    originRoute?: string;
  }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;
  const [status, setStatus] = useState<VerificationState>("verifying");
  const completionHandled = useRef(false);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setStatus("unverified");
      return;
    }

    setStatus("verifying");
    try {
      const { data } = await api.post<PaymentVerificationResponse>(
        "payments/verify",
        { reference },
      );
      setStatus(data.verified === true ? "verified" : "unverified");
    } catch {
      setStatus("unverified");
    }
  }, [reference]);

  useEffect(() => {
    void verifyPayment();
  }, [verifyPayment]);

  useEffect(() => {
    if (status !== "verified" || !orderId || completionHandled.current) return;

    completionHandled.current = true;
    notifyPaymentCompleted();
    clearPaymentCompletionHandler();
    router.replace({
      pathname: "/(screens)/(sme)/(screens)/orderDetails",
      params: { id: orderId },
    });
  }, [orderId, status]);

  const returnToJob = useCallback(() => {
    clearPaymentCompletionHandler();
    if (originRoute === "jobDetails" && jobId) {
      // Replacing this screen mounts job details again, which reloads its data
      // and preserves the former onPaymentComplete refresh behavior.
      router.replace({
        pathname: "/(screens)/(sme)/(screens)/jobDetails",
        params: { id: jobId, paymentVerified: "true", orderId: orderId ?? "" },
      });
      return;
    }
    router.back();
  }, [jobId, orderId, originRoute]);

  const isVerifying = status === "verifying";
  const isVerified = status === "verified";

  return (
    <MainContainer safe>
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isVerified
                ? theme.primary + "20"
                : isVerifying
                  ? theme.iconBackground
                  : theme.warning + "20",
            },
          ]}
        >
          {isVerifying ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            <Ionicons
              name={isVerified ? "checkmark-circle" : "time-outline"}
              size={68}
              color={isVerified ? theme.primary : theme.warning}
            />
          )}
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {isVerifying
            ? "Confirming your payment"
            : isVerified
              ? "Payment confirmed"
              : "Payment not confirmed yet"}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {isVerifying
            ? "We’re securely confirming your payment with Paystack."
            : isVerified
              ? "Your payment has been received and is secured in escrow. The manufacturer can now begin production."
              : "We couldn’t confirm this payment yet. If you just completed it, please check again shortly."}
        </Text>

        {!isVerifying && (
          <TouchableOpacity
            onPress={isVerified ? returnToJob : verifyPayment}
            style={[styles.action, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.actionText, { color: theme.onPrimary }]}>
              {isVerified ? "Return to job" : "Check again"}
            </Text>
          </TouchableOpacity>
        )}

        {!isVerifying && !isVerified && (
          <TouchableOpacity onPress={returnToJob} style={styles.secondaryAction}>
            <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
              Return to job
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  iconCircle: { width: 132, height: 132, borderRadius: 66, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  title: { fontSize: 25, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  message: { fontSize: 15, lineHeight: 23, textAlign: "center", maxWidth: 340 },
  action: { alignSelf: "stretch", alignItems: "center", borderRadius: 14, paddingVertical: 15, marginTop: 32 },
  actionText: { fontSize: 16, fontWeight: "700" },
  secondaryAction: { paddingVertical: 16, marginTop: 4 },
  secondaryText: { fontSize: 15, fontWeight: "600" },
});
