import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const ProductDetailsCard = ({ product, theme, onMessagePress }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const progress = product?.progress || 65;

  const handleCardPress = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      {/* Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.cardBackground }]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        {/* Header with Product Name and Stage */}
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: theme.text }]}>
              {product.name}
            </Text>
            <Text style={[styles.manufacturer, { color: theme.textSecondary }]}>
              {product.manufacturer}
            </Text>
          </View>

          <View
            style={[
              styles.stageBadge,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <Text style={[styles.stageBadgeText, { color: theme.primary }]}>
              {product.currentStage}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressHeader}>
            <Text
              style={[styles.progressLabel, { color: theme.textSecondary }]}
            >
              Progress
            </Text>

            <Text style={[styles.progressText, { color: theme.text }]}>
              {progress}%
            </Text>
          </View>

          <View
            style={[styles.progressTrack, { backgroundColor: theme.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Tap indicator */}
        <View style={styles.tapIndicator}>
          <Text style={[styles.tapText, { color: theme.textSecondary }]}>
            Tap for details →
          </Text>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Product Details
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseModal}
                    style={styles.closeButton}
                  >
                    <Text
                      style={[
                        styles.closeButtonText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Product Name */}
                  <View style={styles.detailSection}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Product Name
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {product.name}
                    </Text>
                  </View>

                  {/* Manufacturer */}
                  <View style={styles.detailSection}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Manufacturer
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {product.manufacturer}
                    </Text>
                  </View>

                  {/* Quantity */}
                  <View style={styles.detailSection}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Quantity
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {product.quantity}
                    </Text>
                  </View>

                  {/* Cost */}
                  <View style={styles.detailSection}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Cost
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {product.cost}
                    </Text>
                  </View>

                  {/* Current Stage */}
                  <View style={styles.detailSection}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Current Stage
                    </Text>

                    <Text
                      style={[styles.detailStageText, { color: theme.primary }]}
                    >
                      {product.currentStage}
                    </Text>
                  </View>

                  {/* Progress */}
                  <View style={styles.detailSection}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Progress
                    </Text>

                    <View style={styles.detailProgressWrapper}>
                      <View
                        style={[
                          styles.detailProgressTrack,
                          { backgroundColor: theme.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.detailProgressFill,
                            {
                              width: `${progress}%`,
                              backgroundColor: theme.primary,
                            },
                          ]}
                        />
                      </View>

                      <Text
                        style={[
                          styles.detailProgressText,
                          { color: theme.text },
                        ]}
                      >
                        {progress}% Complete
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.detailSection}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Description
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {product.description}
                    </Text>
                  </View>

                  {/* Message Button */}
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => {
                      handleCloseModal();
                      if (onMessagePress) {
                        onMessagePress(product);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Send Message</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Card Styles
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  manufacturer: {
    fontSize: 13,
    fontWeight: "400",
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  progressWrapper: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  tapIndicator: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  tapText: {
    fontSize: 11,
    fontWeight: "400",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
    minHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "400",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "500",
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  detailStageBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  detailStageText: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailProgressWrapper: {
    gap: 8,
  },
  detailProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  detailProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  detailProgressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

export default ProductDetailsCard;
