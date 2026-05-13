// src/app/(tabs)/manufacturer/Orders.tsx
import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import OrderCard from "@/components/OrderCard"; // adjust path if needed
import Colors from "@/constants/colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Mock data – extend with completed orders
const ACTIVE_ORDERS = [
  {
    id: "o1",
    job: "Aluminium Cans",
    sme: "AfroDrinks Ltd",
    amount: "GH₵ 52,000",
    milestone: 2,
    milestoneLabel: "Quality Check",
    dueIn: "3 days",
    progress: 0.65,
    urgent: true,
  },
  {
    id: "o2",
    job: "Steel Frames",
    sme: "BuildRight Ghana",
    amount: "GH₵ 28,000",
    milestone: 1,
    milestoneLabel: "In Production",
    dueIn: "12 days",
    progress: 0.35,
    urgent: false,
  },
  {
    id: "o3",
    job: "Copper Wiring",
    sme: "Volta Electricals",
    amount: "GH₵ 15,500",
    milestone: 3,
    milestoneLabel: "Final Assembly",
    dueIn: "6 days",
    progress: 0.85,
    urgent: false,
  },
];

const COMPLETED_ORDERS = [
  {
    id: "c1",
    job: "Plastic Moulds",
    sme: "Kama Plastics",
    amount: "GH₵ 32,000",
    milestone: 4,
    milestoneLabel: "Delivered",
    dueIn: "Completed",
    progress: 1.0,
    urgent: false,
  },
  {
    id: "c2",
    job: "Glass Bottles",
    sme: "Accra Brewery",
    amount: "GH₵ 47,200",
    milestone: 4,
    milestoneLabel: "Paid",
    dueIn: "Completed",
    progress: 1.0,
    urgent: false,
  },
  {
    id: "c3",
    job: "Cardboard Boxes",
    sme: "LogiPack",
    amount: "GH₵ 8,750",
    milestone: 4,
    milestoneLabel: "Delivered",
    dueIn: "Completed",
    progress: 1.0,
    urgent: false,
  },
];

type TabType = "active" | "completed";

export default function ManufacturerOrders() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const orders = activeTab === "active" ? ACTIVE_ORDERS : COMPLETED_ORDERS;
  const hasOrders = orders.length > 0;

  const getTabStyle = (tab: TabType) => ({
    backgroundColor: activeTab === tab ? theme.primary : "transparent",
    borderColor: activeTab === tab ? theme.primary : theme.border,
  });
  const getTabTextStyle = (tab: TabType) => ({
    color: activeTab === tab ? "#fff" : theme.textSecondary,
  });

  const handleFilterBtn = () => {
    router.push("/filterScreen");
  };

  return (
    <MainContainer safe>
      <View style={[styles.screen]}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: theme.text, flex: 1, marginLeft: 20 },
            ]}
          >
            My Orders
          </Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, getTabStyle("active")]}
            onPress={() => setActiveTab("active")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, getTabTextStyle("active")]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, getTabStyle("completed")]}
            onPress={() => setActiveTab("completed")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, getTabTextStyle("completed")]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {hasOrders ? (
            orders.map((order, index) => (
              <FadeIn key={order.id} delay={index * 50}>
                <OrderCard order={order} theme={theme} delay={0} />
              </FadeIn>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="cube-outline"
                size={64}
                color={theme.textSecondary + "50"}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No {activeTab} orders found
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  filterBtn: {
    padding: 8,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 30,
    backgroundColor: "transparent",
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
