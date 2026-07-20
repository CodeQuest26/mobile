import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import ProductDetailsCard from "@/components/sme/ProductDetailsCard";
import { ThemedText } from "@/components/themed-text";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const BASE_URL = "https://backendtest-production-9132.up.railway.app";

const SMEHome = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const time = new Date().getHours();
  const greeting = time < 12 ? "morning" : time < 16 ? "afternoon" : "evening";

  const user = useAuthStore();
  const { accessToken } = useAuthStore.getState();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/api/v1/orders?page=0&size=50&sort=createdAt,desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      const orderList = data.content || [];

      // Enrich each order with job title and quantity
      const enriched = await Promise.all(
        orderList.map(async (order: any) => {
          try {
            const jobRes = await fetch(
              `${BASE_URL}/api/v1/jobs/${order.jobId}`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            );
            if (jobRes.ok) {
              const job = await jobRes.json();
              return {
                ...order,
                jobTitle: job.title,
                productType: job.productType,
                quantity: job.quantity,
              };
            }
          } catch {}
          return { ...order, jobTitle: "Order", quantity: 0 };
        }),
      );

      setOrders(enriched);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (order: any) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  return (
    <MainContainer>
      <View
        style={{
          backgroundColor: theme.cardBackground,
          paddingTop: 60,
          marginBottom: 5,
        }}
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
                {user.user?.fullName}
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
        <TouchableOpacity
          onPress={() => router.push("/(screens)/(sme)/(screens)/postJob")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.primary, "#2E9D5F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.postJobButton, { shadowColor: theme.primary }]}
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
                Get quotes from verified manufacturers
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
      </View>

      {/* Ongoing Jobs / Orders */}
      <ScrollView showsHorizontalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 40 }}
          />
        ) : orders.length === 0 ? (
          <ThemedText style={styles.emptyText}>No active orders</ThemedText>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              activeOpacity={0.7}
              onPress={() => openModal(order)}
            >
              <ProductDetailsCard
                product={{
                  name: order.jobTitle || order.productType || "Order",
                  manufacturerId: order.factoryId,
                  manufacturer: order.factoryName,
                  quantity: order.quantity,
                  currentStage: order.currentProductionStage || order.status,
                  cost: order.agreedAmountGhs,
                }}
                theme={theme}
                onMessagePress={() => {
                  // Navigate to chat room with this factory
                  router.push({
                    pathname: "/ChatRoom",
                    params: {
                      userType: "sme",
                      contactId: order.factoryId,
                      contactName: order.factoryName,
                      contactInitials: order.factoryName
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2),
                      contactOnline: "0",
                    },
                  });
                }}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal: Full order details */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Order Details</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.icon} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <DetailRow
                  label="Product"
                  value={selectedOrder.jobTitle || "—"}
                />
                <DetailRow
                  label="Manufacturer"
                  value={selectedOrder.factoryName}
                />
                <DetailRow label="Status" value={selectedOrder.status} />
                <DetailRow
                  label="Progress"
                  value={`${selectedOrder.currentProgressPercentage ?? 0}% - ${
                    selectedOrder.currentProductionStage || "N/A"
                  }`}
                />
                <DetailRow
                  label="Amount"
                  value={`GHS ${selectedOrder.agreedAmountGhs?.toFixed(2)}`}
                />
                <DetailRow
                  label="Platform Fee"
                  value={`GHS ${selectedOrder.platformFeeGhs?.toFixed(2)}`}
                />
                <DetailRow
                  label="Factory Payout"
                  value={`GHS ${selectedOrder.factoryPayoutGhs?.toFixed(2)}`}
                />
                <DetailRow
                  label="Order Created"
                  value={new Date(selectedOrder.createdAt).toLocaleString()}
                />
                {selectedOrder.deliveredAt && (
                  <DetailRow
                    label="Delivered"
                    value={new Date(selectedOrder.deliveredAt).toLocaleString()}
                  />
                )}
                {selectedOrder.completedAt && (
                  <DetailRow
                    label="Completed"
                    value={new Date(selectedOrder.completedAt).toLocaleString()}
                  />
                )}
                {/* Additional actions can go here */}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </MainContainer>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <ThemedText style={styles.detailLabel}>{label}</ThemedText>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  postJobButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 2,
    textAlign: "right",
  },
});

export default SMEHome;
