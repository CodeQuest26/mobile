import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface StarPickerProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  theme: any;
}

const StarPicker = ({ label, value, onChange, theme }: StarPickerProps) => (
  <View style={styles.starPickerRow}>
    <Text style={[styles.starPickerLabel, { color: theme.text }]}>
      {label}
    </Text>
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={22}
            color={n <= value ? "#F59E0B" : theme.textSecondary}
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export interface ReviewFormProps {
  orderId: string;
  theme: any;
}

const ReviewForm = ({ orderId, theme }: ReviewFormProps) => {
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError("Please select an overall rating.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post("reviews", {
        orderId,
        overallRating,
        qualityRating: qualityRating || undefined,
        timelinessRating: timelinessRating || undefined,
        communicationRating: communicationRating || undefined,
        comment: comment.trim() || undefined,
      });

      setSubmitted(true);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.status === 409
            ? "You've already reviewed this order."
            : "Failed to submit review. Please try again.",
        );
      } else {
        setError("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text style={[styles.heading, { color: theme.text }]}>
        Leave a Review
      </Text>

      {submitted ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={32} color={theme.primary} />
          <Text style={[styles.successText, { color: theme.text }]}>
            Thanks for your review!
          </Text>
        </View>
      ) : (
        <>
          <StarPicker
            label="Overall"
            value={overallRating}
            onChange={setOverallRating}
            theme={theme}
          />
          <StarPicker
            label="Quality"
            value={qualityRating}
            onChange={setQualityRating}
            theme={theme}
          />
          <StarPicker
            label="Timeliness"
            value={timelinessRating}
            onChange={setTimelinessRating}
            theme={theme}
          />
          <StarPicker
            label="Communication"
            value={communicationRating}
            onChange={setCommunicationRating}
            theme={theme}
          />

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share more about your experience (optional)"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
          />

          {error && (
            <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
          )}

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
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  starPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  starPickerLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  starRow: {
    flexDirection: "row",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
    marginTop: 4,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 10,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  successText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ReviewForm;
