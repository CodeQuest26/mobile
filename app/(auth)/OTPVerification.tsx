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

// --- Single OTP Box ---
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
          toValue: 1.12,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(filledScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 220,
          friction: 9,
        }),
      ]).start();
    }
  }, [value]);

  const borderColor = hasError
    ? "#EF4444"
    : focused
      ? theme.primary
      : value
        ? theme.primary + "90"
        : theme.border;

  const bgColor = hasError
    ? "#EF44440D"
    : focused
      ? theme.primary + "08"
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

// --- Main Screen ---
export default function OtpVerifyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";

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

  // Modernized Success Animation Refs
  const successOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.4)).current;
  const pulseRingScale = useRef(new Animated.Value(0.8)).current;
  const pulseRingOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(15)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
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
        toValue: 8,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -5,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start(() =>
      setTimeout(() => {
        setHasError(false);
        setOtp("");
        setFocusedIndex(0);
        inputRef.current?.focus();
      }, 350),
    );
  };

  const triggerSuccess = () => {
    // 1. Fade screen in
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 2. Icon Spring Pop
    Animated.spring(iconScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 70,
      friction: 7,
    }).start();

    // 3. Ambient out-ward pulse ring
    Animated.parallel([
      Animated.timing(pulseRingScale, {
        toValue: 2.2,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(pulseRingOpacity, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Staggered Text Reveal
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Hand-off route swap
    setTimeout(() => {
      const destination =
        role === "sme"
          ? "/(screens)/(sme)/(tabs)"
          : "/(screens)/(manufacturer)/(tabs)";
      router.replace({ pathname: destination, params: { role } });
    }, 1800);
  };

  const verify = (code: string) => {
    setLoading(true);
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
    }, 850);
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp("");
    setHasError(false);
    setFocusedIndex(0);
    startCountdown();
    inputRef.current?.focus();
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
            onPress={() => router.replace("/login")}
            style={[styles.backBtn, { backgroundColor: theme.cardBackground }]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Body Container */}
        <View style={styles.body}>
          <Spacer style={{ height: 16 }} />

          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.primary + "12" },
            ]}
          >
            <Ionicons
              name={
                type === "phone" ? "phone-portrait-outline" : "mail-outline"
              }
              size={28}
              color={theme.primary}
            />
          </View>

          <Spacer style={{ height: 24 }} />

          <ThemedText style={styles.heading}>
            Verify your {type === "phone" ? "number" : "email"}
          </ThemedText>
          <Spacer style={{ height: 8 }} />
          <ThemedText
            style={[styles.subheading, { color: theme.textSecondary }]}
          >
            We sent a 4-digit verification code to{"\n"}
            <Text style={{ color: theme.text, fontWeight: "600" }}>
              {contact}
            </Text>
          </ThemedText>

          <Spacer style={{ height: 40 }} />

          {/* OTP Fields Grid */}
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

          {/* Invisible Input Receiver */}
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

          <Spacer style={{ height: 24 }} />

          {/* Verification Indicators */}
          {hasError && (
            <Text style={styles.errorText}>
              Incorrect code. Please try again.
            </Text>
          )}
          {loading && (
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              Verifying entry...
            </Text>
          )}

          <Spacer style={{ height: 24 }} />

          {/* Counter Controls */}
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
                <Text style={{ color: theme.primary, fontWeight: "600" }}>
                  {countdown}s
                </Text>
              </Text>
            )}
          </View>
        </View>

        {/* Footer Submit CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            disabled={otp.length < OTP_LENGTH || loading || verified}
            activeOpacity={0.85}
            onPress={() => verify(otp)}
            style={[
              styles.button,
              {
                backgroundColor:
                  otp.length === OTP_LENGTH && !loading && !verified
                    ? theme.primary
                    : theme.border + "A0",
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

      {/* Redesigned Success Interactive Overlay */}
      {verified && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              backgroundColor: isDark
                ? "rgba(10,10,12,0.96)"
                : "rgba(255,255,255,0.97)",
              opacity: successOpacity,
            },
          ]}
        >
          <View style={styles.successWrapper}>
            {/* Outward Ring Component */}
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: theme.primary,
                  transform: [{ scale: pulseRingScale }],
                  opacity: pulseRingOpacity,
                },
              ]}
            />

            {/* Scale Pop Icon Canvas */}
            <Animated.View
              style={[
                styles.successIconCanvas,
                {
                  backgroundColor: theme.primary,
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
              <Ionicons name="checkmark-sharp" size={40} color="#FFFFFF" />
            </Animated.View>

            {/* Sliding Text Label Segment */}
            <Animated.View
              style={{
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
                alignItems: "center",
              }}
            >
              <Text style={[styles.newSuccessTitle, { color: theme.text }]}>
                Verification Successful
              </Text>
              <Text
                style={[styles.newSuccessSub, { color: theme.textSecondary }]}
              >
                Preparing your personal dashboard...
              </Text>
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </MainContainer>
  );
}

// --- Style Framework sheet ---
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "flex-start", // Changed to top-down for smoother keyboard experience
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subheading: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  otpRow: {
    flexDirection: "row",
    gap: 16,
  },
  otpBox: {
    width: 60,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFocused: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  otpChar: {
    fontSize: 26,
    fontWeight: "600",
  },
  cursor: {
    position: "absolute",
    width: 2,
    height: 22,
    borderRadius: 1,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
    textAlign: "center",
  },
  hintText: {
    fontSize: 14,
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
    fontWeight: "600",
  },
  resendCountdown: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    paddingTop: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  /* NEW REDESIGNED SUCCESS STYLES */
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  successWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  pulseRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  successIconCanvas: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  newSuccessTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  newSuccessSub: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.8,
  },
});
