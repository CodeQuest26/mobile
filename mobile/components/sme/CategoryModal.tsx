import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FadeIn from "../common/FadeIn";

interface Category {
  name: string;
  icon: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  theme: any;
}

const CategoryModal = ({
  visible,
  onClose,
  categories,
  selectedCategory,
  onSelect,
  theme,
}: Props) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: theme.background }]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Category
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCloseBtn, { backgroundColor: theme.border }]}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((category, index) => (
              <FadeIn key={category.name} delay={index * 50}>
                <TouchableOpacity
                  onPress={() => {
                    onSelect(category.name);
                    onClose();
                  }}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        selectedCategory === category.name
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
                            selectedCategory === category.name
                              ? theme.primary
                              : theme.text,
                          fontWeight:
                            selectedCategory === category.name ? "600" : "400",
                        },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </View>

                  {selectedCategory === category.name && (
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
  );
};

export default CategoryModal;

const styles = StyleSheet.create({
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
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
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
