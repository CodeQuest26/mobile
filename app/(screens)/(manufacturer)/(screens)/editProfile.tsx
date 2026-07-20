import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { api, handleApiError } from "@/services/api";
import { mmkvStorage } from "@/store/mmkv";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
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
//
// The schema now includes email, region, town, and profileImageUrl —
// so the uploaded Cloudinary URL from pickAndUploadLogo can be sent
// straight through as `profileImageUrl` instead of staying local-only.
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
  email?: string;
  region?: string;
  town?: string;
  profileImageUrl?: string;
}

// Local draft shape — everything the form needs to fully restore itself,
// including raw string inputs (like sectorTagsInput) rather than the
// parsed payload, so partially-typed values aren't lost either.
// `logoUrl` is persisted locally AND sent to the backend now (as
// `profileImageUrl` — see handleSave), so it's kept as its own field
// here rather than a raw string input, since it's set by the upload
// flow rather than typed by the user.
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
  logoUrl: string | null;
  email: string;
  region: string;
  town: string;
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
  logoUrl: null,
  email: "",
  region: "",
  town: "",
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

// ---------------------------------------------------------------------
// Cloudinary upload integration — POST /api/v1/files/upload
//
// Matches the "File Uploads" tag in the OpenAPI spec:
//   requestBody: multipart/form-data, field name "file"
//   200 response: { url: string, ...other string keys }
//
// On React Native, FormData needs the RN-specific { uri, name, type }
// shape (not a browser File/Blob), and the Content-Type header must be
// left for axios/RN to set with the correct multipart boundary — hand-
// setting it to a bare "multipart/form-data" string strips the
// boundary param and the request fails server-side with EMPTY_FILE.
// Auth is assumed to be attached by an axios interceptor on `api`,
// same as every other call in this file (api.get/put/post elsewhere
// never pass an Authorization header manually).
// ---------------------------------------------------------------------
async function uploadFileToServer(
  asset: ImagePicker.ImagePickerAsset,
): Promise<string> {
  const formData = new FormData();

  const filename =
    asset.fileName || asset.uri.split("/").pop() || `upload-${Date.now()}.jpg`;
  const extMatch = /\.(\w+)$/.exec(filename);
  const inferredType = extMatch
    ? `image/${extMatch[1].toLowerCase()}`
    : "image/jpeg";

  // RN FormData file entry — NOT a web File object.
  formData.append("file", {
    uri: asset.uri,
    name: filename,
    type: asset.mimeType || inferredType,
  } as any);

  const { data } = await api.post("files/upload", formData, {
    headers: {
      Accept: "application/json",
      // Do NOT set 'Content-Type': 'multipart/form-data' here — RN's
      // fetch/XHR layer fills in the multipart boundary automatically
      // when it detects a FormData body. Overriding it manually is a
      // common cause of "EMPTY_FILE" errors from this endpoint.
    },
  });

  if (!data?.url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return data.url as string;
}

export default function EditManufacturerProfile() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Read-only, pulled from the real user object (GET /users/me).
  // displayName is updated locally after a successful save if the
  // companyName changed — see handleSave — so this screen doesn't need
  // a re-fetch just to reflect the sync it triggered itself.
  const [displayName, setDisplayName] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");

  // Editable — persisted locally as a draft since there's still no
  // GET /users/factory-profile to restore this from the backend.
  const [draft, setDraft] = useState<FactoryProfileDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  // Whether we've ever successfully created a profile for this user
  // (see the PROFILE_CREATED_KEY comment above). Drives which verb
  // handleSave tries FIRST — this matters because PUTing a
  // factory-profile row that doesn't exist yet throws a 500 on the
  // backend (NPE on update-of-nonexistent-entity), not a clean 404,
  // so we can't rely on catching 404 alone to decide when to fall
  // back to POST.
  const [profileExists, setProfileExists] = useState(false);

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
      const createdFlag = await mmkvStorage.getItem(PROFILE_CREATED_KEY);
      setProfileExists(createdFlag === "true");

      if (raw) {
        const restored: FactoryProfileDraft = JSON.parse(raw);

        // Spread over emptyDraft (not the other way round) so any
        // fields added to the schema since this draft was cached —
        // logoUrl, email, region, town — fall back to sane empty
        // values instead of surfacing as undefined in controlled inputs.
        setDraft({ ...emptyDraft, ...restored });
      } else {
        setDraft({
          ...emptyDraft,
          // Starting point for brand-new profiles — companyName and
          // fullName are meant to stay in sync going forward (see
          // handleSave), so it makes sense to seed the field with the
          // account's existing name rather than leaving it blank.
          companyName: user.fullName || "",
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

  // Pick a logo/cover image from the library and upload it immediately,
  // mirroring the "upload on select" pattern from the integration guide
  // (ProfileAvatarUpload). Stores the resulting Cloudinary URL in the
  // draft so it survives navigation/app restarts, same as every other
  // field here.
  const pickAndUploadLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need photo library access to set your company logo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploadingLogo(true);
    try {
      const url = await uploadFileToServer(asset);
      updateDraft({ logoUrl: url });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(
          "Logo upload failed — response body:",
          error.response?.data,
        );
        console.log("Status:", error.response?.status);
      }
      console.error("Failed to upload logo:", error);
      Alert.alert("Upload failed", handleApiError(error));
    } finally {
      setUploadingLogo(false);
    }
  };

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

    const trimmedEmail = draft.email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Enter a valid email address";
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

    // Despite CreateFactoryProfileRequest.machineryList being typed as a
    // plain `string` in the OpenAPI schema, the backend column is
    // actually json/jsonb — Postgres rejects anything that isn't valid
    // JSON syntax with a DATABASE_ERROR (confirmed via the working
    // Swagger sample, which sent a JSON-encoded array as this string).
    // So the free-text, comma-separated UI input has to be converted
    // into a JSON array string, the same way sectorTagsInput already
    // gets split into an array — just JSON-encoded rather than sent
    // as a raw array, since the schema still says `string`.
    const machineryItems = draft.machineryList
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload: FactoryProfilePayload = {
      companyName: draft.companyName.trim(),
      sectorTags,
      description: draft.description.trim() || undefined,
      machineryList:
        machineryItems.length > 0 ? JSON.stringify(machineryItems) : undefined,
      minOrderQuantity: parseIntOrUndefined(draft.minOrderQuantity),
      maxOrderQuantity: parseIntOrUndefined(draft.maxOrderQuantity),
      address: draft.address.trim() || undefined,
      latitude: draft.latitude !== null ? draft.latitude : undefined,
      longitude: draft.longitude !== null ? draft.longitude : undefined,
      email: draft.email.trim() || undefined,
      region: draft.region.trim() || undefined,
      town: draft.town.trim() || undefined,
      profileImageUrl: draft.logoUrl || undefined,
    };

    setLoading(true);

    console.log(
      "Saving factory profile — outgoing payload:",
      JSON.stringify(payload, null, 2),
    );

    try {
      if (profileExists) {
        // Known returning user — update the existing row.
        try {
          await api.put("users/factory-profile", payload);
        } catch (putError) {
          // A 404 here means our local flag was stale (e.g. storage was
          // cleared, or a reinstall) and there's actually no row to
          // update yet — fall back to create. Anything else is a real
          // failure and should propagate to the outer catch.
          const isNotFound =
            axios.isAxiosError(putError) && putError.response?.status === 404;

          if (!isNotFound) throw putError;

          await api.post("users/factory-profile", payload);
        }
      } else {
        // First save for this user. We lead with POST rather than PUT
        // here: PUTing a factory-profile row that doesn't exist yet
        // throws a 500 on the backend (looks like an NPE on
        // update-of-nonexistent-entity) instead of a clean 404, so a
        // "try PUT, fall back to POST on 404" strategy doesn't work as
        // the *first* move — it only works once we already know the
        // row exists. If the row somehow already exists server-side
        // (flag out of sync with backend), fall back to PUT on 409/400.
        try {
          await api.post("users/factory-profile", payload);
        } catch (postError) {
          // Only 409 means "this already exists, use PUT instead."
          // A 400 here is a genuine validation failure on THIS payload
          // — retrying with PUT would send the same invalid body and
          // just fail again with the same 400, masking the real error.
          const isConflict =
            axios.isAxiosError(postError) && postError.response?.status === 409;

          if (!isConflict) throw postError;

          await api.put("users/factory-profile", payload);
        }
      }

      await mmkvStorage.setItem(PROFILE_CREATED_KEY, "true");
      setProfileExists(true);

      await mmkvStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...draft,
          companyName: payload.companyName,
        }),
      );

      // Keep the account-level fullName in sync with companyName. This
      // is deliberately a separate, best-effort call — not folded into
      // the try/catch above — because the factory profile save is the
      // thing the user actually asked to do here, and its success
      // shouldn't be undone or blocked by a failure in this secondary
      // sync against a different endpoint (PUT /api/v1/users/profile).
      // Only fire it when the name actually changed, to avoid a
      // pointless network call on every save.
      if (payload.companyName !== displayName) {
        try {
          await api.put("users/profile", { fullName: payload.companyName });
          setDisplayName(payload.companyName);
        } catch (syncError) {
          if (axios.isAxiosError(syncError)) {
            console.log(
              "fullName sync failed — response body:",
              syncError.response?.data,
            );
          }
          console.warn(
            "Factory profile saved, but syncing fullName failed:",
            syncError,
          );
          // Don't surface a second alert on top of the success alert
          // below — the user's actual save succeeded. This will just
          // retry on the next save.
        }
      }

      Alert.alert("Success", "Factory profile saved successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
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
              <TouchableOpacity
                onPress={pickAndUploadLogo}
                disabled={uploadingLogo}
                activeOpacity={0.85}
                style={[
                  styles.avatarBoundary,
                  {
                    borderColor: theme.cardBackground,
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                {uploadingLogo ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : draft.logoUrl ? (
                  <Image
                    source={{ uri: draft.logoUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>
                    {draft.companyName
                      ? draft.companyName.slice(0, 2).toUpperCase()
                      : "MF"}
                  </Text>
                )}

                <View
                  style={[
                    styles.avatarEditBadge,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={12}
                    color={theme.icon}
                  />
                </View>
              </TouchableOpacity>
              <Text
                style={[styles.anchorLabelText, { color: theme.textSecondary }]}
              >
                {displayName} · {displayPhone}
              </Text>
              <Text
                style={[styles.readOnlyNote, { color: theme.textSecondary }]}
              >
                Your account name stays in sync with the company name below —
                editing it here updates both. Phone number is set at
                registration and can't be changed here. Tap the logo to upload a
                company photo.
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
                  value={draft.companyName}
                  onChangeText={(t: string) => updateDraft({ companyName: t })}
                  error={errors.companyName}
                  theme={theme}
                  icon="business-outline"
                  placeholder="Your company's public name"
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
                />
                <InputField
                  label="Region"
                  value={draft.region}
                  onChangeText={(t: string) => updateDraft({ region: t })}
                  theme={theme}
                  icon="map-outline"
                  placeholder="e.g. Ashanti"
                />
                <InputField
                  label="Town / City"
                  value={draft.town}
                  onChangeText={(t: string) => updateDraft({ town: t })}
                  theme={theme}
                  icon="business-outline"
                  placeholder="e.g. Kumasi"
                  last
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                CONTACT
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
                  label="Business Email"
                  value={draft.email}
                  onChangeText={(t: string) => updateDraft({ email: t })}
                  error={errors.email}
                  theme={theme}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="e.g. sales@yourfactory.com"
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
    overflow: "visible",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
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
