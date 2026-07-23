import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { api, handleApiError } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Theme = (typeof Colors)["light"];

// ── Labeled text input ──────────────────────────────────────────
const FieldInput = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  theme,
  keyboardType,
  autoCapitalize,
  editable = true,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  theme: Theme;
  keyboardType?: any;
  autoCapitalize?: any;
  editable?: boolean;
}) => (
  <View style={styles.fieldWrapper}>
    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
      {label}
    </Text>
    <View
      style={[
        styles.fieldRow,
        {
          backgroundColor: editable
            ? theme.cardBackground
            : theme.border + "30",
          borderColor: theme.border,
          opacity: editable ? 1 : 0.7,
        },
      ]}
    >
      <Ionicons name={icon as any} size={18} color={theme.textSecondary} />
      <TextInput
        style={[
          styles.fieldInput,
          { color: editable ? theme.text : theme.textSecondary },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary + "80"}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
    </View>
  </View>
);

// ── Section ──────────────────────────────────────────────────────
const Section = ({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: Theme;
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
    {children}
  </View>
);

// ── Screen ──────────────────────────────────────────────────────
const EditProfile = () => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const user = useAuthStore((s) => s.user);
  const getMe = useAuthStore((s) => s.getMe);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load existing profile details from store & backend
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        await getMe();
      } catch (err) {
        console.warn("[EditProfile] Failed to fetch current user:", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [getMe]);

  // Sync state when user updates
  useEffect(() => {
    if (user) {
      setCompanyName(user.fullName || "");
      setCity((user as any)?.town || "");
      setRegion(user.region || "");
      setPhone(user.phoneNumber || "");
      setAvatarUri(user.profileImageUrl || null);
    }
  }, [user]);

  const initials =
    companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "SME";

  const canSave = companyName.trim().length > 0 && !saving && !uploadingImage;

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to update your avatar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatarIfLocal = async (
    localUri: string,
  ): Promise<string | null> => {
    // If it's already a remote URL, no need to re-upload
    if (localUri.startsWith("http://") || localUri.startsWith("https://")) {
      return localUri;
    }

    setUploadingImage(true);
    try {
      const filename = localUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      const formData = new FormData();
      formData.append("file", {
        uri: localUri,
        name: filename,
        type,
      } as any);

      const { data } = await api.post("files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data?.url || data?.fileUrl || null;
    } catch (err) {
      console.error("[EditProfile] Failed to upload avatar:", err);
      Alert.alert(
        "Image Upload Failed",
        "Could not upload profile picture. Continuing with existing picture.",
      );
      return user?.profileImageUrl || null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      let finalAvatarUrl = user?.profileImageUrl || null;
      if (avatarUri && avatarUri !== user?.profileImageUrl) {
        finalAvatarUrl = await uploadAvatarIfLocal(avatarUri);
      }

      const payload = {
        fullName: companyName.trim(),
        region: region.trim() || undefined,
        town: city.trim() || undefined,
        profileImageUrl: finalAvatarUrl || undefined,
        email: email,
      };

      await api.put("users/profile", payload);
      await getMe();

      Alert.alert("Success", "Profile updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.error("[EditProfile] Update failed:", err);
      const msg = handleApiError(err);
      Alert.alert("Update Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser && !user) {
    return (
      <View
        style={[
          styles.screen,
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="small" color={theme.primary} />
        <Text
          style={{ marginTop: 12, color: theme.textSecondary, fontSize: 14 }}
        >
          Loading profile...
        </Text>
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

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: theme.cardBackground }]}
        >
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Edit Profile
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={[
            styles.saveBtn,
            { backgroundColor: canSave ? theme.primary : theme.border },
          ]}
        >
          {saving || uploadingImage ? (
            <ActivityIndicator size="small" color={theme.onPrimary} />
          ) : (
            <Text
              style={[
                styles.saveBtnText,
                { color: canSave ? theme.onPrimary : theme.textSecondary },
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable
              onPress={handlePickAvatar}
              style={styles.avatarPressable}
              disabled={saving || uploadingImage}
            >
              <View
                style={[
                  styles.avatarBoundary,
                  { borderColor: theme.cardBackground },
                ]}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View
                    style={[styles.avatar, { backgroundColor: theme.primary }]}
                  >
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.avatarEditBadge,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.background,
                  },
                ]}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <Ionicons name="camera" size={14} color={theme.onPrimary} />
                )}
              </View>
            </Pressable>
            <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>
              Tap to change photo
            </Text>
          </View>

          {/* Business details */}
          <Section title="Business" theme={theme}>
            <FieldInput
              label="Company Name"
              icon="business-outline"
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Your company name"
              theme={theme}
              autoCapitalize="words"
            />

            <View style={styles.fieldGap} />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FieldInput
                  label="City / Town"
                  icon="location-outline"
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Kumasi"
                  theme={theme}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldGapHorizontal} />
              <View style={styles.halfField}>
                <FieldInput
                  label="Region"
                  icon="map-outline"
                  value={region}
                  onChangeText={setRegion}
                  placeholder="e.g. Ashanti"
                  theme={theme}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </Section>

          {/* Contact */}
          <Section title="Contact" theme={theme}>
            <FieldInput
              label="Phone Number"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="+233 ** *** ****"
              theme={theme}
              keyboardType="phone-pad"
              editable={false}
            />

            <Spacer />

            <FieldInput
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="business@example.com"
              theme={theme}
              keyboardType="email-address"
              editable={true}
              autoCapitalize={false}
            />
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  saveBtn: {
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarPressable: {
    position: "relative",
  },
  avatarBoundary: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  avatarHint: {
    fontSize: 12.5,
    fontWeight: "500",
    marginTop: 10,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
  },
  halfField: {
    flex: 1,
  },
  fieldGap: {
    height: 14,
  },
  fieldGapHorizontal: {
    width: 12,
  },

  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "500",
    padding: 0,
    height: "100%",
  },
});
