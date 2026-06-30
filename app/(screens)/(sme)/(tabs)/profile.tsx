// import MainContainer from "@/components/MainContainer";
// import Colors from "@/constants/colors";
// import { Ionicons } from "@expo/vector-icons";
// import React, { useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Switch,
//   Text,
//   TouchableOpacity,
//   useColorScheme,
//   View,
// } from "react-native";

// const Profile = () => {
//   const colorScheme = useColorScheme();
//   const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

//   const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");
//   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleResetPassword = () => {
//     Alert.alert(
//       "Reset Password",
//       "A password reset link will be sent to your email",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Send",
//           onPress: () => {
//             setIsLoading(true);
//             setTimeout(() => {
//               setIsLoading(false);
//               Alert.alert("Success", "Password reset link sent to your email");
//             }, 1000);
//           },
//         },
//       ],
//     );
//   };

//   const handleLogout = () => {
//     Alert.alert("Log Out", "Are you sure you want to log out?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Log Out",
//         style: "destructive",
//         onPress: () => {
//           setIsLoading(true);
//           setTimeout(() => {
//             setIsLoading(false);
//           }, 1000);
//         },
//       },
//     ]);
//   };

//   const handleDeleteAccount = () => {
//     Alert.alert(
//       "Delete Account",
//       "This action cannot be undone. All your data will be permanently deleted.",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: () => {
//             setIsLoading(true);
//             setTimeout(() => {
//               setIsLoading(false);
//             }, 1000);
//           },
//         },
//       ],
//     );
//   };

//   return (
//     <MainContainer safe>
//       <ScrollView
//         style={styles.container}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Identity Band */}
//         <View
//           style={[styles.identityBand, { borderBottomColor: theme.border }]}
//         >
//           {/* Monogram Avatar */}
//           <View
//             style={[styles.monogram, { backgroundColor: theme.iconBackground }]}
//           >
//             <Text style={[styles.monogramText, { color: theme.primary }]}>
//               CN
//             </Text>
//           </View>

//           {/* Company Info */}
//           <View style={styles.identityText}>
//             <Text style={[styles.companyName, { color: theme.text }]}>
//               Company Name
//             </Text>
//             <View style={styles.locationRow}>
//               <Ionicons
//                 name="location-outline"
//                 size={12}
//                 color={theme.textSecondary}
//               />
//               <Text
//                 style={[styles.locationText, { color: theme.textSecondary }]}
//               >
//                 Location
//               </Text>
//             </View>
//           </View>

//           {/* Edit Button */}
//           <TouchableOpacity
//             style={[styles.editBtn, { borderColor: theme.border }]}
//           >
//             <Ionicons
//               name="pencil-outline"
//               size={13}
//               color={theme.textSecondary}
//             />
//             <Text style={[styles.editBtnText, { color: theme.textSecondary }]}>
//               Edit
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Account Section */}
//         <View style={styles.section}>
//           <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
//             Account
//           </Text>

//           <View
//             style={[
//               styles.sectionCard,
//               { backgroundColor: theme.cardBackground },
//             ]}
//           >
//             {/* Email */}
//             <View style={styles.row}>
//               <View
//                 style={[
//                   styles.rowIcon,
//                   { backgroundColor: theme.iconBackground },
//                 ]}
//               >
//                 <Ionicons name="mail" size={16} color={theme.icon} />
//               </View>
//               <View style={styles.rowBody}>
//                 <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
//                   Email
//                 </Text>
//                 <Text style={[styles.rowValue, { color: theme.text }]}>
//                   user@example.com
//                 </Text>
//               </View>
//             </View>

//             <View style={[styles.divider, { backgroundColor: theme.border }]} />

//             {/* Phone */}
//             <View style={styles.row}>
//               <View
//                 style={[
//                   styles.rowIcon,
//                   { backgroundColor: theme.iconBackground },
//                 ]}
//               >
//                 <Ionicons name="call" size={16} color={theme.icon} />
//               </View>
//               <View style={styles.rowBody}>
//                 <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
//                   Phone
//                 </Text>
//                 <Text style={[styles.rowValue, { color: theme.text }]}>
//                   +233 55 123 4567
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Preferences Section */}
//         <View style={styles.section}>
//           <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
//             Preferences
//           </Text>

//           <View
//             style={[
//               styles.sectionCard,
//               { backgroundColor: theme.cardBackground },
//             ]}
//           >
//             {/* Dark Mode */}
//             {/* <View style={styles.row}>
//               <View
//                 style={[
//                   styles.rowIcon,
//                   { backgroundColor: theme.iconBackground },
//                 ]}
//               >
//                 <Ionicons
//                   name={isDarkMode ? "moon" : "sunny"}
//                   size={16}
//                   color={theme.icon}
//                 />
//               </View>

