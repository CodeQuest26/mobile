// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { router } from "expo-router";
// import React, { memo, useState } from "react";
// import {
//   ActivityIndicator,
//   Dimensions,
//   Image,
//   ImageSourcePropType,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
//   withTiming,
// } from "react-native-reanimated";

// const { width } = Dimensions.get("window");
// const CARD_WIDTH = (width - 48) / 2;

// const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// interface EnhancedJobPeek {
//   id: string;
//   product: string;
//   quantity: string;
//   budget: string;
//   location: string;
//   category?: string;
//   image?: string;
//   timeAgo?: string;
//   rating?: number;
//   bids?: number;
// }

// const JobPeekCard = memo(
//   ({ job, theme }: { job: EnhancedJobPeek; theme: any }) => {
//     const [isSaved, setIsSaved] = useState(false);
//     const [imageLoading, setImageLoading] = useState(true);
//     const [imageError, setImageError] = useState(false);
//     const scale = useSharedValue(1);
//     const opacity = useSharedValue(1);

//     const animatedStyle = useAnimatedStyle(() => ({
//       transform: [{ scale: scale.value }],
//       opacity: opacity.value,
//     }));

//     const handlePressIn = () => {
//       scale.value = withSpring(0.97);
//     };

//     const handlePressOut = () => {
//       scale.value = withSpring(1);
//     };

//     const handleLongPress = () => {
//       opacity.value = withTiming(0.6, { duration: 150 });
//       setTimeout(() => {
//         opacity.value = withTiming(1, { duration: 150 });
//       }, 300);
//     };

//     const handleSave = () => {
//       setIsSaved(!isSaved);
//     };

//     const defaultImage: ImageSourcePropType = require("../assets/images/factory.jpeg");
//     const imageSource: ImageSourcePropType =
//       imageError || !job.image ? defaultImage : { uri: job.image };

//     return (
//       <AnimatedTouchable
//         activeOpacity={0.85}
//         style={[
//           styles.jobPeekCard,
//           {
//             backgroundColor: theme.cardBackground,
//           },
//           animatedStyle,
//         ]}
//         onPress={() =>
//           router.push({
//             pathname: "/(screens)/(manufacturer)/(screens)/bidDetails",
//             params: { id: job.id },
//           })
//         }
//         onPressIn={handlePressIn}
//         onPressOut={handlePressOut}
//         onLongPress={handleLongPress}
//         delayLongPress={500}
//       >
//         {/* Image Section */}
//         <View style={styles.imageContainer}>
//           <Image
//             source={imageSource}
//             style={styles.jobImage}
//             resizeMode="cover"
//             onLoadStart={() => setImageLoading(true)}
//             onLoadEnd={() => setImageLoading(false)}
//             onError={() => {
//               setImageError(true);
//               setImageLoading(false);
//             }}
//           />

//           {imageLoading && (
//             <View
//               style={[styles.imageLoader, { backgroundColor: theme.border }]}
//             >
//               <ActivityIndicator size="small" color={theme.primary} />
//             </View>
//           )}
//           <LinearGradient
//             colors={["transparent", "rgba(0,0,0,0.6)"]}
//             style={styles.imageOverlay}
//           />
//         </View>

//         {/* Content Section */}
//         <View style={styles.contentContainer}>
//           <Text
//             style={[styles.jobPeekTitle, { color: theme.text }]}
//             numberOfLines={2}
//           >
//             {job.product}
//           </Text>

//           <View style={[styles.budgetRow, { marginBottom: 5 }]}>
//             <Ionicons name="pricetag" size={15} color={theme.primary} />

//             <Text
//               style={[
//                 styles.jobPeekBudget,
//                 { color: theme.text, marginLeft: 5 },
//               ]}
//             >
//               {job.budget.split("-")[0].trim()}
//             </Text>
//           </View>

//           <View style={styles.detailsRow}>
//             <View style={styles.detailItem}>
//               <Ionicons name="albums" size={16} color={theme.primary} />

//               <Text
//                 style={[
//                   styles.detailText,
//                   {
//                     color: theme.text,
//                     fontSize: 14,
//                     fontWeight: "600",
//                   },
//                 ]}
//                 numberOfLines={1}
//               >
//                 {job.category}
//               </Text>
//             </View>
//           </View>
//         </View>
//       </AnimatedTouchable>
//     );
//   },
// );

// export default JobPeekCard;

