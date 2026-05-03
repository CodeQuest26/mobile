import MainContainer from "@/components/MainContainer";
import { ThemedText } from "@/components/themed-text";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  React.useEffect(() => {
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

// Summary stat card component
interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
  theme: any;
  delay: number;
}

const StatCard = ({
  icon,
  label,
  value,
  color,
  theme,
  delay,
}: StatCardProps) => (
  <FadeIn delay={delay}>
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  </FadeIn>
);

// Activity item component
interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
  color: string;
  theme: any;
  delay: number;
}

const ActivityItem = ({
  icon,
  title,
  description,
  time,
  color,
  theme,
  delay,
}: ActivityItemProps) => (
  <FadeIn delay={delay}>
    <View
      style={[
        styles.activityItem,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View style={[styles.activityIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: theme.text }]}>
          {title}
        </Text>
        <Text style={[styles.activityDesc, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
        {time}
      </Text>
    </View>
  </FadeIn>
);

const SMEHome = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  // Mock data - replace with real data from API
  const stats = [
    {
      icon: "briefcase",
      label: "Active Jobs",
      value: "12",
      color: "#3B82F6",
    },
    {
      icon: "gift",
      label: "Pending Bids",
      value: "8",
      color: "#8B5CF6",
    },
    {
      icon: "wallet",
      label: "Total Spend",
      value: "¢2,45,000",
      color: "#EC4899",
    },
    {
      icon: "trending-up",
      label: "This Month",
      value: "+15%",
      color: "#10B981",
    },
  ];

  const recentActivity = [
    {
      icon: "checkmark-circle",
      title: "Bid Accepted",
      description: "Your bid for Product Assembly was accepted",
      time: "2h ago",
      color: "#10B981",
    },
    {
      icon: "alert-circle",
      title: "New Bid Received",
      description: "3 new bids received on your electronics job",
      time: "4h ago",
      color: "#3B82F6",
    },
    {
      icon: "document-text",
      title: "Job Posted",
      description: "New job created: Aluminum Machining",
      time: "1d ago",
      color: "#8B5CF6",
    },
    {
      icon: "person-add",
      title: "New Follower",
      description: "TechCorp Industries started following you",
      time: "2d ago",
      color: "#F59E0B",
    },
    {
      icon: "star",
      title: "5-Star Review",
      description: "Amazing quality and timely delivery!",
      time: "3d ago",
      color: "#FBBF24",
    },
  ];

  const time = new Date().getHours();
  const greeting = time < 12 ? "morning" : time < 16 ? "afternoon" : "evening";

  return (
    <MainContainer safe>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <ThemedText
                style={[styles.greeting, { color: theme.textSecondary }]}
              >
                Good {greeting} 👋
              </ThemedText>
              <Text style={[styles.companyName, { color: theme.text }]}>
                Tech Innovations Ltd
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push("/(screens)/(sme)/(screens)/notifications")
              }
              style={[
                styles.notificationIcon,
                { backgroundColor: theme.border },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.icon}
              />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Post a Job Button */}
        <FadeIn delay={100}>
          <TouchableOpacity
            onPress={() => {
              router.push("/(screens)/(sme)/(screens)/postJob");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.primary, "#2E9D5F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postJobButton}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color={theme.onPrimary}
                style={styles.postJobIcon}
              />
              <View>
                <Text style={[styles.postJobTitle, { color: theme.onPrimary }]}>
                  Post a New Job
                </Text>
                <Text
                  style={[
                    styles.postJobSubtitle,
                    { color: theme.onPrimary + "CC" },
                  ]}
                >
                  Get quotes from vetted SMEs
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.onPrimary}
                style={{ marginLeft: "auto" }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </FadeIn>

        {/* Stats Grid */}
        <FadeIn delay={150}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Overview
          </Text>
        </FadeIn>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              {...stat}
              theme={theme}
              delay={200 + index * 50}
            />
          ))}
        </View>

        {/* Recent Activity Section */}
        <FadeIn delay={400}>
          <View style={styles.activityHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        <View style={styles.activityList}>
          {recentActivity.map((activity, index) => (
            <ActivityItem
              key={activity.title}
              {...activity}
              theme={theme}
              delay={450 + index * 50}
            />
          ))}
        </View>
      </ScrollView>
    </MainContainer>
  );
};

export default SMEHome;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "700",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Post a Job Button
  postJobButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#4CB37E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  postJobIcon: {
    marginRight: 4,
  },
  postJobTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  postJobSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Stats Grid
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 16,
    marginVertical: 16,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Activity Section
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  activityList: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  activityDesc: {
    fontSize: 12,
    fontWeight: "400",
  },
  activityTime: {
    fontSize: 11,
    fontWeight: "500",
    flexShrink: 0,
  },
});
