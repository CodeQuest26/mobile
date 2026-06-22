import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import MainContainer from "../../components/MainContainer";
import Colors from "../../constants/colors";

const { width, height } = Dimensions.get("window");

const RoleCard = ({
  roleKey,
  title,
  description,
  icon,
  selectedRole,
  setRole,
  theme,
}: {
  roleKey: string;
  title: string;
  description: string;
  icon: any;
  selectedRole: string;
  setRole: (role: string) => void;
  theme: any;
}) => {
  const isSelected = selectedRole === roleKey;

  const handlePress = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRole(roleKey);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? theme.primary + "12"
            : theme.cardBackground + "CC",
          borderColor: isSelected ? theme.primary : theme.border,
          transform: [{ scale: isSelected ? 1.02 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: isSelected ? theme.primary : theme.iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={32}
          color={isSelected ? "#fff" : theme.primary}
        />
      </View>

      <View style={styles.cardText}>
        <Text
          style={[
            styles.cardTitle,
            { color: isSelected ? theme.primary : theme.text },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function RoleSelection() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";
  const [role, setRole] = useState("");

  const handleContinue = () => {
    if (!role) return;
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/(onboarding)", params: { role } });
  };

  return (
    <MainContainer safe style={{ backgroundColor: theme.background }}>
      {/* Hero gradient + abstract shapes */}
      <LinearGradient
        colors={
          isDark
            ? [theme.primary + "40", theme.background]
            : [theme.primary + "20", theme.background + "00"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg}
      />

      <View style={styles.header}>
        <View
          style={[styles.logoGlow, { backgroundColor: theme.primary + "20" }]}
        >
          <LinearGradient
            colors={[theme.primary, theme.primary + "CC"]}
            style={styles.logoGradient}
          >
            <Ionicons name="rocket-outline" size={48} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={[styles.welcome, { color: theme.text }]}>
          Welcome to{" "}
          <Text style={{ color: theme.primary, fontWeight: "800" }}>
            MakersHub
          </Text>
        </Text>

        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          Choose your path to collaborate, produce and grow.
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <RoleCard
          roleKey="sme"
          title="Business Owner (SME)"
          description="Partner with manufacturers, track orders, and scale your business."
          icon="business-outline"
          selectedRole={role}
          setRole={setRole}
          theme={theme}
        />

        <View style={{ height: 20 }} />

        <RoleCard
          roleKey="manufacturer"
          title="Manufacturer"
          description="Manage production, inventory, and connect with SMEs."
          icon="build-outline"
          selectedRole={role}
          setRole={setRole}
          theme={theme}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!role}
          activeOpacity={0.8}
          onPress={handleContinue}
          style={[
            styles.button,
            {
              backgroundColor: role ? theme.primary : theme.border,
              opacity: role ? 1 : 0.7,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoGlow: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 28,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  checkmark: {
    // position: "absolute",
    // top: 12,
    // right: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    paddingTop: 12,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
