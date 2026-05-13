import MainContainer from "@/components/MainContainer";
import PostJobForm from "@/components/sme/PostJobForm";
import Colors from "@/constants/colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

// FadeIn animation component
const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

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

const PostJob = () => {
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
    if (!formData.budget.trim()) {
      Alert.alert("Missing Budget", "Please set your budget for this job.");
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert("Missing Location", "Please enter the delivery location.");
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert("Missing Description", "Please provide a job description.");
      return false;
    }
    if (!formData.deadline) {
      Alert.alert("Missing Deadline", "Please set a deadline for the job.");
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
              // TODO: Navigate to job details
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
    <MainContainer safe>
      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Post a New Job
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <PostJobForm />

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select Category
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: theme.border },
                ]}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {JOB_CATEGORIES.map((category, index) => (
                <FadeIn key={category.name} delay={index * 50}>
                  <TouchableOpacity
                    onPress={() => {
                      updateFormData("category", category.name);
                      setShowCategoryModal(false);
                    }}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor:
                          formData.category === category.name
                            ? theme.primary + "15"
                            : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.categoryOptionLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: theme.primary + "15" },
                        ]}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={20}
                          color={theme.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          {
                            color:
                              formData.category === category.name
                                ? theme.primary
                                : theme.text,
                            fontWeight:
                              formData.category === category.name
                                ? "600"
                                : "400",
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </View>
                    {formData.category === category.name && (
                      <View
                        style={[
                          styles.checkmarkContainer,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={theme.onPrimary}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </FadeIn>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </MainContainer>
  );
};

export default PostJob;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

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

  // Modal styles
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
