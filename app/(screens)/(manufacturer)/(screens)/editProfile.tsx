import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { api, handleApiError } from "@/services/api";
import { mmkvStorage } from "@/store/mmkv";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 220;

type Theme = (typeof Colors)["light"];

const DRAFT_KEY = "factoryProfileDraft";

// Tracks whether we've ever successfully created a profile for this
// user, purely on-device. There's still no GET /users/factory-profile
// to check server-side whether a profile exists — only POST (create)
// and PUT (update) — so this local flag is a stand-in for that check.
// It decides which verb to call: first successful save -> POST, every
// save after that -> PUT. This is an approximation, not a real fix:
// if the user reinstalls or clears storage, this flag resets and the
// next save will incorrectly try POST again against an existing
// profile. The real fix is a GET endpoint (or embedding factory
// profile data in GET /users/me) so this can be driven by actual
// server state instead of a guess.
const PROFILE_CREATED_KEY = "factoryProfileCreated";

const SAVE_DEBOUNCE_MS = 500;

// Matches CreateFactoryProfileRequest from the OpenAPI spec exactly.
// Used as the body for both createFactoryProfile (POST) and
// updateFactoryProfile (PUT) — they share the same request schema.
interface FactoryProfilePayload {
  companyName: string;
  description?: string;
  sectorTags: string[];
  machineryList?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
}

// Local draft shape — everything the form needs to fully restore itself,
// including raw string inputs (like sectorTagsInput) rather than the
// parsed payload, so partially-typed values aren't lost either.
interface FactoryProfileDraft {
  companyName: string;
  description: string;
  sectorTagsInput: string;
  machineryList: string;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

const emptyDraft: FactoryProfileDraft = {
  companyName: "",
  description: "",
  sectorTagsInput: "",
  machineryList: "",
  minOrderQuantity: "",
  maxOrderQuantity: "",
  address: "",
  latitude: null,
  longitude: null,
};

// Parses a numeric text field into a clean integer or undefined —
// never NaN. parseInt("", 10) or parseInt("abc", 10) both produce
// NaN, and JSON.stringify(NaN) serializes to `null`, which gets sent
// to a non-nullable `integer` field on the backend and can trigger an
// unhandled deserialization exception (surfaces as a 500, not a 400).
const parseIntOrUndefined = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function EditManufacturerProfile() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  // Read-only, pulled from the real user object (GET /users/me).
  const [displayName, setDisplayName] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");

