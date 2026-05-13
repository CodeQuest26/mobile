import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { memo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface EnhancedJobPeek {
  id: string;
  product: string;
  quantity: string;
  budget: string;
  location: string;
  category?: string;
  image?: string;
  timeAgo?: string;
  rating?: number;
  bids?: number;
}

const JobPeekCard = memo(
  ({ job, theme }: { job: EnhancedJobPeek; theme: any }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.97);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    const handleLongPress = () => {
      opacity.value = withTiming(0.6, { duration: 150 });
      // Could show quick action menu (e.g., copy, share)
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 150 });
      }, 300);
    };

    const handleSave = () => {
      setIsSaved(!isSaved);
      // Trigger haptic feedback if available
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const defaultImage =
      "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=300&h=200&fit=crop";
    const imageUri = imageError || !job.image ? defaultImage : job.image;

    const category = job.category || "General";
    const timeAgo = job.timeAgo || "Now";
    const rating = job.rating ?? 4.5;
    const bids = job.bids ?? 0;

    return (
      <AnimatedTouchable
        activeOpacity={0.85}
        style={[
          styles.jobPeekCard,
          {
            backgroundColor: theme.cardBackground,
            shadowColor: theme.text,
          },
          animatedStyle,
        ]}
        onPress={() =>
          router.push({
            pathname: "/(screens)/(manufacturer)/(screens)/bidDetails",
            params: { id: job.id },
          })
        }
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.jobImage]}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />

          {imageLoading && (
            <View
              style={[styles.imageLoader, { backgroundColor: theme.border }]}
            >
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={styles.imageOverlay}
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <Text
            style={[styles.jobPeekTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {job.product}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="cube-outline"
                size={12}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {job.quantity}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {job.location}
              </Text>
            </View>
          </View>

          <View style={styles.budgetRow}>
            <Text style={[styles.jobPeekBudget, { color: theme.primary }]}>
              {job.budget}
            </Text>

            <View style={styles.timeContainer}>
              <Ionicons
                name="time-outline"
                size={12}
                color={theme.textSecondary}
              />
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {timeAgo}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedTouchable>
    );
  },
);

export default JobPeekCard;

const styles = StyleSheet.create({
  jobPeekCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    height: 120,
  },
  jobImage: {
    width: "100%",
    height: "100%",
  },
  imageLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  categoryPill: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  categoryText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  saveButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  contentContainer: {
    padding: 12,
  },
  jobPeekTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  detailText: {
    fontSize: 11,
    flexShrink: 1,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  jobPeekBudget: {
    fontSize: 14,
    fontWeight: "800",
  },
  bidsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bidsText: {
    fontSize: 11,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
});
