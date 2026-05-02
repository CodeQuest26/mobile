import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import MainContainer from "../../components/MainContainer";
import Spacer from "../../components/Spacer";
import Colors from "../../constants/colors";

// --- Role meta ---
const ROLE_META = {
  sme: {
    label: "Business Owner",
    icon: "briefcase-outline",
    tagline: "Let's set up your business account.",
  },
  manufacturer: {
    label: "Manufacturer",
    icon: "settings-outline",
    tagline: "Let's set up your manufacturer account.",
  },
};

// --- Input Field ---
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
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: string;
  autoCapitalize?: string;
  rightSlot?: React.ReactNode;
  theme: any;
}) => (
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
        name={icon as any}
        size={18}
        color={theme.textSecondary}
        style={{ marginRight: 10 }}
      />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType as any}
        autoCapitalize={autoCapitalize as any}
        placeholderTextColor={theme.textSecondary + "80"}
        placeholder={label}
      />
      {rightSlot}
    </View>
  </View>
);

// --- Password Strength Bar ---
const PasswordStrength = ({
  password,
  theme,
}: {
  password: string;
  theme: any;
}) => {
  const getStrength = () => {
    if (password.length === 0)
      return { level: 0, label: "", color: "transparent" };
    if (password.length < 6)
      return { level: 1, label: "Too short", color: "#EF4444" };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score === 0) return { level: 2, label: "Weak", color: "#F97316" };
    if (score === 1) return { level: 3, label: "Fair", color: "#EAB308" };
    if (score === 2) return { level: 4, label: "Strong", color: "#22C55E" };
    return { level: 4, label: "Very strong", color: "#16A34A" };
  };

  const { level, label, color } = getStrength();
  if (!password) return null;

  return (
    <View style={styles.strengthWrapper}>
      <View style={styles.strengthBars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              { backgroundColor: i <= level ? color : theme.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
};

// --- Screen ---
const SignupScreen = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;

  const { role } = useLocalSearchParams<{ role: string }>();
  const roleMeta = ROLE_META[role] ?? ROLE_META.sme;

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  const handleSignup = () => {
    if (!canSubmit) return;
    setLoading(true);
    // TODO: call your auth/register service here
    setTimeout(() => {
      setLoading(false);
      // Route to OTP using the phone number entered at signup.
      // Falls back to email if no phone was provided.
      const hasPhone = phone.trim().length > 0;
      router.push({
        pathname: "/otp-verify",
        params: {
          contact: hasPhone ? phone.trim() : email.trim(),
          type: hasPhone ? "phone" : "email",
          role,
        },
      });
    }, 1500);
  };

  return (
    <MainContainer safe style={{ backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.cardBackground }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <Spacer style={{ height: 24 }} />

          {/* Role badge */}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <Ionicons
              name={roleMeta.icon as any}
              size={14}
              color={theme.primary}
            />
            <Text style={[styles.roleBadgeText, { color: theme.primary }]}>
              {roleMeta.label}
            </Text>
          </View>

          <Spacer style={{ height: 12 }} />

          <ThemedText style={{ fontSize: 28, fontWeight: "bold" }}>
            Create account ✨
          </ThemedText>

          <Spacer style={{ height: 6 }} />

          <ThemedText style={{ fontSize: 14, color: theme.textSecondary }}>
            {roleMeta.tagline}
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            theme={theme}
          />

          <Spacer style={{ height: 16 }} />

          <InputField
            label="Phone Number (optional)"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            theme={theme}
          />

          <Spacer style={{ height: 16 }} />

          <InputField
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            theme={theme}
            rightSlot={
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            }
          />

          <Spacer style={{ height: 8 }} />
          <PasswordStrength password={password} theme={theme} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Create Account Button */}
          <TouchableOpacity
            disabled={!canSubmit || loading}
            activeOpacity={0.9}
            style={[
              styles.button,
              { backgroundColor: canSubmit ? theme.primary : theme.border },
            ]}
            onPress={handleSignup}
          >
            <Text
              style={[
                styles.buttonText,
                { color: canSubmit ? theme.onPrimary : theme.textSecondary },
              ]}
            >
              {loading ? "Creating account…" : "Create Account"}
            </Text>
          </TouchableOpacity>

          <Spacer style={{ height: 20 }} />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
              or
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <Spacer style={{ height: 16 }} />

          {/* Google */}
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
            <Text style={[styles.googleG, { color: theme.primary }]}>G</Text>
            <Text style={[styles.socialText, { color: theme.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <Spacer style={{ height: 12 }} />

          {/* Apple */}
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
            <Ionicons name="logo-apple" size={18} color={theme.text} />
            <Text style={[styles.socialText, { color: theme.text }]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>

          <Spacer style={{ height: 24 }} />

          {/* Sign in link */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginPrompt, { color: theme.textSecondary }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/login", params: { role } })
              }
            >
              <Text style={[styles.loginLink, { color: theme.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <Spacer style={{ height: 24 }} />
        </View>
      </KeyboardAvoidingView>
    </MainContainer>
  );
};

export default SignupScreen;

// --- Styles ---
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
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
  roleBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },

  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  strengthWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    width: 70,
    textAlign: "right",
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    marginBottom: 16,
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

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  googleG: {
    fontSize: 17,
    fontWeight: "800",
  },
  socialText: {
    fontSize: 15,
    fontWeight: "500",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginPrompt: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
