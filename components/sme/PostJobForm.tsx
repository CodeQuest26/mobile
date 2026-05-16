import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import Spacer from "@/components/Spacer";

// Job categories with icons
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
  deadline: string;
  requirements: string[];
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
    deadline: "",
    requirements: [""],
  });

  const [currentRequirement, setCurrentRequirement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      Alert.alert("Missing Quantity", "Please specify the quantity needed.");
      return false;
    }
    // if (!formData.budget.trim()) {
    //   Alert.alert("Missing Budget", "Please set your budget for this job.");
    //   return false;
    // }
    if (!formData.location.trim()) {
      Alert.alert("Missing Location", "Please enter the delivery location.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Submit to API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

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
      Alert.alert("Error", "Failed to post job. Please try again.");
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

          {/* Quantity & Budget Row */}
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
                      { borderColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name="calculator-outline"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="e.g., 10,000 units"
                      placeholderTextColor={theme.textSecondary}
                      value={formData.quantity}
                      onChangeText={(value) =>
                        updateFormData("quantity", value)
                      }
                    />
                  </View>
                </View>
                <View style={styles.halfInput}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Budget
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { borderColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="e.g., GH₵ 50,000"
                      placeholderTextColor={theme.textSecondary}
                      value={formData.budget}
                      onChangeText={(value) => updateFormData("budget", value)}
                      keyboardType="numeric"
                    />
                  </View>
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

          {/* Requirements */}
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
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
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

          {/* Submit Button */}
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
                  <View style={styles.loadingContainer}>
                    <Text
                      style={[styles.submitText, { color: theme.onPrimary }]}
                    >
                      Posting Job...
                    </Text>
                  </View>
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

export default PostJobForm;

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
  // Inputs
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    height:"100%",
    width:"100%"
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 120,
  },
  textArea: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Row layout
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  // Requirements
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingRight: 8,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  removeBtn: {
    marginLeft: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  // Submit
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Dropdown styles
  dropdownText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
    minHeight: 60,
  },
  categoryOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: -0.3,
    flex: 1,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
