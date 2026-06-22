// src/app/(auth)/ForgotPasswordScreen.tsx
import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type Step = "request" | "verify" | "reset";

export default function ForgotPasswordScreen({ navigation }: any) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";

  const [step, setStep] = useState<Step>("request");
  const [contact, setContact] = useState(""); // phone or email
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (nextStep: Step) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setStep(nextStep));
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Helper to detect contact type (phone or email)
  const detectContactType = (input: string): "phone" | "email" | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Email detection (basic)
    if (trimmed.includes("@") && trimmed.includes(".")) {
      return "email";
    }

    // Phone detection: extract digits, must be exactly 10 digits
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) {
      return "phone";
    }

    return null;
  };

  const handleSendCode = async () => {
    const type = detectContactType(contact);
    if (!type) {
      setError("Please enter a valid phone number or email address");
      return;
    }
    setContactType(type);
    setError("");
    setLoading(true);
    // Simulate API call to send verification code
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCountdown(30);
      animateTransition("verify");
    } catch (err) {
      setError("Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      animateTransition("reset");
    } catch (err) {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Success", "Your password has been reset. Please log in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = () => {
    if (countdown > 0) return;
    setCountdown(30);
    // Re‑send code logic here (could call same API)
  };

  // Helper to format masked display for email/phone in verify step
  const getMaskedContact = () => {
    if (contactType === "email") {
      const [local, domain] = contact.split("@");
      const maskedLocal = local.length > 3 ? local.slice(0, 2) + "***" : "***";
      return `${maskedLocal}@${domain}`;
    } else {
      // Phone: show last 4 digits
      const digits = contact.replace(/\D/g, "");
      if (digits.length <= 4) return "******";
      return `******${digits.slice(-4)}`;
    }
  };

  const renderRequestStep = () => (
    <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>
      <View style={styles.iconContainer}>
        <View
          style={[styles.iconCircle, { backgroundColor: theme.primary + "15" }]}
        >
          <Ionicons name="call-outline" size={40} color={theme.primary} />
        </View>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        Forgot Password?
      </Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enter your phone number or email address. We'll send a verification code
        to reset your password.
      </Text>

      <View style={[styles.inputContainer, { borderColor: theme.border }]}>
        <Ionicons
          name="phone-portrait-outline"
          size={20}
          color={theme.textSecondary}
        />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Phone number or email"
          placeholderTextColor={theme.textSecondary}
          value={contact}
          onChangeText={setContact}
          autoCapitalize="none"
          keyboardType="default"
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleSendCode}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Code</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={[styles.backText, { color: theme.primary }]}>
          Back to Login
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderVerifyStep = () => (
    <>
      <View style={styles.iconContainer}>
        <View
          style={[styles.iconCircle, { backgroundColor: theme.primary + "15" }]}
        >
          <Ionicons name="key-outline" size={40} color={theme.primary} />
        </View>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>
        Check Your {contactType === "phone" ? "Phone" : "Email"}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        We've sent a 6-digit verification code to{"\n"}
        <Text style={{ fontWeight: "700", color: theme.primary }}>
          {getMaskedContact()}
        </Text>
      </Text>
      <View style={[styles.inputContainer, { borderColor: theme.border }]}>
        <Ionicons name="code-outline" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Enter verification code"
          placeholderTextColor={theme.textSecondary}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleVerifyCode}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>
      <View style={styles.resendRow}>
        <Text style={[styles.resendText, { color: theme.textSecondary }]}>
          Didn't receive the code?{" "}
        </Text>
        <TouchableOpacity onPress={resendCode} disabled={countdown > 0}>
          <Text
            style={[
              styles.resendLink,
              { color: countdown > 0 ? theme.textSecondary : theme.primary },
            ]}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderResetStep = () => (
    <>
      <View style={styles.iconContainer}>
        <View
          style={[styles.iconCircle, { backgroundColor: theme.primary + "15" }]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={theme.primary}
          />
        </View>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>
        Create New Password
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Your new password must be at least 6 characters.
      </Text>
      <View style={[styles.inputContainer, { borderColor: theme.border }]}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={theme.textSecondary}
        />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="New password"
          placeholderTextColor={theme.textSecondary}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
      </View>
      <View style={[styles.inputContainer, { borderColor: theme.border }]}>
        <Ionicons
          name="checkmark-done-outline"
          size={20}
          color={theme.textSecondary}
        />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Confirm new password"
          placeholderTextColor={theme.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <MainContainer safe>
      <KeyboardAvoidingView
        style={[styles.container]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          {step === "request" && renderRequestStep()}
          {step === "verify" && renderVerifyStep()}
          {step === "reset" && renderResetStep()}
        </View>
      </KeyboardAvoidingView>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    left: 16,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  iconContainer: { alignItems: "center", marginBottom: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 54,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, height: "100%" },
  button: {
    borderRadius: 30,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errorText: { fontSize: 13, marginBottom: 12, textAlign: "center" },
  backLink: { marginTop: 24, alignItems: "center" },
  backText: { fontSize: 15, fontWeight: "600" },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  resendText: { fontSize: 14 },
  resendLink: { fontSize: 14, fontWeight: "600" },
});
