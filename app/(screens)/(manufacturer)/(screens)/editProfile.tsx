import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import { ThemedText } from "@/components/themed-text";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// Mock function to fetch current manufacturer profile (replace with real API)
const fetchManufacturerProfile = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    companyName: "Mensah Fabrications Ltd",
    initials: "MF",
    verified: true,
    location: "Tema Industrial Area, Tema, Ghana",
    registrationNumber: "CS0123456789",
    since: "2018",
    category: "Metal Fabrication",
    email: "info@mensahfab.com",
    phone: "+233 30 123 4567",
    website: "www.mensahfab.com",
    bankName: "GCB Bank",
    accountNumber: "****1234",
    accountName: "Mensah Fabrications Ltd",
    avatarUri: null as string | null,
    coverUri: null as string | null,
  };
};

// Mock update function
const updateManufacturerProfile = async (data: any) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { success: true };
};

export default function EditManufacturerProfile() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { fromSettings } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    companyName: "",
    location: "",
    registrationNumber: "",
    category: "",
    email: "",
    phone: "",
    website: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    avatarUri: null as string | null,
    coverUri: null as string | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await fetchManufacturerProfile();
      setFormData({
        companyName: data.companyName,
        location: data.location,
        registrationNumber: data.registrationNumber,
        category: data.category,
        email: data.email,
        phone: data.phone,
        website: data.website,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        avatarUri: data.avatarUri,
        coverUri: data.coverUri,
      });
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
    if (!formData.registrationNumber.trim())
      newErrors.registrationNumber = "Registration number is required";
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required";
    if (!formData.accountNumber.trim())
      newErrors.accountNumber = "Account number is required";
    if (!formData.accountName.trim())
      newErrors.accountName = "Account name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the highlighted fields");
      return;
    }
    setLoading(true);
    try {
      await updateManufacturerProfile(formData);
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
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
      Alert.alert(
        "Permission needed",
        "Please grant access to your photo library",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setFormData({ ...formData, [`${type}Uri`]: result.assets[0].uri });
    }
  };

  const showImageOptions = (type: "avatar" | "cover") => {
    Alert.alert(
      `Change ${type === "avatar" ? "Profile Picture" : "Cover Photo"}`,
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => takePhoto(type) },
        { text: "Choose from Library", onPress: () => pickImage(type) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const takePhoto = async (type: "avatar" | "cover") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera access");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setFormData({ ...formData, [`${type}Uri`]: result.assets[0].uri });
    }
  };

  if (initialLoading) {
    return (
      <MainContainer safe>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </MainContainer>
    );
  }

  return (
    <MainContainer safe>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.mainContainer}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                style={[
                  styles.backBtn,
                  { backgroundColor: theme.iconBackground },
                ]}
              >
                <Ionicons name="chevron-back" size={24} color={theme.icon} />
              </Pressable>
              <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
            </View>

            <Spacer style={{ height: 20 }} />

            {/* Cover Photo */}
            <View style={styles.coverSection}>
              <TouchableOpacity
                onPress={() => showImageOptions("cover")}
                style={styles.coverContainer}
              >
                {formData.coverUri ? (
                  <Image
                    source={{ uri: formData.coverUri }}
                    style={styles.coverImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.coverPlaceholder,
                      { backgroundColor: theme.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={theme.primary}
                    />
                    <ThemedText style={{ color: theme.primary, marginTop: 8 }}>
                      Tap to add cover
                    </ThemedText>
                  </View>
                )}
                <View
                  style={[
                    styles.coverEditIcon,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={() => showImageOptions("avatar")}
                style={styles.avatarWrapper}
              >
                {formData.avatarUri ? (
                  <Image
                    source={{ uri: formData.avatarUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <ThemedText style={styles.avatarInitials}>
                      {formData.companyName
                        ? formData.companyName.slice(0, 2).toUpperCase()
                        : "MF"}
                    </ThemedText>
                  </View>
                )}
                <View
                  style={[
                    styles.avatarEditIcon,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            <Spacer style={{ height: 30 }} />

            {/* Business Details */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Business Details
              </ThemedText>
              <InputField
                label="Company Name"
                value={formData.companyName}
                onChangeText={(text) =>
                  setFormData({ ...formData, companyName: text })
                }
                error={errors.companyName}
                theme={theme}
                icon="business-outline"
              />
              <InputField
                label="Location"
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
                error={errors.location}
                theme={theme}
                icon="location-outline"
              />
              <InputField
                label="Registration Number"
                value={formData.registrationNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, registrationNumber: text })
                }
                error={errors.registrationNumber}
                theme={theme}
                icon="document-text-outline"
              />
              <InputField
                label="Category"
                value={formData.category}
                onChangeText={(text) =>
                  setFormData({ ...formData, category: text })
                }
                error={errors.category}
                theme={theme}
                icon="briefcase-outline"
              />
            </View>

            <Spacer style={{ height: 24 }} />

            {/* Contact Information */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Contact</ThemedText>
              <InputField
                label="Email"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                error={errors.email}
                theme={theme}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <InputField
                label="Phone"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                error={errors.phone}
                theme={theme}
                icon="call-outline"
                keyboardType="phone-pad"
              />
              <InputField
                label="Website"
                value={formData.website}
                onChangeText={(text) =>
                  setFormData({ ...formData, website: text })
                }
                theme={theme}
                icon="globe-outline"
                autoCapitalize="none"
              />
            </View>

            <Spacer style={{ height: 24 }} />

            {/* Payment Details */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Payment Details
              </ThemedText>
              <InputField
                label="Bank Name"
                value={formData.bankName}
                onChangeText={(text) =>
                  setFormData({ ...formData, bankName: text })
                }
                error={errors.bankName}
                theme={theme}
                icon="business-outline"
              />
              <InputField
                label="Account Number"
                value={formData.accountNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, accountNumber: text })
                }
                error={errors.accountNumber}
                theme={theme}
                icon="card-outline"
                keyboardType="numeric"
              />
              <InputField
                label="Account Name"
                value={formData.accountName}
                onChangeText={(text) =>
                  setFormData({ ...formData, accountName: text })
                }
                error={errors.accountName}
                theme={theme}
                icon="person-outline"
              />
            </View>

            <Spacer style={{ height: 40 }} />

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={loading}
              style={[
                styles.saveButton,
                { backgroundColor: theme.primary },
                loading && styles.disabledButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.saveButtonText}>
                  Save Changes
                </ThemedText>
              )}
            </Pressable>

            <Spacer style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </MainContainer>
  );
}

// Helper Input Component
const InputField = ({
  label,
  value,
  onChangeText,
  error,
  theme,
  icon,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: any) => (
  <View style={styles.inputGroup}>
    <View style={styles.labelRow}>
      <Ionicons name={icon} size={16} color={theme.textSecondary} />
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: theme.inputBackground || theme.cardBackground,
          color: theme.text,
          borderColor: error ? "#FF3B30" : theme.border,
        },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={`Enter ${label.toLowerCase()}`}
      placeholderTextColor={theme.textSecondary + "80"}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
    {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
  </View>
);

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { flexGrow: 1 },
  mainContainer: { paddingHorizontal: 16, flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", marginLeft: 16 },
  coverSection: { marginTop: 16, alignItems: "center" },
  coverContainer: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  coverImage: { width: "100%", height: "100%", resizeMode: "cover" },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  coverEditIcon: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarSection: { alignItems: "center", marginTop: -50, marginBottom: 8 },
  avatarWrapper: { position: "relative" },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarInitials: { fontSize: 36, fontWeight: "bold", color: "#fff" },
  avatarEditIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  section: { gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  inputGroup: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  errorText: { fontSize: 12, color: "#FF3B30", marginLeft: 4 },
  saveButton: {
    height: 52,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabledButton: { opacity: 0.6 },
});
