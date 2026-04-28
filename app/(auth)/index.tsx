import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import MainContainer from "../../components/MainContainer";
import Spacer from "../../components/Spacer";
import Colors from "../../constants/colors";

// --- Role Card ---
const RoleCard = ({
  roleKey,
  title,
  description,
  icon,
  selectedRole,
  setRole,
  theme,
}) => {
  const isSelected = selectedRole === roleKey;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setRole(roleKey)}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}
    >
      {/* Left Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isSelected
              ? theme.primary + "15"
              : theme.iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={isSelected ? theme.primary : theme.icon}
        />
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>

      {/* Selection Indicator */}
      <Ionicons
        name={isSelected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={isSelected ? theme.primary : theme.border}
      />
    </TouchableOpacity>
  );
};

// --- Screen ---
const RoleSelection = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;

  const [role, setRole] = useState("");

  return (
    <MainContainer safe style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[{ backgroundColor: theme.primary }, styles.logoContainer]}
        >
          <Ionicons name="paper-plane-outline" size={45} color={"white"} />
        </View>

        <Spacer />

        <ThemedText style={{ fontSize: 27, fontWeight: "regular" }}>
          Welcome to{" "}
          <Text style={{ color: theme.primary, fontWeight: "bold" }}>
            MakersHub
          </Text>
        </ThemedText>

        <ThemedText style={{ fontSize: 15, color: theme.textSecondary }}>
          <Text style={{ fontWeight: "bold" }}>Produce</Text> on the go.{" "}
          <Text style={{ fontWeight: "bold" }}>Grow </Text>
          your business.
        </ThemedText>
      </View>

      {/* Cards */}
      <View style={styles.content}>
        <RoleCard
          roleKey="sme"
          title="Business Owner (SME)"
          description="Collaborate with manufactureres, track operations and grow your business."
          icon="briefcase-outline"
          selectedRole={role}
          setRole={setRole}
          theme={theme}
        />

        <Spacer height={16} />

        <RoleCard
          roleKey="manufacturer"
          title="Manufacturer"
          description="Oversee production, inventory and supply chain."
          icon="settings-outline"
          selectedRole={role}
          setRole={setRole}
          theme={theme}
        />
      </View>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!role}
          activeOpacity={0.9}
          style={[
            styles.button,
            {
              backgroundColor: role ? theme.primary : theme.border,
            },
          ]}
          onPress={() =>
            router.push({ pathname: "/(onboarding)", params: { role } })
          }
        >
          <Text
            style={[
              styles.buttonText,
              { color: role ? theme.onPrimary : theme.textSecondary },
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </MainContainer>
  );
};

export default RoleSelection;

// --- Styles ---
const styles = StyleSheet.create({
  header: {
    flex: 1.5,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    height: 70,
    width: 70,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  description: {
    fontSize: 13.5,
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    marginBottom: 25,
  },

  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
