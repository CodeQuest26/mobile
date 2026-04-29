import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const JobPeekCard = ({
  job,
  theme,
}: {
  job: (typeof NEW_JOBS)[0];
  theme: any;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={[
      styles.jobPeekCard,
      { backgroundColor: theme.cardBackground, borderColor: theme.border },
    ]}
  >
    <View style={[styles.jobCatTag, { backgroundColor: theme.primary + "15" }]}>
      <Text style={[styles.jobCatText, { color: theme.primary }]}>
        {job.category}
      </Text>
    </View>
    <Text
      style={[styles.jobPeekTitle, { color: theme.text }]}
      numberOfLines={2}
    >
      {job.product}
    </Text>
    <Text style={[styles.jobPeekQty, { color: theme.textSecondary }]}>
      {job.quantity}
    </Text>
    <View style={styles.jobPeekBottom}>
      <Text style={[styles.jobPeekBudget, { color: theme.text }]}>
        {job.budget}
      </Text>
      <View style={[styles.bidNowBtn, { backgroundColor: theme.primary }]}>
        <Text style={[styles.bidNowText, { color: theme.onPrimary }]}>Bid</Text>
      </View>
    </View>
    <View style={styles.jobPeekLoc}>
      <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
      <Text style={[styles.jobPeekLocText, { color: theme.textSecondary }]}>
        {job.location}
      </Text>
    </View>
  </TouchableOpacity>
);

export default JobPeekCard;

const styles = StyleSheet.create({
  jobsHScroll: { paddingRight: 16, gap: 10 },
  jobPeekCard: {
    width: 160,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  jobCatTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobCatText: { fontSize: 10.5, fontWeight: "700" },
  jobPeekTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  jobPeekQty: { fontSize: 11.5 },
  jobPeekBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  jobPeekBudget: { fontSize: 12, fontWeight: "700" },
  bidNowBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  bidNowText: { fontSize: 12, fontWeight: "700" },
  jobPeekLoc: { flexDirection: "row", alignItems: "center", gap: 3 },
  jobPeekLocText: { fontSize: 11 },
});