//               <View style={styles.rowBody}>
//                 <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
//                   Appearance
//                 </Text>
//                 <Text style={[styles.rowValue, { color: theme.text }]}>
//                   Dark mode
//                 </Text>
//               </View>

//               <Switch
//                 value={isDarkMode}
//                 onValueChange={setIsDarkMode}
//                 trackColor={{ false: "#E0E0E0", true: theme.primary }}
//                 thumbColor={isDarkMode ? theme.onPrimary : "#F0F0F0"}
//               />
//             </View> */}

//             <View style={[styles.divider, { backgroundColor: theme.border }]} />

//             {/* Notifications */}
//             <View style={styles.row}>
//               <View
//                 style={[
//                   styles.rowIcon,
//                   { backgroundColor: theme.iconBackground },
//                 ]}
//               >
//                 <Ionicons
//                   name={
//                     notificationsEnabled ? "notifications" : "notifications-off"
//                   }
//                   size={16}
//                   color={theme.icon}
//                 />
//               </View>
//               <View style={styles.rowBody}>
//                 <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
//                   Notifications
//                 </Text>
//                 <Text style={[styles.rowValue, { color: theme.text }]}>
//                   {notificationsEnabled ? "Push & email" : "Disabled"}
//                 </Text>
//               </View>
//               <Switch
//                 value={notificationsEnabled}
//                 onValueChange={setNotificationsEnabled}
//                 trackColor={{ false: "#E0E0E0", true: theme.primary }}
//                 thumbColor={notificationsEnabled ? theme.onPrimary : "#F0F0F0"}
//               />
//             </View>

//             <View style={[styles.divider, { backgroundColor: theme.border }]} />

//             {/* Reset Password */}
//             <TouchableOpacity
//               disabled={isLoading}
//               onPress={handleResetPassword}
//               style={styles.row}
//             >
//               <View
//                 style={[
//                   styles.rowIcon,
//                   { backgroundColor: theme.iconBackground },
//                 ]}
//               >
//                 <Ionicons name="key" size={16} color={theme.icon} />
//               </View>
//               <View style={styles.rowBody}>
//                 <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
//                   Security
//                 </Text>
//                 <Text style={[styles.rowValue, { color: theme.text }]}>
//                   Reset password
//                 </Text>
//               </View>
//               <Ionicons
//                 name="chevron-forward"
//                 size={16}
//                 color={theme.textSecondary}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Account Actions Section */}
//         <View style={styles.section}>
//           <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
//             Account actions
//           </Text>

//           <View
//             style={[
//               styles.sectionCard,
//               { backgroundColor: theme.cardBackground },
//             ]}
//           >
//             {/* Log Out */}
//             <TouchableOpacity
//               disabled={isLoading}
//               onPress={handleLogout}
//               style={[styles.row, { opacity: isLoading ? 0.6 : 1 }]}
//             >
//               {isLoading ? (
//                 <ActivityIndicator
//                   color={theme.primary}
//                   style={styles.actionLoader}
//                 />
//               ) : (
//                 <>
//                   <View
//                     style={[
//                       styles.rowIcon,
//                       { backgroundColor: theme.iconBackground },
//                     ]}
//                   >
//                     <Ionicons name="log-out" size={16} color={theme.primary} />
//                   </View>
//                   <View style={styles.rowBody}>
//                     <Text style={[styles.rowValue, { color: theme.primary }]}>
//                       Log out
//                     </Text>
//                   </View>
//                   <Ionicons
//                     name="chevron-forward"
//                     size={16}
//                     color={theme.textSecondary}
//                   />
//                 </>
//               )}
//             </TouchableOpacity>

//             <View style={[styles.divider, { backgroundColor: theme.border }]} />

//             {/* Delete Account */}
//             <TouchableOpacity
//               disabled={isLoading}
//               onPress={handleDeleteAccount}
//               style={[styles.row, { opacity: isLoading ? 0.6 : 1 }]}
//             >
//               {isLoading ? (
//                 <ActivityIndicator
//                   color={theme.error}
//                   style={styles.actionLoader}
//                 />
//               ) : (
//                 <>
//                   <View
//                     style={[
//                       styles.rowIcon,
//                       { backgroundColor: theme.iconBackground },
//                     ]}
//                   >
//                     <Ionicons name="trash" size={16} color={theme.error} />
//                   </View>
//                   <View style={styles.rowBody}>
//                     <Text style={[styles.rowValue, { color: theme.error }]}>
//                       Delete account
//                     </Text>
//                   </View>
//                   <Ionicons
//                     name="chevron-forward"
//                     size={16}
//                     color={theme.textSecondary}
//                   />
//                 </>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={{ height: 60 }} />
//       </ScrollView>
//     </MainContainer>
//   );
// };

// export default Profile;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 32,
//   },

