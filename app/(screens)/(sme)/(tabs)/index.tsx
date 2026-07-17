import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import ProductDetailsCard from "@/components/sme/ProductDetailsCard";
import { ThemedText } from "@/components/themed-text";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const SMEHome = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const time = new Date().getHours();
  const greeting = time < 12 ? "morning" : time < 16 ? "afternoon" : "evening";

  const user = useAuthStore();

  console.log(user);

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
                {user.fullName}
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
          onPress={() => {
            router.push("/(screens)/(sme)/(screens)/postJob");
          }}
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

      {/* Ongoing Jobs */}
      <ScrollView
        showsHorizontalScrollIndicator={false}
        // contentContainerStyle={{ marginTop: 5 }}
      >
        {/* Product name & quantity */}
        <ProductDetailsCard
          product={{
            name: "Product Name",
            manufacturerId: "m1",
            manufacturer: "Manufacturing Co.",
            quantity: 100,
            currentStage: "Quality Check",
            cost: 1000,
          }}
          theme={theme}
          onMessagePress={(product: any) => {
            router.push({
              pathname: "/ChatRoom",
              params: {
                userType: "sme",
                contactId: product.manufacturerId || "manufacturer-1",
                contactName: product.manufacturer,
                contactInitials: product.manufacturer
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2),
                contactOnline: "0",
              },
            });
          }}
        />
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
  productlable: {
    fontSize: 14,
    fontWeight: "300",
  },
});