// const styles = StyleSheet.create({
//   jobPeekCard: {
//     width: CARD_WIDTH,
//     borderRadius: 20,
//     overflow: "hidden",
//     marginBottom: 16,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//   },
//   imageContainer: {
//     position: "relative",
//     height: 120,
//   },
//   jobImage: {
//     width: "100%",
//     height: "100%",
//   },
//   imageLoader: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   imageOverlay: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 60,
//   },
//   categoryPill: {
//     position: "absolute",
//     top: 10,
//     left: 10,
//     backgroundColor: "rgba(0,0,0,0.7)",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//     zIndex: 2,
//   },
//   categoryText: {
//     color: "#fff",
//     fontSize: 10,
//     fontWeight: "600",
//     textTransform: "uppercase",
//   },
//   saveButton: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 2,
//   },
//   contentContainer: {
//     padding: 12,
//   },
//   jobPeekTitle: {
//     fontSize: 15,
//     fontWeight: "700",
//     lineHeight: 20,
//     marginBottom: 8,
//   },
//   detailsRow: {
//     flexDirection: "row",
//     gap: 12,
//     marginBottom: 10,
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     flexShrink: 1,
//   },
//   detailText: {
//     fontSize: 14,
//     fontWeight: "500",
//     flexShrink: 1,
//   },
//   budgetRow: {
//     flexDirection: "row",
//     justifyContent: "flex-start",
//     alignItems: "center",
//     marginBottom: 0,
//   },
//   jobPeekBudget: {
//     fontSize: 14,
//     fontWeight: "800",
//   },
// });

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { memo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

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

// The old split("-")[0] silently broke on budgets formatted with an en
// dash ("GHS 100 – 500"), since "-" only matches a plain hyphen. This
// handles either character.
const budgetFloor = (budget: string) => budget.split(/[-–]/)[0].trim();

const JobPeekCard = memo(
  ({ job, theme }: { job: EnhancedJobPeek; theme: any }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const scale = useSharedValue(1);
    const stampRotate = useSharedValue(-6);
    const saveScale = useSharedValue(1);

    const cardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const stampStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${stampRotate.value}deg` }],
    }));

    const saveStyle = useAnimatedStyle(() => ({
      transform: [{ scale: saveScale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.97, { damping: 14 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 14 });
    };

    // Long-press now reads like the stamp actually getting hit, rather
    // than a generic opacity flash.
    const handleLongPress = () => {
      stampRotate.value = withSequence(
        withTiming(-2, { duration: 90 }),
        withSpring(-6, { damping: 6 }),
      );
    };

    const handleSave = () => {
      setIsSaved((prev) => !prev);
      saveScale.value = withSequence(
        withTiming(1.25, { duration: 100 }),
        withSpring(1, { damping: 8 }),
      );
    };

    const defaultImage: ImageSourcePropType = require("../assets/images/factory.jpeg");
    const imageSource: ImageSourcePropType =
      imageError || !job.image ? defaultImage : { uri: job.image };

    return (
      <AnimatedTouchable
        activeOpacity={0.9}
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground },
          cardStyle,
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
        {/* ── Photo ── */}
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.jobImage}
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
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.imageOverlay}
          />

          {job.timeAgo && (
            <View style={styles.timeAgoRow}>
              <Ionicons name="time-outline" size={11} color={theme.onPrimary} />
              <Text style={styles.timeAgoText}>{job.timeAgo}</Text>
            </View>
          )}

          {job.category && (
            <AnimatedView
              style={[styles.stamp, { borderColor: theme.primary }, stampStyle]}
            >
              <Text
                style={[styles.stampText, { color: theme.primary }]}
                numberOfLines={1}
              >
                {job.category}
              </Text>
            </AnimatedView>
          )}

          {/* <TouchableOpacity
            onPress={handleSave}
            hitSlop={8}
            style={styles.saveButton}
          >
            <AnimatedView style={saveStyle}>
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={16}
                color={theme.onPrimary}
              />
            </AnimatedView>
          </TouchableOpacity> */}
        </View>

        <View style={styles.perforationRow}>
          <View
            style={[
              styles.notch,
              styles.notchLeft,
              { backgroundColor: theme.background },
            ]}
          />
          <View style={[styles.dashLine, { borderColor: theme.border }]} />
          <View
            style={[
              styles.notch,
              styles.notchRight,
              { backgroundColor: theme.background },
            ]}
          />
        </View>

        {/* ── Ticket details ── */}
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {job.product}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons
              name="cube-outline"
              size={12}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.metaText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {job.quantity}
            </Text>
          </View>

          <View style={styles.metaRow}>
            {!!job.location && (
              <>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.textSecondary, flex: 1 },
                  ]}
                  numberOfLines={1}
                >
                  {job.location}
                </Text>
              </>
            )}
          </View>

          <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
            <View>
              <Text style={[styles.budgetValue, { color: theme.primary }]}>
                {budgetFloor(job.budget)}
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
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  // Photo
  imageContainer: { position: "relative", height: 112 },
  jobImage: { width: "100%", height: "100%" },
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
    height: 44,
  },
  timeAgoRow: {
    position: "absolute",
    bottom: 6,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  timeAgoText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  // Stamp — the signature element: a rotated, dashed-border ink stamp
  // instead of a generic filled pill for the category tag.
  stamp: {
    position: "absolute",
    top: 10,
    left: 10,
    borderWidth: 1.4,
    borderStyle: "dashed",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: CARD_WIDTH * 0.6,
  },
  stampText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
  },

  saveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tear line
  perforationRow: {
    height: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: -6,
  },
  dashLine: {
    flex: 1,
    borderTopWidth: 1.4,
    borderStyle: "dashed",
    opacity: 0.6,
  },
  notch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  notchLeft: { marginLeft: -6 },
  notchRight: { marginRight: -6 },

  // Ticket details
  contentContainer: { padding: 12, paddingTop: 4 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 10,
  },
  metaText: { fontSize: 11, fontWeight: "500" },
  metaDot: { fontSize: 11, marginHorizontal: 1 },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  budgetLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
  },
  footerStats: { flexDirection: "row", gap: 5 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statText: { fontSize: 10, fontWeight: "700" },
});