//   /* Identity band */
//   identityBand: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 14,
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//   },
//   monogram: {
//     width: 54,
//     height: 54,
//     borderRadius: 14,
//     justifyContent: "center",
//     alignItems: "center",
//     flexShrink: 0,
//   },
//   monogramText: {
//     fontSize: 20,
//     fontWeight: "600",
//   },
//   identityText: {
//     flex: 1,
//     minWidth: 0,
//   },
//   companyName: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 3,
//   },
//   locationRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 3,
//   },
//   locationText: {
//     fontSize: 12,
//     fontWeight: "500",
//   },
//   editBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//     flexShrink: 0,
//   },
//   editBtnText: {
//     fontSize: 13,
//     fontWeight: "500",
//   },

//   /* Sections */
//   section: {
//     paddingHorizontal: 20,
//     paddingTop: 24,
//   },
//   sectionLabel: {
//     fontSize: 11,
//     fontWeight: "600",
//     letterSpacing: 0.7,
//     textTransform: "uppercase",
//     marginBottom: 10,
//   },
//   sectionCard: {
//     borderRadius: 12,
//     overflow: "hidden",
//   },

//   /* Rows */
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//   },
//   rowIcon: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     flexShrink: 0,
//   },
//   rowBody: {
//     flex: 1,
//     minWidth: 0,
//   },
//   rowLabel: {
//     fontSize: 11,
//     fontWeight: "500",
//     marginBottom: 1,
//   },
//   rowValue: {
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   divider: {
//     height: StyleSheet.hairlineWidth,
//     marginLeft: 58,
//   },
//   actionLoader: {
//     flex: 1,
//     paddingVertical: 4,
//   },
// });

import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 200;

type Theme = (typeof Colors)["light"];

const SME_PROFILE = {
  companyName: "Company Name",
  initials: "CN",
  verified: false,
  bio: "",
  city: "Location",
  region: "",
  email: "user@example.com",
  phone: "+233 55 123 4567",
  avatarUri: null as string | null,
  coverUri: null as string | null,
};

// ── Info Row ──────────────────────────────────────────────────
const InfoRow = ({
  icon,
  label,
  value,
  theme,
  last,
  onPress,
  loading,
  destructive,
}: {
  icon: string;
  label: string;
  value: string;
  theme: Theme;
  last?: boolean;
  onPress?: () => void;
  loading?: boolean;
  destructive?: boolean;
}) => {
  const tint = destructive ? theme.error : theme.primary;

  if (loading) {
    return (
      <View
        style={[
          styles.infoRow,
          !last && {
            borderBottomWidth: 1,
            borderBottomColor: theme.border + "60",
          },
        ]}
      >
        <ActivityIndicator
          color={tint}
          style={{ flex: 1, paddingVertical: 2 }}
        />
      </View>
    );
  }

  const content = (
    <>
      <View style={styles.infoLeft}>
        <View
          style={[
            styles.infoIconWrap,
            { backgroundColor: theme.iconBackground },
          ]}
        >
          <Ionicons name={icon as any} size={20} color={theme.icon} />
        </View>
        <Text
          style={[
            styles.infoLabel,
            { color: destructive ? tint : theme.textSecondary },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.infoRight}>
        <Text
          style={[styles.infoValue, { color: destructive ? tint : theme.text }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.textSecondary}
          />
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[
          styles.infoRow,
          !last && {
            borderBottomWidth: 1,
            borderBottomColor: theme.border + "60",
          },
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.infoRow,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: theme.border + "60",
        },
      ]}
    >
      {content}
    </View>
  );
};

// ── Section ────────────────────────────────────────────────────
const Section = ({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: Theme;
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
    {children}
  </View>
);

// ── Main Screen ──────────────────────────────────────────────
export default function SMEProfile() {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState<
    "logout" | "delete" | "reset" | null
  >(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const p = SME_PROFILE;

  const handleResetPassword = () => {
    Alert.alert(
      "Reset Password",
      "A password reset link will be sent to your email",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            setIsLoading("reset");
            setTimeout(() => {
              setIsLoading(null);
              Alert.alert("Success", "Password reset link sent to your email");
            }, 1000);
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          setIsLoading("logout");
          setTimeout(() => {
            setIsLoading(null);
            router.replace("/(auth)/login");
          }, 1000);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setIsLoading("delete");
            setTimeout(() => {
              setIsLoading(null);
            }, 1000);
          },
        },
      ],
    );
  };

  // Nav dynamic blur configs
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0.4, 1],
    extrapolate: "clamp",
  });

  const coverScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [2, 1],
    extrapolateRight: "clamp",
  });

  const coverTranslateY = scrollY.interpolate({
    inputRange: [-200, 0, COVER_HEIGHT],
    outputRange: [-100, 0, COVER_HEIGHT * 0.5],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ── Dynamic Top Bar Floating Navigation ── */}
      <Animated.View
        style={[
          styles.headerBlur,
          { opacity: headerOpacity, borderBottomColor: theme.border },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 100}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {p.companyName}
          </Text>
        </View>
      </Animated.View>

      {/* Floating Buttons */}
      <View
        style={[
          styles.navActionWrapper,
          { top: Platform.OS === "ios" ? 54 : 40 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.navBtn,
            { backgroundColor: theme.cardBackground + "E0" },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(screens)/(sme)/(screens)/editProfile")}
          style={[
            styles.navBtn,
            { backgroundColor: theme.cardBackground + "E0" },
          ]}
        >
          <Ionicons name="pencil-sharp" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* ── Background Canvas Parallax Cover ── */}
      <Animated.View
        style={[
          styles.coverContainer,
          {
            transform: [{ scale: coverScale }, { translateY: coverTranslateY }],
          },
        ]}
      >
        {p.coverUri ? (
          <Image source={{ uri: p.coverUri }} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={[theme.primary + "25", theme.primary + "05"]}
            style={styles.coverImage}
          />
        )}
      </Animated.View>

      {/* ── Scrollable Body Context ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.mainCardPositioner}>
          {/* Main Integrated Profile Master Card */}
          <View
            style={[
              styles.profileMasterCard,
              {
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            {/* Avatar Section Frame */}
            <View
              style={[
                styles.avatarBoundary,
                {
                  borderColor: theme.cardBackground,
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              {p.avatarUri ? (
                <Image source={{ uri: p.avatarUri }} style={styles.avatar} />
              ) : (
                <View
                  style={[styles.avatar, { backgroundColor: theme.primary }]}
                >
                  <Text
                    style={[styles.avatarInitials, { color: theme.onPrimary }]}
                  >
                    {p.initials}
                  </Text>
                </View>
              )}
            </View>

            {/* Profile Info Details */}
            <View style={styles.metaInformation}>
              <View style={styles.titleLine}>
                <Text style={[styles.companyName, { color: theme.text }]}>
                  {p.companyName}
                </Text>
                {p.verified && (
                  <View
                    style={[
                      styles.verifiedBadge,
                      { backgroundColor: theme.primary + "12" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={theme.primary}
                    />
                  </View>
                )}
              </View>

              <View style={styles.subDetailRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.subDetailText, { color: theme.textSecondary }]}
                >
                  {p.region ? `${p.city}, ${p.region}` : p.city}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Details Module */}
          <Section title="Account" theme={theme}>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <InfoRow
                icon="mail-outline"
                label="Email"
                value={p.email}
                theme={theme}
              />
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={p.phone}
                theme={theme}
                last
              />
            </View>
          </Section>

          {/* Preferences Module */}
          <Section title="Preferences" theme={theme}>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.toggleConfigRow,
                  {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border + "40",
                  },
                ]}
              >
                <View style={styles.toggleLeft}>
                  <View
                    style={[
                      styles.configIconWrap,
                      { backgroundColor: theme.primary + "0A" },
                    ]}
                  >
                    <Ionicons
                      name={
                        notifications ? "notifications" : "notifications-off"
                      }
                      size={16}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.configLabel, { color: theme.text }]}>
                    Notifications
                  </Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{
                    false: theme.border,
                    true: theme.primary + "60",
                  }}
                  thumbColor={notifications ? theme.primary : "#F4F3F4"}
                />
              </View>

              <InfoRow
                icon="key-outline"
                label="Security"
                value="Reset password"
                theme={theme}
                onPress={handleResetPassword}
                loading={isLoading === "reset"}
                last
              />
            </View>
          </Section>

          {/* Account Actions Module */}
          <Section title="Account actions" theme={theme}>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <InfoRow
                icon="log-out-outline"
                label=""
                value="Log out"
                theme={theme}
                onPress={handleLogout}
                loading={isLoading === "logout"}
              />
              <InfoRow
                icon="trash-outline"
                label=""
                value="Delete account"
                theme={theme}
                onPress={handleDeleteAccount}
                loading={isLoading === "delete"}
                destructive
                last
              />
            </View>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 94 : 80,
    zIndex: 40,
    borderBottomWidth: 0.5,
    justifyContent: "flex-end",
  },
  headerContent: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 70,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  navActionWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  coverContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: COVER_HEIGHT,
    zIndex: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    paddingTop: COVER_HEIGHT - 40,
    paddingBottom: 40,
  },
  mainCardPositioner: {
    paddingHorizontal: 16,
  },
  profileMasterCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  avatarBoundary: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    marginTop: -64,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  metaInformation: {
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  subDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  subDetailText: {
    fontSize: 13,
    marginLeft: 3,
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "flex-end",
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    maxWidth: "80%",
  },
  toggleConfigRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  configIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  configLabel: {
    fontSize: 13.5,
    fontWeight: "500",
  },
});
