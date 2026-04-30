import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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

import { ThemedText } from "@/components/themed-text";
import MainContainer from "../../components/MainContainer";
import Spacer from "../../components/Spacer";
import Colors from "../../constants/colors";

const OTP_LENGTH = 4;
const RESEND_COUNTDOWN = 30;

// --- Single OTP box ---
const OtpBox = ({
  value,
  focused,
  hasError,
  theme,
  shakeAnim,
}: {
  value: string;
  focused: boolean;
  hasError: boolean;
  theme: any;
  shakeAnim: Animated.Value;
}) => {
  const filledScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value) {
      Animated.sequence([
        Animated.timing(filledScale, {
          toValue: 1.18,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(filledScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]).start();
    }
  }, [value]);

  const borderColor = hasError
    ? "#EF4444"
    : focused
      ? theme.primary
      : value
        ? theme.primary + "60"
        : theme.border;

  const bgColor = hasError
    ? "#EF444415"
    : focused
      ? theme.primary + "0D"
      : theme.cardBackground;

  return (
    <Animated.View
      style={[
        styles.otpBox,
        {
          borderColor,
          backgroundColor: bgColor,
          transform: [{ scale: filledScale }, { translateX: shakeAnim }],
        },
        focused && styles.otpBoxFocused,
      ]}
    >
      <Text
        style={[styles.otpChar, { color: hasError ? "#EF4444" : theme.text }]}
      >
        {value ? "•" : ""}
      </Text>
      {focused && !value && (
        <Animated.View
          style={[styles.cursor, { backgroundColor: theme.primary }]}
        />
      )}
    </Animated.View>
  );
};

// --- Screen ---
export default function OtpVerifyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;

  // contact & type are forwarded from signup with the user's actual number/email
  const {
    contact = "+233 ** *** 4521",
    type = "phone",
    role,
  } = useLocalSearchParams<{
    contact?: string;
    type?: "phone" | "email";
    role?: string;
  }>();

  const [otp, setOtp] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Focus the hidden input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
    startCountdown();
    return () => clearTimer();
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startCountdown = () => {
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    clearTimer();
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (text: string) => {
    // Allow only digits
    const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    setHasError(false);
    setFocusedIndex(Math.min(digits.length, OTP_LENGTH - 1));

    if (digits.length === OTP_LENGTH) {
      setTimeout(() => verify(digits), 120);
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 7,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -7,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() =>
      setTimeout(() => {
        setHasError(false);
        setOtp("");
        setFocusedIndex(0);
        inputRef.current?.focus();
      }, 500),
    );
  };

  const triggerSuccess = () => {
    Animated.spring(successScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 55,
      friction: 5,
    }).start(() => {
      // Forward to onboarding (or home) after verification
      setTimeout(() => {
        role == "sme"
          ? router.replace({
              pathname: "/(screens)/(sme)/(tabs)",
              params: { role },
            })
          : router.replace({
              pathname: "/(screens)/(manufacturer)/(tabs)",
              params: { role },
            });
      }, 600);
    });
  };

  const verify = (code: string) => {
    setLoading(true);
    // TODO: replace with your real OTP verification call
    setTimeout(() => {
      setLoading(false);
      const MOCK_OTP = "1234";
      if (code === MOCK_OTP) {
        setVerified(true);
        triggerSuccess();
      } else {
        setHasError(true);
        triggerShake();
      }
    }, 900);
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp("");
    setHasError(false);
    setFocusedIndex(0);
    startCountdown();
    inputRef.current?.focus();
    // TODO: call your resend OTP API
  };

  const isPhone = type === "phone";

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
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <Ionicons
              name={isPhone ? "phone-portrait-outline" : "mail-outline"}
              size={30}
              color={theme.primary}
            />
          </View>

          <Spacer style={{ height: 24 }} />

          <ThemedText style={styles.heading}>
            Verify your {isPhone ? "number" : "email"}
          </ThemedText>
          <Spacer style={{ height: 8 }} />
          <ThemedText
            style={[styles.subheading, { color: theme.textSecondary }]}
          >
            We sent a 4-digit code to{" "}
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {contact}
            </Text>
          </ThemedText>

          <Spacer style={{ height: 44 }} />

          {/* OTP boxes + hidden input */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.otpRow}
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <OtpBox
                key={i}
                value={otp[i] ?? ""}
                focused={!loading && !verified && focusedIndex === i}
                hasError={hasError}
                theme={theme}
                shakeAnim={shakeAnim}
              />
            ))}
          </TouchableOpacity>

          {/* Invisible input that captures keyboard */}
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            style={styles.hiddenInput}
            caretHidden
            onFocus={() =>
              setFocusedIndex(Math.min(otp.length, OTP_LENGTH - 1))
            }
            onBlur={() => setFocusedIndex(-1)}
          />

          <Spacer style={{ heigth: 16 }} />

          {/* Error / loading hint */}
          {hasError && (
            <Text style={styles.errorText}>
              Incorrect code. Please try again.
            </Text>
          )}
          {loading && (
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              Verifying…
            </Text>
          )}

          <Spacer style={{ height: 36 }} />

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendPrompt, { color: theme.textSecondary }]}>
              Didn't receive a code?{" "}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendLink, { color: theme.primary }]}>
                  Resend
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={[styles.resendCountdown, { color: theme.textSecondary }]}
              >
                Resend in{" "}
                <Text style={{ color: theme.primary, fontWeight: "700" }}>
                  {countdown}s
                </Text>
              </Text>
            )}
          </View>
        </View>

        {/* Verify button */}
        <View style={styles.footer}>
          <TouchableOpacity
            disabled={otp.length < OTP_LENGTH || loading || verified}
            activeOpacity={0.9}
            onPress={() => verify(otp)}
            style={[
              styles.button,
              {
                backgroundColor:
                  otp.length === OTP_LENGTH && !loading && !verified
                    ? theme.primary
                    : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color:
                    otp.length === OTP_LENGTH && !loading && !verified
                      ? theme.onPrimary
                      : theme.textSecondary,
                },
              ]}
            >
              {loading ? "Verifying…" : verified ? "Verified ✓" : "Verify"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Success overlay */}
      {verified && (
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successCircle,
              { backgroundColor: theme.primary },
              { transform: [{ scale: successScale }] },
            ]}
          >
            <Ionicons name="checkmark" size={52} color="#fff" />
          </Animated.View>
        </View>
      )}
    </MainContainer>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 14.5,
    textAlign: "center",
    lineHeight: 22,
  },

  otpRow: {
    flexDirection: "row",
    gap: 14,
  },
  otpBox: {
    width: 64,
    height: 68,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFocused: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  otpChar: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  cursor: {
    position: "absolute",
    width: 2,
    height: 26,
    borderRadius: 1,
  },

  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },

  errorText: {
    fontSize: 13.5,
    color: "#EF4444",
    fontWeight: "500",
    textAlign: "center",
  },
  hintText: {
    fontSize: 13.5,
    textAlign: "center",
  },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendPrompt: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "700",
  },
  resendCountdown: {
    fontSize: 14,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },

  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
});
