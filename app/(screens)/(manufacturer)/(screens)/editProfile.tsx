import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
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

const fetchManufacturerProfile = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    companyName: "Mensah Fabrications Ltd",
    initials: "MF",
    location: "Tema Industrial Area, Tema, Ghana",
    email: "info@mensahfab.com",
    phone: "+233 30 123 4567",
    website: "www.mensahfab.com",
    avatarUri: null as string | null,
    coverUri: null as string | null,
  };
};

const updateManufacturerProfile = async (data: any) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { success: true };
};

export default function EditManufacturerProfile() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    companyName: "",
    location: "",
    email: "",
    phone: "",
    website: "",
    avatarUri: null as string | null,
    coverUri: null as string | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await fetchManufacturerProfile();
      setFormData(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await updateManufacturerProfile(formData);
      Alert.alert("Success", "Workspace changes saved cleanly", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: "avatar" | "cover") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant photo library access");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 6],
      quality: 0.8,
    });
    if (!result.canceled) {
      setFormData({ ...formData, [`${type}Uri`]: result.assets[0].uri });
    }
  };

  const takePhoto = async (type: "avatar" | "cover") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera access");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 6],
      quality: 0.8,
    });
    if (!result.canceled) {
      setFormData({ ...formData, [`${type}Uri`]: result.assets[0].uri });
    }
  };

  const showImageOptions = (type: "avatar" | "cover") => {
    Alert.alert(
      `Modify ${type === "avatar" ? "Display Image" : "Backdrop Canvas"}`,
      "Choose a valid source",
      [
        { text: "Camera Shot", onPress: () => takePhoto(type) },
        { text: "Media Library", onPress: () => pickImage(type) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  // Header Parallax Interpolations
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

  // Fade out the cover edit button slightly as the user scrolls up
  const coverButtonOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
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

      {/* ── Dynamic Top Bar Floating Navigation ── */}
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
            Modify Workspace
          </Text>
        </View>
      </Animated.View>

      {/* Back Floating Navigation Button */}
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

      {/* ── HIGH Z-INDEX INTERACTIVE COVER BUTTON ── */}
      {/* Placed out of the background layer so it is fully tap-responsive */}
      <Animated.View
        style={[
          styles.foregroundCoverTriggerContainer,
          { opacity: coverButtonOpacity },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => showImageOptions("cover")}
          style={[
            styles.coverActionIndicator,
            {
              backgroundColor: theme.text,
              borderColor: theme.background + "20",
            },
          ]}
        >
          <Ionicons name="camera-outline" size={13} color={theme.background} />

          <Text style={[styles.coverActionText, { color: theme.background }]}>
            Update Cover Asset
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Background Canvas Parallax Backdrop Frame ── */}
      <Animated.View
        style={[
          styles.coverContainer,
          {
            transform: [{ scale: coverScale }, { translateY: coverTranslateY }],
          },
        ]}
      >
        <View style={StyleSheet.absoluteFill}>
          {formData.coverUri ? (
            <Image
              source={{ uri: formData.coverUri }}
              style={styles.coverImage}
            />
          ) : (
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
          )}
        </View>
      </Animated.View>

      {/* ── Scrollable Body Context ── */}
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
            {/* Integrated Avatar Header Anchor Card */}
            <View
              style={[
                styles.profileMasterCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => showImageOptions("avatar")}
                style={[
                  styles.avatarBoundary,
                  {
                    borderColor: theme.cardBackground,
                    backgroundColor: theme.cardBackground,
                  },
                ]}
              >
                {formData.avatarUri ? (
                  <Image
                    source={{ uri: formData.avatarUri }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={[styles.avatar, { backgroundColor: theme.primary }]}
                  >
                    <Text style={styles.avatarInitials}>
                      {formData.companyName
                        ? formData.companyName.slice(0, 2).toUpperCase()
                        : "MF"}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.avatarBadgeOverlay,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="camera" size={10} color="#FFF" />
                </View>
              </TouchableOpacity>

              <Text
                style={[styles.anchorLabelText, { color: theme.textSecondary }]}
              >
                TAP TO UPDATE DISPLAY LOGO
              </Text>
            </View>

            {/* Inputs: Corporate details */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                CORPORATE DETAILS
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
                  value={formData.companyName}
                  onChangeText={(t: string) =>
                    setFormData({ ...formData, companyName: t })
                  }
                  error={errors.companyName}
                  theme={theme}
                  icon="business-outline"
                />
                <InputField
                  label="Hub Operations Location"
                  value={formData.location}
                  onChangeText={(t: string) =>
                    setFormData({ ...formData, location: t })
                  }
                  error={errors.location}
                  theme={theme}
                  icon="location-outline"
                  last
                />
              </View>
            </View>

            {/* Inputs: Channels */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                CHANNELS AND LINKS
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
                  label="Corporate Email"
                  value={formData.email}
                  onChangeText={(t: string) =>
                    setFormData({ ...formData, email: t })
                  }
                  error={errors.email}
                  theme={theme}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <InputField
                  label="Contact Line"
                  value={formData.phone}
                  onChangeText={(t: string) =>
                    setFormData({ ...formData, phone: t })
                  }
                  error={errors.phone}
                  theme={theme}
                  icon="call-outline"
                  keyboardType="phone-pad"
                />
                <InputField
                  label="Web Address"
                  value={formData.website}
                  onChangeText={(t: string) =>
                    setFormData({ ...formData, website: t })
                  }
                  theme={theme}
                  icon="globe-outline"
                  autoCapitalize="none"
                  last
                />
              </View>
            </View>

            {/* Layout Spacer View */}
            <View style={{ height: 16 }} />

            {/* Form Save Button */}
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
                    Save Structural Updates
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

// ── Shared Minimal Stack Input Design ──────────────────────────────
const InputField = ({
  label,
  value,
  onChangeText,
  error,
  theme,
  icon,
  keyboardType = "default",
  autoCapitalize = "sentences",
  last,
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
          placeholder={`Specify ${label.toLowerCase()}`}
          placeholderTextColor={theme.textSecondary + "50"}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={theme.primary}
        />
      </View>
    </View>
    {error && <Text style={styles.fieldInlineError}>{error}</Text>}
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
  coverImage: { width: "100%", height: "100%" },
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
  foregroundCoverTriggerContainer: {
    position: "absolute",
    top: COVER_HEIGHT - 82,
    right: 16,
    zIndex: 45, // Elevated above everything else to pick up tap gestures cleanly
  },
  coverActionIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    // elevation: 3,
  },
  coverActionText: { fontSize: 11, fontWeight: "600", letterSpacing: -0.1 },
  scrollContent: { paddingTop: COVER_HEIGHT - 32, paddingBottom: 40 },
  mainCardPositioner: { paddingHorizontal: 16 },
  profileMasterCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  avatarBoundary: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    marginTop: -64,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: { fontSize: 26, fontWeight: "700", color: "#FFFFFF" },
  avatarBadgeOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  anchorLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 12,
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
  rowLeftNode: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
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
