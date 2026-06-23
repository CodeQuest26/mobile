import Spacer from "@/components/Spacer";
import { BidStatus, BidWithManufacturer } from "@/constants/Jobstore";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FadeIn from "../common/FadeIn";
import StarRating from "./StarRating";

const BID_STATUS: Record<BidStatus, { label: string; icon: string }> = {
  pending: {
    label: "Pending",
    icon: "time-outline",
  },
  accepted: {
    label: "Accepted",
    icon: "checkmark-circle",
  },
  rejected: {
    label: "Rejected",
    icon: "close-circle",
  },
};

interface BidCardProps {
  bid: BidWithManufacturer;
  theme: any;
  delay?: number;
  onPress: () => void;
}

const BidCard = ({ bid, theme, delay = 0, onPress }: BidCardProps) => {
  const { manufacturer } = bid;
  const bidStatus = BID_STATUS[bid.status];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <FadeIn delay={delay}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={() =>
            Animated.spring(scaleAnim, {
              toValue: 0.975,
              useNativeDriver: true,
              speed: 40,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              speed: 30,
            }).start()
          }
          activeOpacity={1}
        >
          <View
            style={[
              styles.bidCard,
              {
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <View style={styles.bidCardHeader}>
              <View style={styles.bidManufacturerRow}>
                {/* Logo / initials */}
                {manufacturer.logo ? (
                  <Image
                    source={{ uri: manufacturer.logo }}
                    style={styles.bidLogo}
                  />
                ) : (
                  <View
                    style={[
                      styles.bidLogoPlaceholder,
                      { backgroundColor: theme.primary + "20" },
                    ]}
                  >
                    <Text
                      style={[styles.bidLogoInitials, { color: theme.primary }]}
                    >
                      {manufacturer.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </Text>
                  </View>
                )}

                <View style={styles.bidManufacturerInfo}>
                  {/* Name + verified icon inline */}
                  <View style={styles.bidNameRow}>
                    <Text
                      style={[
                        styles.bidManufacturerName,
                        { color: theme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {manufacturer.name}
                    </Text>

                    {manufacturer.verified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={theme.text}
                      />
                    )}
                  </View>

                  <View
                    style={[
                      styles.bidRatingRow,
                      { alignItems: "baseline", gap: 10 },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                      }}
                    >
                      <StarRating rating={manufacturer.rating} />
                      <Text
                        style={[
                          styles.bidRatingText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {manufacturer.rating}
                      </Text>
                    </View>

                    <View style={styles.bidLocationRow}>
                      <Ionicons
                        name="location-outline"
                        size={15}
                        color={theme.textSecondary}
                      />

                      <Text
                        style={[
                          styles.bidLocationText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {manufacturer.location}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bid status */}
              <View style={[styles.bidStatusPill]}>
                <Ionicons
                  name={bidStatus.icon as any}
                  size={13}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.bidStatusPillText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {bidStatus.label}
                </Text>
              </View>
            </View>

            {/* Key figures */}
            <View style={styles.bidFiguresRow}>
              <View style={styles.bidFigure}>
                <Text
                  style={[
                    styles.bidFigureLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Bid Amount
                </Text>
                <Text style={[styles.bidFigureValue, { color: theme.primary }]}>
                  {bid.amount}
                </Text>
              </View>

              <View
                style={[
                  styles.bidFigureDivider,
                  { backgroundColor: theme.border },
                ]}
              />

              <View style={styles.bidFigure}>
                <Text
                  style={[
                    styles.bidFigureLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Delivery
                </Text>
                <Text style={[styles.bidFigureValue, { color: theme.text }]}>
                  {bid.deliveryDays} days
                </Text>
              </View>
            </View>

            <Spacer style={{ height: 15 }} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </FadeIn>
  );
};

export default BidCard;

const styles = StyleSheet.create({
  bidCard: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  bidStatusAccentBar: {
    height: 3,
    width: "100%",
  },
  bidCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
  },
  bidManufacturerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  bidLogo: { width: 46, height: 46, borderRadius: 12 },
  bidLogoPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  bidLogoInitials: { fontSize: 16, fontWeight: "800" },
  bidManufacturerInfo: { flex: 1 },
  bidNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  bidManufacturerName: {
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  bidRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bidRatingText: { fontSize: 14, fontWeight: 500, marginLeft: 5 },
  bidLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  bidLocationText: { fontSize: 13, flex: 1, fontWeight: 500 },
  bidStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  bidStatusPillText: { fontSize: 12, fontWeight: "700" },
  bidFiguresRow: { flexDirection: "row" },
  bidFigure: { flex: 1, paddingVertical: 12, alignItems: "center" },
  bidFigureDivider: { width: 1 },
  bidFigureLabel: { fontSize: 11, fontWeight: "500", marginBottom: 3 },
  bidFigureValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
});
