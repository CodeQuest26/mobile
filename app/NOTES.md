// import { Ionicons } from "@expo/vector-icons";
// import { router, useLocalSearchParams } from "expo-router";
// import { useRef, useState } from "react";
// import {
// Animated,
// StyleSheet,
// Text,
// TouchableOpacity,
// useColorScheme,
// Vibration,
// View,
// } from "react-native";

// import { ThemedText } from "@/components/themed-text";
// import MainContainer from "../../components/MainContainer";
// import Spacer from "../../components/Spacer";
// import Colors from "../../constants/colors";

// const PIN_LENGTH = 4;

// // --- Keypad config ---
// const KEYS = [
// ["1", "2", "3"],
// ["4", "5", "6"],
// ["7", "8", "9"],
// ["", "0", "del"],
// ];

// // --- Dot indicator for each PIN digit ---
// const PinDot = ({
// filled,
// shakeAnim,
// theme,
// hasError,
// }: {
// filled: boolean;
// shakeAnim: Animated.Value;
// theme: any;
// hasError: boolean;
// }) => (
// <Animated.View
// style={[
// styles.dot,
// {
// borderColor: hasError ? "#EF4444" : theme.primary,
// backgroundColor: filled
// ? hasError
// ? "#EF4444"
// : theme.primary
// : "transparent",
// transform: [{ translateX: shakeAnim }],
// },
// ]}
// />
// );

// // --- Single keypad key ---
// const Key = ({
// value,
// onPress,
// theme,
// }: {
// value: string;
// onPress: (v: string) => void;
// theme: any;
// }) => {
// const scaleAnim = useRef(new Animated.Value(1)).current;

// const handlePress = () => {
// Animated.sequence([
// Animated.timing(scaleAnim, {
// toValue: 0.88,
// duration: 70,
// useNativeDriver: true,
// }),
// Animated.timing(scaleAnim, {
// toValue: 1,
// duration: 100,
// useNativeDriver: true,
// }),
// ]).start();
// onPress(value);
// };

// if (value === "") return <View style={styles.keyPlaceholder} />;

// const isDelete = value === "del";

// return (
// <TouchableOpacity
// activeOpacity={1}
// onPress={handlePress}
// style={styles.keyTouchable}
// >
// <Animated.View
// style={[
// styles.key,
// {
// backgroundColor: theme.cardBackground,
// borderColor: theme.border,
// transform: [{ scale: scaleAnim }],
// },
// ]}
// >
// {isDelete ? (
// <Ionicons name="backspace-outline" size={22} color={theme.text} />
// ) : (
// <Text style={[styles.keyText, { color: theme.text }]}>{value}</Text>
// )}
// </Animated.View>
// </TouchableOpacity>
// );
// };

// // --- Screen ---
// export default function PinOtpScreen() {
// const colorScheme = useColorScheme();
// const theme = Colors[colorScheme] || Colors.light;

// const { mode } = useLocalSearchParams<{ mode?: string }>();
// const isSetup = mode === "setup";

// const [pin, setPin] = useState<string[]>([]);
// const [confirmPin, setConfirmPin] = useState<string[]>([]);
// const [stage, setStage] = useState<"enter" | "confirm">("enter");
// const [hasError, setHasError] = useState(false);
// const [successAnim] = useState(new Animated.Value(0));

// const shakeAnim = useRef(new Animated.Value(0)).current;
// const dotScales = useRef(
// Array.from({ length: PIN_LENGTH }, () => new Animated.Value(1)),
// ).current;

// const activePin = stage === "confirm" ? confirmPin : pin;
// const setActivePin = stage === "confirm" ? setConfirmPin : setPin;

// // Pulse a dot when a digit is added
// const pulseDot = (index: number) => {
// Animated.sequence([
// Animated.timing(dotScales[index], {
// toValue: 1.4,
// duration: 80,
// useNativeDriver: true,
// }),
// Animated.timing(dotScales[index], {
// toValue: 1,
// duration: 100,
// useNativeDriver: true,
// }),
// ]).start();
// };

