import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Spacer from "../Spacer";

type DisputeReason =
  | "QUALITY_BELOW_SPEC"
  | "WRONG_QUANTITY"
  | "LATE_DELIVERY"
  | "NOT_DELIVERED"
  | "OTHER";

const REASONS: { value: DisputeReason; label: string }[] = [
  { value: "QUALITY_BELOW_SPEC", label: "Quality Below Specification" },
  { value: "WRONG_QUANTITY", label: "Wrong Quantity" },
  { value: "LATE_DELIVERY", label: "Late Delivery" },
  { value: "NOT_DELIVERED", label: "Not Delivered" },
  { value: "OTHER", label: "Other" },
];

export interface ReportIssueModalProps {
  visible: boolean;
  orderId: string;
  theme: any;
  onClose: (submitted?: boolean) => void;
}

const ReportIssueModal = ({
  visible,
  orderId,
  theme,
  onClose,
}: ReportIssueModalProps) => {
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setReason(null);
    setDescription("");
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    const wasSubmitted = submitted;
    reset();
    onClose(wasSubmitted);
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post(`orders/${orderId}/dispute`, {
        reason,
        description: description.trim(),
      });

      setSubmitted(true);
    } catch (err) {
      if (isAxiosError(err)) {
        const serverMsg =
          err.response?.data?.message ??
          err.response?.data?.error ??
          err.response?.data?.detail;
        setError(
          serverMsg ??
            (err.response?.status === 409
              ? "A dispute has already been raised for this order."
              : "Failed to submit report. Please try again."),
        );
      } else {
        setError("Failed to submit report. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.container, { backgroundColor: theme.cardBackground }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Report an Issue
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successBox}>
              <Ionicons
                name="checkmark-circle"
                size={40}
                color={theme.primary}
              />
              <Text style={[styles.successTitle, { color: theme.text }]}>
                Issue Reported
              </Text>
              <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                Our team will review it shortly. You&apos;ll be notified of any
                updates.
              </Text>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                onPress={handleClose}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Reason selector */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Reason
              </Text>
              <View style={styles.reasonGrid}>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.reasonChip,
                      {
                        borderColor:
                          reason === r.value ? theme.primary : theme.border,
                        backgroundColor:
                          reason === r.value
                            ? theme.primary + "12"
                            : "transparent",
                      },
                    ]}
                    onPress={() => setReason(r.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        {
                          color:
                            reason === r.value ? theme.primary : theme.text,
                          fontWeight: reason === r.value ? "700" : "500",
                        },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text
                style={[
                  styles.label,
                  { color: theme.textSecondary, marginTop: 16 },
                ]}
              >
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={5}
                style={[
                  styles.textArea,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
                textAlignVertical="top"
              />

              {error && (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {error}
                </Text>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: submitting ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.onPrimary} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          <Spacer style={{ height: 30 }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 13,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 110,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  successSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  doneBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ReportIssueModal;
