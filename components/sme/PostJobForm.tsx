import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import FadeIn from "../common/FadeIn";
import CategoryModal from "./CategoryModal";

const JOB_CATEGORIES = [
  { name: "Packaging", icon: "cube-outline" },
  { name: "Hardware", icon: "build-outline" },
  { name: "Plastics", icon: "flask-outline" },
  { name: "Textiles", icon: "shirt-outline" },
  { name: "Electronics", icon: "hardware-chip-outline" },
  { name: "Food Processing", icon: "restaurant-outline" },
  { name: "Furniture", icon: "bed-outline" },
  { name: "Agro-processing", icon: "leaf-outline" },
  { name: "Metalworking", icon: "hammer-outline" },
  { name: "Chemicals", icon: "flask-outline" },
  { name: "Paper & Printing", icon: "document-text-outline" },
  { name: "Glass & Ceramics", icon: "bulb-outline" },
];

interface FormData {
  category: string;
  product: string;
  quantity: string;
  budget: string;
  location: string;
  description: string;
  deadline: Date | null;
  requirements: string[];
  images: ImagePicker.ImagePickerAsset[];
}

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

  formData.append("file", {
    uri: asset.uri,
    name: filename,
    type: asset.mimeType || inferredType,
  } as any);

  const { data } = await api.post("files/upload", formData, {
    headers: { Accept: "application/json" },
  });
  return data.url as string;
}

