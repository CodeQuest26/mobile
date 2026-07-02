import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { getOrderById } from "@/constants/manufacturerData";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;

  const [order, setOrder] = useState(() => getOrderById(id));

  const markNextMilestone = useCallback(() => {
    if (!order) return;

    const timeline = [...order.timeline];
    const nextIdx = timeline.findIndex((item) => !item.completed);

    // All stages already done — nothing to mark
    if (nextIdx === -1) return;

    // Mark the next incomplete stage as done
    timeline[nextIdx] = { ...timeline[nextIdx], completed: true };

    const completedCount = timeline.filter((t) => t.completed).length;
    const progress = completedCount / timeline.length;

    // Label becomes the next still-incomplete stage, or "Completed" if all done
    const nextIncomplete = timeline.find((t) => !t.completed);
    const milestoneLabel = nextIncomplete ? nextIncomplete.stage : "Completed";

    setOrder({
      ...order,
      timeline,
      progress,
      milestoneLabel,
      urgent: progress < 1 ? order.urgent : false,
    });
  }, [order]);

  if (!order) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <Text style={{ color: theme.text }}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: theme.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </MainContainer>
    );
  }

  const isCompleted = order.progress === 1.0;

  return (
    <>
      <StatusBar barStyle="default" />
      <MainContainer safe>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Order Details
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Job Title & Status */}
          <FadeIn delay={0}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <View style={styles.jobRow}>
                <Text style={[styles.jobName, { color: theme.text }]}>
                  {order.job}
                </Text>
              </View>
              <Text style={[styles.smeName, { color: theme.textSecondary }]}>
                {order.sme}
              </Text>
              <View style={styles.divider} />
              <View style={styles.amountRow}>
                <Text
                  style={[styles.amountLabel, { color: theme.textSecondary }]}
                >
                  Amount
                </Text>
                <Text style={[styles.amountValue, { color: theme.text }]}>
                  {order.amount}
                </Text>
              </View>
              <View style={styles.milestoneRow}>
                <Text
                  style={[
                    styles.milestoneLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Current Stage
                </Text>
                <Text style={[styles.milestoneValue, { color: theme.primary }]}>
                  {order.milestoneLabel}
                </Text>
              </View>
              <View style={styles.dueRow}>
                <Text style={[styles.dueLabel, { color: theme.textSecondary }]}>
                  Due In
                </Text>
                <Text
                  style={[
                    styles.dueValue,
                    { color: order.urgent ? "#EF4444" : theme.text },
                  ]}
                >
                  {order.dueIn}
                </Text>
              </View>
            </View>
          </FadeIn>

          {/* Progress */}
          <FadeIn delay={80}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Progress
              </Text>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: "#f0f0f0" },
                ]}
              >
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${order.progress * 100}%`,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: theme.textSecondary }]}
              >
                {Math.round(order.progress * 100)}% Complete
              </Text>
            </View>
          </FadeIn>

          {/* Timeline */}
          <FadeIn delay={120}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Timeline
              </Text>
              {order.timeline.map((item, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <Ionicons
                      name={
                        item.completed ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={20}
                      color={
                        item.completed ? theme.primary : theme.textSecondary
                      }
                    />
                    {idx < order.timeline.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: theme.border },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineStage, { color: theme.text }]}>
                      {item.stage}
                    </Text>
                    <Text
                      style={[
                        styles.timelineDate,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.date}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeIn>

          {/* Job Specifications */}
          <FadeIn delay={160}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Job Specifications
              </Text>
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {order.description}
              </Text>
              <View style={styles.specRow}>
                <Text
                  style={[styles.specLabel, { color: theme.textSecondary }]}
                >
                  Quantity:
                </Text>
                <Text style={[styles.specValue, { color: theme.text }]}>
                  {order.quantity}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text
                  style={[styles.specLabel, { color: theme.textSecondary }]}
                >
                  Material:
                </Text>
                <Text style={[styles.specValue, { color: theme.text }]}>
                  {order.specifications}
                </Text>
              </View>
            </View>
          </FadeIn>

          {/* Delivery Address */}
          <FadeIn delay={200}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Delivery Address
              </Text>
              <Text
                style={[styles.addressText, { color: theme.textSecondary }]}
              >
                {order.deliveryAddress}
              </Text>
              <TouchableOpacity style={styles.mapBtn}>
                <Text style={[styles.mapBtnText, { color: theme.primary }]}>
                  View on Map
                </Text>
              </TouchableOpacity>
            </View>
          </FadeIn>

          {/* Action Buttons */}
          {!isCompleted && (
            <FadeIn delay={280}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={markNextMilestone}
                >
                  <Text style={styles.actionBtnText}>Mark Next Milestone</Text>
                </TouchableOpacity>
              </View>
            </FadeIn>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </MainContainer>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  jobRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobName: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  urgentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  smeName: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountLabel: { fontSize: 14 },
  amountValue: { fontSize: 16, fontWeight: "700" },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  milestoneLabel: { fontSize: 14 },
  milestoneValue: { fontSize: 14, fontWeight: "600" },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dueLabel: { fontSize: 14 },
  dueValue: { fontSize: 14, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 20,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 8,
  },
  timelineStage: {
    fontSize: 14,
    fontWeight: "500",
  },
  timelineDate: {
    fontSize: 12,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  specLabel: {
    width: 80,
    fontSize: 14,
  },
  specValue: {
    flex: 1,
    fontSize: 14,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  mapBtn: {
    alignSelf: "flex-start",
  },
  mapBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  messageBubble: {
    backgroundColor: "red",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  messageFrom: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  messageText: { fontSize: 14 },
  messageTime: {
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  chatBtn: {
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 15,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionBtnOutlineText: {
    fontWeight: "700",
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
