// src/app/(screens)/(manufacturer)/(screens)/OrderDetailScreen.tsx
import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// Mock function to fetch order details by ID
const getOrderDetails = (id: string) => {
  // In real app, fetch from API
  const orders = {
    o1: {
      id: "o1",
      job: "Aluminium Cans",
      sme: "AfroDrinks Ltd",
      smeLogo: null,
      amount: "GH₵ 52,000",
      milestone: 2,
      milestoneLabel: "Quality Check",
      dueIn: "3 days",
      progress: 0.65,
      urgent: true,
      description:
        "Production of 10,000 aluminium beverage cans with custom branding.",
      specifications:
        "Material: 3004 aluminium, thickness 0.25mm, diameter 66mm, height 115mm",
      quantity: "10,000 units",
      deliveryAddress: "AfroDrinks Factory, Spintex Road, Accra",
      timeline: [
        { stage: "Order Confirmed", date: "2025-04-01", completed: true },
        { stage: "Raw Materials", date: "2025-04-05", completed: true },
        { stage: "Production", date: "2025-04-10", completed: true },
        { stage: "Quality Check", date: "2025-04-15", completed: false },
        { stage: "Delivery", date: "2025-04-20", completed: false },
      ],
      messages: [
        {
          from: "SME",
          message: "Can we speed up delivery?",
          timestamp: "2025-04-12 10:23",
        },
        {
          from: "Manufacturer",
          message: "We're on track for quality check.",
          timestamp: "2025-04-12 14:15",
        },
      ],
    },
    o2: {
      /* similar structure */
    },
    c1: {
      /* completed order structure */
    },
  };
  return orders[id as keyof typeof orders] || null;
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";

  const [order, setOrder] = useState(() => getOrderDetails(id));

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
      <StatusBar barStyle={"default"} />
      <MainContainer safe>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with back button */}
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

          {/* Job Title & Status */}
          <FadeIn delay={0}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.jobRow}>
                <Text style={[styles.jobName, { color: theme.text }]}>
                  {order.job}
                </Text>
                {order.urgent && (
                  <View
                    style={[
                      styles.urgentBadge,
                      { backgroundColor: "#EF444420" },
                    ]}
                  >
                    <Text style={[styles.urgentText, { color: "#EF4444" }]}>
                      Urgent
                    </Text>
                  </View>
                )}
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

          {/* Progress Section */}
          <FadeIn delay={80}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Progress
              </Text>
              <View style={styles.progressBarContainer}>
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
                  borderColor: theme.border,
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
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: theme.border },
                      ]}
                    />
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

          {/* Order Details */}
          <FadeIn delay={160}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
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
                  borderColor: theme.border,
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

          {/* Messages */}
          <FadeIn delay={240}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Conversation
              </Text>
              {order.messages.map((msg, idx) => (
                <View key={idx} style={styles.messageBubble}>
                  <Text style={[styles.messageFrom, { color: theme.primary }]}>
                    {msg.from}
                  </Text>
                  <Text
                    style={[styles.messageText, { color: theme.textSecondary }]}
                  >
                    {msg.message}
                  </Text>
                  <Text
                    style={[styles.messageTime, { color: theme.textSecondary }]}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.chatBtn, { borderColor: theme.primary }]}
                onPress={() => router.push(`/chat/${order.sme}` as any)} // adjust route
              >
                <Text style={[styles.chatBtnText, { color: theme.primary }]}>
                  Open Chat
                </Text>
              </TouchableOpacity>
            </View>
          </FadeIn>

          {/* Action Buttons (if active) */}
          {!isCompleted && (
            <FadeIn delay={280}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => console.log("Update milestone")}
                >
                  <Text style={styles.actionBtnText}>Mark Next Milestone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtnOutline,
                    { borderColor: theme.primary },
                  ]}
                  onPress={() => console.log("Contact support")}
                >
                  <Text
                    style={[
                      styles.actionBtnOutlineText,
                      { color: theme.primary },
                    ]}
                  >
                    Report Issue
                  </Text>
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
    marginVertical: 16,
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
    borderWidth: 1,
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
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  milestoneLabel: {
    fontSize: 14,
  },
  milestoneValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dueLabel: {
    fontSize: 14,
  },
  dueValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
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
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  messageFrom: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
  },
  messageTime: {
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  chatBtn: {
    borderWidth: 1,
    borderRadius: 30,
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
    borderRadius: 30,
    paddingVertical: 12,
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