// const triggerShake = () => {
// Vibration.vibrate(200);
// Animated.sequence([
// Animated.timing(shakeAnim, {
// toValue: 10,
// duration: 50,
// useNativeDriver: true,
// }),
// Animated.timing(shakeAnim, {
// toValue: -10,
// duration: 50,
// useNativeDriver: true,
// }),
// Animated.timing(shakeAnim, {
// toValue: 8,
// duration: 50,
// useNativeDriver: true,
// }),
// Animated.timing(shakeAnim, {
// toValue: -8,
// duration: 50,
// useNativeDriver: true,
// }),
// Animated.timing(shakeAnim, {
// toValue: 0,
// duration: 50,
// useNativeDriver: true,
// }),
// ]).start(() => {
// setTimeout(() => {
// setHasError(false);
// setActivePin([]);
// }, 400);
// });
// };

// const triggerSuccess = () => {
// Animated.spring(successAnim, {
// toValue: 1,
// useNativeDriver: true,
// tension: 60,
// friction: 6,
// }).start(() => {
// setTimeout(() => router.replace("/(tabs)"), 300);
// });
// };

// const handleKey = (value: string) => {
// if (value === "del") {
// setActivePin((prev) => prev.slice(0, -1));
// return;
// }
// if (activePin.length >= PIN_LENGTH) return;

// const next = [...activePin, value];
// pulseDot(activePin.length);
// setActivePin(next);

// if (next.length === PIN_LENGTH) {
// // Small delay so last dot animates before action
// setTimeout(() => handleComplete(next), 180);
// }
// };

// const handleComplete = (entered: string[]) => {
// if (isSetup) {
// if (stage === "enter") {
// // Move to confirm stage
// setStage("confirm");
// return;
// }
// // Confirm stage: check match
// if (entered.join("") === pin.join("")) {
// triggerSuccess();
// } else {
// setHasError(true);
// triggerShake();
// }
// } else {
// // Verify mode: check against stored PIN (replace with real logic)
// const MOCK_CORRECT = "1234";
// if (entered.join("") === MOCK_CORRECT) {
// triggerSuccess();
// } else {
// setHasError(true);
// triggerShake();
// }
// }
// };

// const heading = isSetup
// ? stage === "enter"
// ? "Set your PIN"
// : "Confirm your PIN"
// : "Enter your PIN";

// const subheading = isSetup
// ? stage === "enter"
// ? "Choose a 4-digit PIN to secure your account."
// : "Re-enter your PIN to confirm."
// : "Enter your 4-digit PIN to continue.";

// return (
// <MainContainer safe style={{ backgroundColor: theme.background }}>
// {/_ Header _/}
// <View style={styles.header}>
// <TouchableOpacity
// onPress={() => router.back()}
// style={[styles.backBtn, { backgroundColor: theme.cardBackground }]}
// >
// <Ionicons name="arrow-back" size={20} color={theme.text} />
// </TouchableOpacity>
// </View>

// {/_ Content _/}
// <View style={styles.content}>
// {/_ Lock icon _/}
// <Animated.View
// style={[
// styles.lockCircle,
// { backgroundColor: theme.primary + "15" },
// {
// transform: [
// {
// scale: successAnim.interpolate({
// inputRange: [0, 1],
// outputRange: [1, 1.15],
// }),
// },
// ],
// },
// ]}
// >
// <Animated.View>
// <Ionicons
// name={
// successAnim.\_\_getValue() === 1
// ? "checkmark-circle"
// : "lock-closed"
// }
// size={32}
// color={theme.primary}
// />
// </Animated.View>
// </Animated.View>

// <Spacer height={24} />

