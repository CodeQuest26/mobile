import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const OrderCard = ({
  order,
  theme,
  delay,
}: {
  order: (typeof ACTIVE_ORDERS)[0];
  theme: any;
  delay: number;
}) => (
  <FadeIn delay={delay}>
    <View
      style={[
        styles.orderCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: order.urgent ? theme.primary + "60" : theme.border,
        },
      ]}
    >
      {/* Top */}
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          {order.urgent && (
            <View style={[styles.urgentPill, { backgroundColor: "#EF444415" }]}>
              <Ionicons name="flash" size={10} color="#EF4444" />
              <Text style={styles.urgentPillText}>Due soon</Text>
            </View>
          )}
          <Text style={[styles.orderJob, { color: theme.text }]}>
            {order.job}
          </Text>
          <Text style={[styles.orderSme, { color: theme.textSecondary }]}>
            {order.sme}
          </Text>
        </View>
        <Text style={[styles.orderAmount, { color: theme.primary }]}>
          {order.amount}
        </Text>
      </View>

      {/* Milestone badge */}
      <View style={styles.msRow}>
        <View
          style={[styles.msBadge, { backgroundColor: theme.primary + "15" }]}
        >
          <View style={[styles.msDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.msBadgeText, { color: theme.primary }]}>
            {order.milestoneLabel}
          </Text>
        </View>
        <Text style={[styles.dueText, { color: theme.textSecondary }]}>
          Due in {order.dueIn}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${order.progress * 100}%`,
              backgroundColor: order.urgent ? "#EF4444" : theme.primary,
            },
          ]}
        />
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressPct, { color: theme.textSecondary }]}>
          {Math.round(order.progress * 100)}% complete
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "../../(screens)/orderDetails",
              params: { id: order.id },
            })
          }
        >
          <Text style={[styles.viewLink, { color: theme.primary }]}>
            View →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </FadeIn>
);

export default OrderCard;

const styles = StyleSheet.create({
  orderCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  urgentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  urgentPillText: { fontSize: 10.5, fontWeight: "700", color: "#EF4444" },
  orderJob: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  orderSme: { fontSize: 12.5, marginTop: 2 },
  orderAmount: { fontSize: 15, fontWeight: "800" },
  msRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  msBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  msDot: { width: 6, height: 6, borderRadius: 3 },
  msBadgeText: { fontSize: 12, fontWeight: "600" },
  dueText: { fontSize: 12 },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPct: { fontSize: 11.5 },
  viewLink: { fontSize: 12.5, fontWeight: "700" },
});