const PostJobForm = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const [formData, setFormData] = useState<FormData>({
    category: "",
    product: "",
    quantity: "",
    budget: "",
    location: "",
    description: "",
    deadline: null,
    requirements: [],
    images: [],
  });

  // Real-time error indicator states
  const [quantityError, setQuantityError] = useState("");
  const [budgetError, setBudgetError] = useState("");

  const [currentRequirement, setCurrentRequirement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handles text normalization depending on strict field constraints
  const handleNumericInput = (field: "quantity" | "budget", text: string) => {
    if (field === "quantity") {
      // Quantity allows numbers only
      const hasNonNumeric = /[^0-9]/.test(text);
      if (hasNonNumeric) {
        setQuantityError("Quantity accepts numbers only");
      } else {
        setQuantityError("");
      }
      const cleanNumber = text.replace(/[^0-9]/g, "");
      updateFormData("quantity", cleanNumber);
    } else {
      // Budget allows numbers and up to a single decimal point separator
      const isValidDecimalInput = /^[0-9]*\.?[0-9]*$/.test(text);
      if (!isValidDecimalInput) {
        setBudgetError("Budget accepts decimal numbers only");
        return; // Prevent adding secondary periods or invalid text strings
      } else {
        setBudgetError("");
      }
      updateFormData("budget", text);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const eventType = event.type;

    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }

    if (eventType === "set" && selectedDate) {
      updateFormData("deadline", selectedDate);
    }
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      updateFormData("requirements", [
        ...formData.requirements,
        currentRequirement.trim(),
      ]);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    updateFormData("requirements", newRequirements);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need access to your photos to attach imagery.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData("images", [...formData.images, ...result.assets]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need access to your camera to snap job references.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData("images", [...formData.images, result.assets[0]]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData("images", newImages);
  };

  const validateForm = (): boolean => {
    if (!formData.category) {
      Alert.alert("Missing Category", "Please select a job category.");
      return false;
    }
    if (!formData.product.trim()) {
      Alert.alert("Missing Product", "Please enter the product name.");
      return false;
    }
    if (!formData.quantity.trim()) {
      Alert.alert(
        "Missing Quantity",
        "Please specify the numerical quantity needed.",
      );
      return false;
    }
    if (!formData.budget.trim() || isNaN(Number(formData.budget))) {
      Alert.alert(
        "Invalid Budget",
        "Please set a clean valid financial budget for this job.",
      );
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert("Missing Location", "Please enter the delivery location.");
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert(
        "Missing Description",
        "Please provide a job specification description.",
      );
      return false;
    }
    if (!formData.deadline) {
      Alert.alert(
        "Missing Deadline",
        "Please set a structural deadline for the job.",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let attachmentUrls: string[] = [];
      if (formData.images.length > 0) {
        setIsUploadingImages(true);
        attachmentUrls = await Promise.all(
          formData.images.map((asset) => uploadFileToServer(asset)),
        );
        setIsUploadingImages(false);
      }

      const specifications = formData.requirements.length
        ? `${formData.description}

Requirements:
- ${formData.requirements.join("\n- ")}`
        : formData.description;

      const payload = {
        title: formData.product,
        productType: formData.product,
        sectorTag: formData.category,
        quantity: Number(formData.quantity),
        specifications,
        budgetMinGhs: Number(formData.budget),
        budgetMaxGhs: Number(formData.budget),
        deliveryAddress: formData.location,
        deadline: formData.deadline?.toISOString(),
        attachmentUrls,
      };

      await api.post("jobs", payload);

      Alert.alert(
        "Job Posted Successfully!",
        "Your job has been posted and manufacturers will start bidding soon.",
        [
          {
            text: "View Job",
            onPress: () => {
              router.back();
            },
          },
          {
            text: "Post Another",
            style: "default",
          },
        ],
      );
    } catch (error) {
      setIsUploadingImages(false);
      const message = handleApiError(error);
      Alert.alert("Error", message || "Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Original Restored Header Layout Tree */}
        <View
          style={{
            paddingHorizontal: 15,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              height: 40,
              width: 40,
              backgroundColor: theme.iconBackground,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 10,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={25} color={theme.icon} />
          </TouchableOpacity>

          <Text
            style={{
              fontWeight: "bold",
              fontSize: 20,
              color: theme.text,
              marginLeft: 10,
            }}
          >
            Job Post Form
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Selection */}
          <FadeIn delay={50}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Job Category
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(true)}
                style={[styles.inputContainer, { borderColor: theme.border }]}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.dropdownText,
                    {
                      color: formData.category
                        ? theme.text
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {formData.category || "Select a category"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </FadeIn>

          {/* Product Name */}
          <FadeIn delay={100}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Product Name
              </Text>

              <View
                style={[styles.inputContainer, { borderColor: theme.border }]}
              >
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g., Aluminium Beverage Cans"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.product}
                  onChangeText={(value) => updateFormData("product", value)}
                />
              </View>
            </View>
          </FadeIn>

          {/* Quantity & Budget Row (With Dynamic Decimal Validation support) */}
          <FadeIn delay={150}>
            <View style={styles.section}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Quantity
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { borderColor: quantityError ? "#EF4444" : theme.border },
                    ]}
                  >
                    <Ionicons
                      name="calculator-outline"
                      size={20}
                      color={quantityError ? "#EF4444" : theme.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="10000"
                      placeholderTextColor={theme.textSecondary}
                      value={formData.quantity}
                      onChangeText={(value) =>
                        handleNumericInput("quantity", value)
                      }
                      keyboardType="number-pad"
                    />
                  </View>
                  {!!quantityError && (
                    <Text style={styles.errorLabelText}>{quantityError}</Text>
                  )}
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Budget (GH₵)
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { borderColor: budgetError ? theme.error : theme.border },
                    ]}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={20}
                      color={budgetError ? theme.error : theme.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="50000.00"
                      placeholderTextColor={theme.textSecondary}
                      value={formData.budget}
                      onChangeText={(value) =>
                        handleNumericInput("budget", value)
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>
                  {!!budgetError && (
                    <Text style={styles.errorLabelText}>{budgetError}</Text>
                  )}
                </View>
              </View>
            </View>
          </FadeIn>

          {/* Location */}
          <FadeIn delay={200}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Delivery Location
              </Text>
              <View
                style={[styles.inputContainer, { borderColor: theme.border }]}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g., Spintex Road, Accra"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.location}
                  onChangeText={(value) => updateFormData("location", value)}
                />
              </View>
            </View>
          </FadeIn>

          {/* Description Input Field */}
          <FadeIn delay={250}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Job Specifications & Description
              </Text>
              <View
                style={[
                  styles.textAreaContainer,
                  { borderColor: theme.border },
                ]}
              >
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Provide precise details regarding structural specifications, structural dimensions, materials required, or specific production constraints..."
                  placeholderTextColor={theme.textSecondary}
                  value={formData.description}
                  onChangeText={(value) => updateFormData("description", value)}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </FadeIn>

          {/* Media Grid with Pro Arrangement Layout */}
          <FadeIn delay={280}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Supporting Media & Blueprints
              </Text>
              <View style={styles.mediaRow}>
                <TouchableOpacity
                  style={[styles.mediaPickerBox, { borderColor: theme.border }]}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="images-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={[styles.mediaPickerText, { color: theme.text }]}>
                    Library
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mediaPickerBox, { borderColor: theme.border }]}
                  onPress={takePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="camera-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={[styles.mediaPickerText, { color: theme.text }]}>
                    Camera
                  </Text>
                </TouchableOpacity>

                {formData.images.map((asset, index) => (
                  <View key={index} style={styles.imageThumbnailWrap}>
                    <Image
                      source={{ uri: asset.uri }}
                      style={[styles.thumbnail, { borderColor: theme.border }]}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeBadge,
                        { backgroundColor: theme.cardBackground || "#FFF" },
                      ]}
                      onPress={() => removeImage(index)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="close-outline"
                        size={14}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </FadeIn>

          {/* Native Platform Date Calendar Picker Field */}
          <FadeIn delay={300}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Deadline
              </Text>

              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.9}
                style={[styles.inputContainer, { borderColor: theme.border }]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.dropdownText,
                    {
                      color: formData.deadline
                        ? theme.text
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {formData.deadline
                    ? formData.deadline.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a deadline date"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.deadline || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  accentColor={theme.primary}
                />
              )}

              {Platform.OS === "ios" && showDatePicker && (
                <TouchableOpacity
                  style={[
                    styles.iosDoneButton,
                    {
                      backgroundColor: theme.onPrimary,
                      borderWidth: 1,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>
                    Confirm Date
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </FadeIn>

          {/* Requirements List Section */}
          <FadeIn delay={350}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Requirements
              </Text>

              <Text
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                Specify what manufacturers need to meet
              </Text>

              {formData.requirements.map((req, index) =>
                req ? (
                  <View key={index} style={styles.requirementItem}>
                    <Text
                      style={[styles.requirementText, { color: theme.text }]}
                    >
                      • {req}
                    </Text>

                    <TouchableOpacity
                      onPress={() => removeRequirement(index)}
                      style={styles.removeBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ) : null,
              )}

              <View
                style={[styles.inputContainer, { borderColor: theme.border }]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={theme.textSecondary}
                />

                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Add a requirement..."
                  placeholderTextColor={theme.textSecondary}
                  value={currentRequirement}
                  onChangeText={setCurrentRequirement}
                  onSubmitEditing={addRequirement}
                  returnKeyType="done"
                />

                <TouchableOpacity
                  onPress={addRequirement}
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: currentRequirement.trim()
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={
                      currentRequirement.trim()
                        ? theme.onPrimary
                        : theme.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </FadeIn>

          {/* Submit Action Button */}
          <FadeIn delay={400}>
            <View style={styles.submitSection}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: isSubmitting
                      ? theme.border
                      : theme.primary,
                    shadowColor: theme.primary,
                  },
                ]}
              >
                {isSubmitting ? (
                  <Text style={[styles.submitText, { color: theme.onPrimary }]}>
                    {isUploadingImages
                      ? "Uploading Images..."
                      : "Posting Job..."}
                  </Text>
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color={theme.onPrimary}
                      style={styles.submitIcon}
                    />
                    <Text
                      style={[styles.submitText, { color: theme.onPrimary }]}
                    >
                      Post Job
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={JOB_CATEGORIES}
        selectedCategory={formData.category}
        onSelect={(category) => updateFormData("category", category)}
        theme={theme}
      />
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    height: "100%",
  },
  errorLabelText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
  },
  textArea: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  mediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  mediaPickerBox: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPickerText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  imageThumbnailWrap: {
    position: "relative",
  },
  thumbnail: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingRight: 8,
    justifyContent: "space-between",
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  removeBtn: {
    marginLeft: 12,
    padding: 4,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  iosDoneButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  submitBtn: {
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
});

export default PostJobForm;
