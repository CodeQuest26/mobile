import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAuthStore } from "@/store/auth";
import { storage } from "@/store/mmkv";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import MainContainer from "../../components/MainContainer";
import Spacer from "../../components/Spacer";
import Colors from "../../constants/colors";

const ROLE_META = {
  SME_OWNER: {
    label: "Business Owner",
    icon: "briefcase-outline",
    tagline: "Manage your business, on the go.",
  },
  FACTORY_OWNER: {
    label: "Manufacturer",
    icon: "settings-outline",
    tagline: "Oversee production & supply chain.",
  },
  ADMIN: {
    label: "Administrator",
    icon: "shield-checkmark",
    tagline: "Manager users.",
  },
};

interface InputFieldProps {
  label: string;
  icon: any;
  value: string;
  onChangeText: any;
  secureTextEntry: any;
  keyboardType: string;
  autoCapitalize: string;
  rightSlot: any;
  theme: any;
}

const InputField = ({
  label,
  icon,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightSlot,
  theme,
}: InputFieldProps) => (
  <View style={styles.fieldWrapper}>
    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
      {label}
    </Text>
    <View
      style={[
        styles.inputRow,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={theme.textSecondary}
        style={{ marginRight: 10 }}
      />

      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "none"}
        placeholderTextColor={theme.textSecondary + "80"}
        placeholder={label}
      />
      {rightSlot}
    </View>
  </View>
);

const LoginScreen = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;

  const selectedRole = storage.getString("selectedRole");
  const roleMeta = ROLE_META[selectedRole];

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = phoneNumber.length >= 10 && password.length >= 8;

  const { login } = useAuthStore();

  const routeForRole = (role?: string) => {
    switch (role) {
      case "SME_OWNER":
        return "/(screens)/(sme)/(tabs)";
      case "ADMIN":
        return "/(screens)/(admin)/(tabs)";
      case "FACTORY_OWNER":
      default:
        return "/(screens)/(manufacturer)/(tabs)";
    }
  };

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      await login(phoneNumber, password);
      const state = useAuthStore.getState();

      // Not yet verified — this account still needs to complete OTP.
      router.replace({
        pathname: "/OTPVerification",
        params: { phoneNumber, role: state?.user?.role },
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainContainer safe style={{ backgroundColor: theme.background }}>
      <TouchableOpacity
        onPress={() => router.replace("/(onboarding)")}
        style={[
          styles.backBtn,
          { backgroundColor: theme.cardBackground, marginHorizontal: 16 },
        ]}
      >
        <Ionicons name="chevron-back" size={20} color={theme.text} />
      </TouchableOpacity>

      <KeyboardAwareScrollView bottomOffset={100}>
        <Spacer style={{ height: 25 }} />

        <View style={styles.header}>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <Ionicons name={roleMeta.icon} size={14} color={theme.primary} />
            <Text style={[styles.roleBadgeText, { color: theme.primary }]}>
              {roleMeta.label}
            </Text>
          </View>

          <Spacer style={{ height: 10 }} />

          <ThemedText style={{ fontSize: 30, fontWeight: "bold" }}>
            Welcome back 👋
          </ThemedText>

          <ThemedText style={{ fontSize: 14, color: theme.textSecondary }}>
            {roleMeta.tagline}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <InputField
            label="Phone number"
            icon="call-outline"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            theme={theme}
            secureTextEntry={undefined}
            autoCapitalize={"none"}
            rightSlot={undefined}
          />

          <Spacer style={{ height: 15 }} />

          <InputField
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            theme={theme}
            rightSlot={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={{ height: "100%", justifyContent: "center" }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            }
            keyboardType={"default"}
            autoCapitalize={"none"}
          />

          <Spacer style={{ height: 10 }} />

          <TouchableOpacity
            onPress={() => router.push("/forgotPassword")}
            style={styles.forgotRow}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>

        <Spacer style={{ height: 20 }} />

        <View style={styles.footer}>
          <TouchableOpacity
            disabled={!canSubmit || loading}
            activeOpacity={0.9}
            style={[
              styles.button,
              { backgroundColor: canSubmit ? theme.primary : theme.border },
            ]}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator size={"small"} color={theme.onPrimary} />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  { color: canSubmit ? theme.onPrimary : theme.textSecondary },
                ]}
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <Spacer style={{ height: 20 }} />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
              or
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <Spacer style={{ height: 20 }} />

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.socialButton,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="logo-google" size={16} color={theme.text} />
            <Text style={[styles.socialText, { color: theme.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <Spacer style={{ height: 12 }} />

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.socialButton,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="logo-apple" size={19} color={theme.text} />
            <Text style={[styles.socialText, { color: theme.text }]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>

          <Spacer style={{ height: 28 }} />

          <View style={styles.signupRow}>
            <Text style={[styles.signupPrompt, { color: theme.textSecondary }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/signup",
                  params: { role: selectedRole },
                })
              }
            >
              <Text style={[styles.signupLink, { color: theme.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </MainContainer>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleBadgeText: { fontSize: 13, fontWeight: "600" },
  form: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  fieldWrapper: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 15, padding: 0, height: "100%", width: "100%" },
  forgotRow: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13.5, fontWeight: "600" },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  button: {
    height: 54,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  googleG: { fontSize: 17, fontWeight: "800" },
  socialText: { fontSize: 15, fontWeight: "500" },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupPrompt: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: "700" },
});