  // Editable — persisted locally as a draft since there's still no
  // GET /users/factory-profile to restore this from the backend.
  const [draft, setDraft] = useState<FactoryProfileDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  // Tracks whether the initial load has finished, so the debounce-save
  // effect below doesn't immediately overwrite the saved draft with the
  // empty default state on first render.
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadProfile();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const loadProfile = async () => {
    try {
      const { data: user } = await api.get("users/me");

      setDisplayName(user.fullName || "");
      setDisplayPhone(user.phoneNumber || "");

      // Check for existing draft
      const raw = await mmkvStorage.getItem(DRAFT_KEY);

      if (raw) {
        const restored: FactoryProfileDraft = JSON.parse(raw);

        // Always use the latest full name as the default company name
        restored.companyName = user.fullName || "";

        setDraft(restored);
      } else {
        setDraft({
          ...emptyDraft,
          companyName: user.fullName || "", // Default company name
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setInitialLoading(false);
      hasLoadedRef.current = true;
    }
  };

  // Debounced auto-save of the draft to MMKV on every change, so the
  // user never has to refill the form just from navigating away.
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await mmkvStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        // Non-critical — worst case the user retypes a field. Don't
        // interrupt them with an alert for a background save failing.
        console.warn("Failed to save profile draft:", e);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [draft]);

  const updateDraft = (patch: Partial<FactoryProfileDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const fetchCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need location access to auto-fill your address.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const parts = [
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.country,
        ].filter(Boolean);
        updateDraft({
          address: parts.join(", "),
          latitude,
          longitude,
        });
        setErrors((prev) => ({ ...prev, address: "" }));
      } else {
        Alert.alert(
          "Error",
          "Could not determine your address. Please enter it manually.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Location Error",
        "Failed to get your current location. Please try again.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!draft.companyName.trim())
      newErrors.companyName = "Company name is required";

    const tags = draft.sectorTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) {
      newErrors.sectorTags = "Add at least one sector tag";
    }

    if (
      draft.minOrderQuantity.trim() &&
      Number.isNaN(parseInt(draft.minOrderQuantity, 10))
    ) {
      newErrors.minOrderQuantity = "Must be a valid number";
    }
    if (
      draft.maxOrderQuantity.trim() &&
      Number.isNaN(parseInt(draft.maxOrderQuantity, 10))
    ) {
      newErrors.maxOrderQuantity = "Must be a valid number";
    }

    if (
      draft.minOrderQuantity &&
      draft.maxOrderQuantity &&
      !Number.isNaN(parseInt(draft.minOrderQuantity, 10)) &&
      !Number.isNaN(parseInt(draft.maxOrderQuantity, 10)) &&
      parseInt(draft.minOrderQuantity, 10) >
        parseInt(draft.maxOrderQuantity, 10)
    ) {
      newErrors.maxOrderQuantity = "Max must be greater than min";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const sectorTags = draft.sectorTagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload: FactoryProfilePayload = {
      companyName: draft.companyName.trim(),
      sectorTags,
      description: draft.description.trim() || undefined,
      machineryList: draft.machineryList.trim() || undefined,
      minOrderQuantity: parseIntOrUndefined(draft.minOrderQuantity),
      maxOrderQuantity: parseIntOrUndefined(draft.maxOrderQuantity),
      address: draft.address.trim() || undefined,
      latitude: draft.latitude !== null ? draft.latitude : undefined,
      longitude: draft.longitude !== null ? draft.longitude : undefined,
    };

    setLoading(true);

    try {
      // No leading slash — baseURL already includes /api/v1.
      //
      // No GET /users/factory-profile exists yet to check server-side
      // whether a profile already exists, so we branch on a local
      // flag instead: first successful save ever -> POST (create),
      // every save after that -> PUT (update). This is what fixes the
      // original 500 — that was very likely createFactoryProfile
      // being called a second time against a unique ownerId
      // constraint with no upsert handling.
      const alreadyCreated = await mmkvStorage.getItem(PROFILE_CREATED_KEY);

      if (alreadyCreated === "true") {
        await api.put("users/factory-profile", payload);
      } else {
        await api.post("users/factory-profile", payload);
        await mmkvStorage.setItem(PROFILE_CREATED_KEY, "true");
      }

      // Save the latest values locally
      await mmkvStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...draft,
          companyName: payload.companyName,
        }),
      );

      Alert.alert("Success", "Factory profile saved successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      // Log the raw response body so the actual backend error (if any)
      // is visible instead of just Axios's generic status-code message.
      if (axios.isAxiosError(error)) {
        console.log(
          "Factory profile save failed — response body:",
          error.response?.data,
        );
        console.log("Status:", error.response?.status);
      }
      console.error("Failed to save factory profile:", error);

      Alert.alert("Couldn't save profile", handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0.4, 1],
    extrapolate: "clamp",
  });

  const coverScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [2, 1],
    extrapolateRight: "clamp",
  });

  const coverTranslateY = scrollY.interpolate({
    inputRange: [-200, 0, COVER_HEIGHT],
    outputRange: [-100, 0, COVER_HEIGHT * 0.5],
    extrapolate: "clamp",
  });

  if (initialLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <Animated.View
        style={[
          styles.headerBlur,
          { opacity: headerOpacity, borderBottomColor: theme.border },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 100}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Factory Profile
          </Text>
        </View>
      </Animated.View>

      <View
        style={[
          styles.navActionWrapper,
          { top: Platform.OS === "ios" ? 54 : 40 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.navBtn,
            { backgroundColor: theme.cardBackground + "E0" },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.coverContainer,
          {
            transform: [{ scale: coverScale }, { translateY: coverTranslateY }],
          },
        ]}
      >
        <View
          style={[
            styles.coverPlaceholderContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <LinearGradient
            colors={[theme.primary + "12", theme.primary + "02"]}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.fallbackFrameDecoration,
              { borderColor: theme.border },
            ]}
          />
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.mainCardPositioner}>
            <View style={styles.profileMasterCard}>
              <View
                style={[
                  styles.avatarBoundary,
                  {
                    borderColor: theme.cardBackground,
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Text style={styles.avatarInitials}>
                  {draft.companyName
                    ? draft.companyName.slice(0, 2).toUpperCase()
                    : "MF"}
                </Text>
              </View>
              <Text
                style={[styles.anchorLabelText, { color: theme.textSecondary }]}
              >
                {displayName} · {displayPhone}
              </Text>
              <Text
                style={[styles.readOnlyNote, { color: theme.textSecondary }]}
              >
                Name and phone number are set at registration and can't be
                edited here yet.
              </Text>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                FACTORY DETAILS
              </Text>
              <View
                style={[
                  styles.groupedCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <InputField
                  label="Company Name"
                  value={displayName}
                  onChangeText={() => {}}
                  editable={false}
                  theme={theme}
                  icon="business-outline"
                />
                <InputField
                  label="Sector Tags (comma separated)"
                  value={draft.sectorTagsInput}
                  onChangeText={(t: string) =>
                    updateDraft({ sectorTagsInput: t })
                  }
                  error={errors.sectorTags}
                  theme={theme}
                  icon="pricetags-outline"
                  placeholder="e.g. Textiles, Furniture, Packaging"
                />
                <TextAreaField
                  label="Description"
                  value={draft.description}
                  onChangeText={(t: string) => updateDraft({ description: t })}
                  theme={theme}
                  icon="document-text-outline"
                  placeholder="Tell buyers about your factory, your expertise, and what sets you apart…"
                />
                <InputField
                  label="Machinery / Equipment"
                  value={draft.machineryList}
                  onChangeText={(t: string) =>
                    updateDraft({ machineryList: t })
                  }
                  theme={theme}
                  icon="construct-outline"
                  placeholder="e.g. 3 injection molders, 2 CNC lathes"
                  last
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                CAPACITY
              </Text>
              <View
                style={[
                  styles.groupedCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <InputField
                  label="Minimum Order Quantity"
                  value={draft.minOrderQuantity}
                  onChangeText={(t: string) =>
                    updateDraft({ minOrderQuantity: t })
                  }
                  error={errors.minOrderQuantity}
                  theme={theme}
                  icon="cube-outline"
                  keyboardType="number-pad"
                />
                <InputField
                  label="Maximum Order Quantity"
                  value={draft.maxOrderQuantity}
                  onChangeText={(t: string) =>
                    updateDraft({ maxOrderQuantity: t })
                  }
                  error={errors.maxOrderQuantity}
                  theme={theme}
                  icon="cube-outline"
                  keyboardType="number-pad"
                  last
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                LOCATION
              </Text>
              <View
                style={[
                  styles.groupedCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <InputField
                  label="Factory Address"
                  value={draft.address}
                  onChangeText={(t: string) => updateDraft({ address: t })}
                  theme={theme}
                  icon="location-outline"
                  rightIconName="locate-outline"
                  onRightIconPress={fetchCurrentLocation}
                  rightIconLoading={locationLoading}
                  last
                />
              </View>
            </View>

            <View style={{ height: 16 }} />

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.primaryAction, { borderColor: theme.primary }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={16}
                    color={theme.text}
                  />
                  <Text
                    style={[styles.primaryActionLabel, { color: theme.text }]}
                  >
                    Save Factory Profile
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const InputField = ({
  label,
  value,
  onChangeText,
  error,
  theme,
  icon,
  keyboardType = "default",
  autoCapitalize = "sentences",
  placeholder,
  last,
  rightIconName,
  onRightIconPress,
  rightIconLoading = false,
}: any) => (
  <View
    style={[
      styles.inputRow,
      !last && { borderBottomWidth: 1, borderBottomColor: theme.border + "40" },
    ]}
  >
    <View style={styles.rowLeftNode}>
      <View
        style={[
          styles.fieldIconWrap,
          { backgroundColor: theme.primary + "0A" },
        ]}
      >
        <Ionicons name={icon} size={15} color={theme.icon} />
      </View>

      <View style={styles.fieldContentBlock}>
        <Text
          style={[
            styles.fieldInlineLabel,
            { color: error ? theme.error : theme.textSecondary },
          ]}
        >
          {label.toUpperCase()}
        </Text>

        <TextInput
          style={[styles.nativeInput, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || `Specify ${label.toLowerCase()}`}
          placeholderTextColor={theme.textSecondary + "50"}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={theme.primary}
        />
      </View>
    </View>

    <View style={styles.rowRightNode}>
      {rightIconName && onRightIconPress && (
        <TouchableOpacity
          onPress={onRightIconPress}
          disabled={rightIconLoading}
          style={styles.rightIconTouch}
        >
          {rightIconLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons name={rightIconName} size={18} color={theme.primary} />
          )}
        </TouchableOpacity>
      )}
      {error && <Text style={styles.fieldInlineError}>{error}</Text>}
    </View>
  </View>
);

const TextAreaField = ({
  label,
  value,
  onChangeText,
  theme,
  icon,
  placeholder,
  last,
}: any) => (
  <View
    style={[
      styles.inputRow,
      styles.textAreaRow,
      !last && { borderBottomWidth: 1, borderBottomColor: theme.border + "40" },
    ]}
  >
    <View style={styles.rowLeftNode}>
      <View
        style={[
          styles.fieldIconWrap,
          { backgroundColor: theme.primary + "0A" },
        ]}
      >
        <Ionicons name={icon} size={15} color={theme.icon} />
      </View>

      <View style={styles.fieldContentBlock}>
        <Text style={[styles.fieldInlineLabel, { color: theme.textSecondary }]}>
          {label.toUpperCase()}
        </Text>

        <TextInput
          style={[styles.textAreaInput, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.textSecondary + "50"}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          selectionColor={theme.primary}
        />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 94 : 80,
    zIndex: 40,
    borderBottomWidth: 0.5,
    justifyContent: "flex-end",
  },
  headerContent: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 70,
  },
  headerTitle: { fontSize: 15, fontWeight: "600" },
  navActionWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  coverContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: COVER_HEIGHT,
    zIndex: 0,
  },
  coverPlaceholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackFrameDecoration: {
    width: "90%",
    height: "70%",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    opacity: 0.3,
    position: "absolute",
    top: "15%",
  },
  scrollContent: { paddingTop: COVER_HEIGHT - 32, paddingBottom: 40 },
  mainCardPositioner: { paddingHorizontal: 16 },
  profileMasterCard: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  avatarBoundary: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    marginTop: -64,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: { fontSize: 26, fontWeight: "700", color: "#FFFFFF" },
  anchorLabelText: { fontSize: 12, fontWeight: "600", marginTop: 12 },
  readOnlyNote: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  textAreaRow: {
    alignItems: "flex-start",
    paddingVertical: 12,
    minHeight: 100,
  },
  rowLeftNode: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowRightNode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 4,
  },
  rightIconTouch: { padding: 4 },
  fieldIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldContentBlock: { flex: 1, justifyContent: "center" },
  fieldInlineLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  nativeInput: { fontSize: 14, fontWeight: "500", padding: 0, height: 22 },
  textAreaInput: {
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
    minHeight: 70,
    textAlignVertical: "top",
  },
  fieldInlineError: { fontSize: 11, fontWeight: "600", color: "#EF4444" },
  primaryAction: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryActionLabel: { fontSize: 14, fontWeight: "600" },
});
