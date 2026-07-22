import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

//  Types

export type Order = {
  id: string;
  job: string;
  sme: string;
  smeLogo: null | string;
  amount: string;
  milestone: number;
  milestoneLabel: string;
  dueIn: string;
  progress: number;
  urgent: boolean;
  jobImage?: string | null;
  rating?: number | null;
};

//  FadeIn
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

//  OrderCard
const OrderCard = ({
  order,
  theme,
  delay,
  onPress,
  onReviewPress,
}: {
  order: Order;
  theme: any;
  delay: number;
  onPress?: () => void;
  onReviewPress?: () => void;
}) => (
  <FadeIn delay={delay}>
    <TouchableOpacity
      onPress={
        onPress ??
        (() =>
          router.push({
            pathname: "/(screens)/(manufacturer)/(screens)/orderDetails",
            params: { id: order.id },
          }))
      }
      style={[
        styles.orderCard,
        {
          backgroundColor: theme.cardBackground,
        },
      ]}
    >
      {/* Top row */}
      <View style={styles.orderTop}>
        {order.jobImage && (
          <Image
            source={{ uri: order.jobImage }}
            style={styles.orderImage}
          />
        )}
        <View style={{ flex: 1 }}>
          {order.urgent && (
            <View style={[styles.urgentPill, { backgroundColor: "#EF444415" }]}>
              <Ionicons name="flash" size={10} color={theme.error} />
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
        <View style={styles.msRight}>
          {order.rating != null && order.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {order.rating.toFixed(1)}
              </Text>
            </View>
          )}
          <Text style={[styles.dueText, { color: theme.textSecondary }]}>
            {order.dueIn === "Completed" ? "Completed" : `Due in ${order.dueIn}`}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}> 
        <View
          style={[
            styles.progressFill,
            {
              width: `${order.progress * 100}%`,
              backgroundColor: order.urgent ? theme.error : theme.primary,
            },
          ]}
        />
      </View>

      {onReviewPress && order.progress >= 1 && (
        <TouchableOpacity
          onPress={onReviewPress}
          style={[styles.reviewButton, { borderColor: theme.primary }]}
        >
          <Ionicons name="star-outline" size={16} color={theme.primary} />
          <Text style={[styles.reviewButtonText, { color: theme.primary }]}>Review order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  </FadeIn>
);

export default OrderCard;

const styles = StyleSheet.create({
  orderCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  orderImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
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
  urgentPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#EF4444",
  },
  orderJob: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  orderSme: {
    fontSize: 12.5,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
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
  msDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  msBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dueText: {
    fontSize: 12,
  },
  msRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  reviewButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reviewButtonText: { fontSize: 13, fontWeight: "700" },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPct: {
    fontSize: 11.5,
  },
  viewLink: {
    fontSize: 12.5,
    fontWeight: "700",
  },
});