// <ThemedText style={styles.heading}>{heading}</ThemedText>
// <Spacer height={6} />
// <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
// {hasError
// ? isSetup
// ? "PINs don't match. Try again."
// : "Incorrect PIN. Try again."
// : subheading}
// </ThemedText>

// <Spacer height={40} />

// {/_ PIN dots _/}
// <View style={styles.dotsRow}>
// {Array.from({ length: PIN*LENGTH }).map((*, i) => (
// <Animated.View
// key={i}
// style={{ transform: [{ scale: dotScales[i] }] }}
// >
// <PinDot
// filled={i < activePin.length}
// shakeAnim={shakeAnim}
// theme={theme}
// hasError={hasError}
// />
// </Animated.View>
// ))}
// </View>

// {/_ Step indicator for setup mode _/}
// {isSetup && (
// <View style={styles.stepsRow}>
// <View
// style={[styles.stepLine, { backgroundColor: theme.primary }]}
// />
// <View
// style={[
// styles.stepLine,
// {
// backgroundColor:
// stage === "confirm" ? theme.primary : theme.border,
// },
// ]}
// />
// </View>
// )}
// </View>

// {/_ Keypad _/}
// <View style={styles.keypad}>
// {KEYS.map((row, ri) => (
// <View key={ri} style={styles.keyRow}>
// {row.map((key) => (
// <Key key={key} value={key} onPress={handleKey} theme={theme} />
// ))}
// </View>
// ))}

// {/_ Biometric hint (optional) _/}
// {!isSetup && (
// <TouchableOpacity style={styles.biometricBtn} activeOpacity={0.7}>
// <Ionicons
// name="finger-print-outline"
// size={28}
// color={theme.textSecondary}
// />
// <Text
// style={[styles.biometricText, { color: theme.textSecondary }]}
// >
// Use biometrics
// </Text>
// </TouchableOpacity>
// )}
// </View>
// </MainContainer>
// );
// }

// // --- Styles ---
// const styles = StyleSheet.create({
// header: {
// paddingHorizontal: 24,
// paddingTop: 12,
// paddingBottom: 4,
// },
// backBtn: {
// width: 40,
// height: 40,
// borderRadius: 10,
// alignItems: "center",
// justifyContent: "center",
// },

// content: {
// flex: 1,
// alignItems: "center",
// justifyContent: "center",
// paddingHorizontal: 32,
// },

// lockCircle: {
// width: 72,
// height: 72,
// borderRadius: 24,
// alignItems: "center",
// justifyContent: "center",
// },

// heading: {
// fontSize: 26,
// fontWeight: "800",
// textAlign: "center",
// letterSpacing: -0.3,
// },
// subheading: {
// fontSize: 14,
// textAlign: "center",
// lineHeight: 20,
// },

// dotsRow: {
// flexDirection: "row",
// gap: 20,
// },
// dot: {
// width: 18,
// height: 18,
// borderRadius: 9,
// borderWidth: 2,
// },

// stepsRow: {
// flexDirection: "row",
// gap: 6,
// marginTop: 20,
// },
// stepLine: {
// width: 28,
// height: 4,
// borderRadius: 2,
// },

// keypad: {
// paddingHorizontal: 24,
// paddingBottom: 36,
// gap: 12,
// },
// keyRow: {
// flexDirection: "row",
// justifyContent: "center",
// gap: 16,
// },
// keyTouchable: {
// flex: 1,
// maxWidth: 96,
// },
// key: {
// height: 72,
// borderRadius: 18,
// borderWidth: 1,
// alignItems: "center",
// justifyContent: "center",
// },
// keyPlaceholder: {
// flex: 1,
// maxWidth: 96,
// height: 72,
// },
// keyText: {
// fontSize: 24,
// fontWeight: "600",
// },

// biometricBtn: {
// alignItems: "center",
// gap: 6,
// paddingTop: 4,
// },
// biometricText: {
// fontSize: 13,
// fontWeight: "500",
// },
// });
