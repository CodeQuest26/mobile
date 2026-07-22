import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import ProductDetailsCard from "@/components/sme/ProductDetailsCard";
import { ThemedText } from "@/components/themed-text";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const ACTIVE_ORDER_STATUSES = new Set([
  "IN_ESCROW",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "DELIVERED",
]);

const SMEHome = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const time = new Date().getHours();
  const greeting = time < 12 ? "morning" : time < 16 ? "afternoon" : "evening";

  const user = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // The shared client waits for auth hydration, attaches the real `token`
      // field, and refreshes an expired session. The previous raw fetch used
      // an `accessToken` field that the auth store does not contain.
      const { data } = await api.get("orders", {
        params: { page: 0, size: 50, sort: "createdAt,desc" },
      });
      const orderList = data.content || [];

      // Enrich each order with job title and quantity
      const enriched = await Promise.all(
        orderList.map(async (order: any) => {
          try {
            const { data: job } = await api.get(`jobs/${order.jobId}`);
            return {
              ...order,
              jobTitle: job.title,
              productType: job.productType,
              quantity: job.quantity,
            };
          } catch {}
          return { ...order, jobTitle: "Order", quantity: 0 };
        }),
      );

      setOrders(
        enriched.filter((order: any) =>
          ACTIVE_ORDER_STATUSES.has(order.status),
        ),
      );
    } catch (fetchError) {
      console.error("Error fetching orders:", fetchError);
      setError(handleApiError(fetchError));
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload after returning from payment or order details so the displayed
  // lifecycle status always comes from the backend.
  useFocusEffect(
    useCallback(() => {
      void fetchOrders();
    }, [fetchOrders]),
  );

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
        ) : error ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>{error}</ThemedText>
            <TouchableOpacity onPress={fetchOrders} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: theme.primary }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <ThemedText style={styles.emptyText}>No active orders</ThemedText>
        ) : (
          orders.map((order) => (
            <ProductDetailsCard
              key={order.id}
              product={{
                id: order.id,
                name: order.jobTitle || order.productType || "Order",
                manufacturerId: order.factoryId,
                manufacturer: order.factoryName,
                quantity: order.quantity,
                currentStage: order.currentProductionStage || order.status,
                cost: order.agreedAmountGhs,
              }}
              theme={theme}
              onPress={() =>
                router.push({
                  pathname: "/(screens)/(sme)/(screens)/orderDetails",
                  params: { id: order.id },
                })
              }
              onMessagePress={() => {
                // Navigate to chat room with this factory
                router.push({
                  pathname: "/ChatRoom",
                  params: {
                    userType: "sme",
                    contactId: order.factoryId,
                    contactName: order.factoryName || "Manufacturer",
                    contactInitials: (order.factoryName || "Manufacturer")
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2),
                    contactOnline: "0",
                  },
                });
              }}
            />
          ))
        )}
      </ScrollView>
    </MainContainer>
  );
};

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
  emptyState: {
    alignItems: "center",
  },
  retryButton: {
    padding: 12,
    marginTop: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export default SMEHome;
