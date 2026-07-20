import { BidStatus, BidWithManufacturer } from "@/constants/Jobstore";
import {
  PaystackAuthorizationModal,
  usePaystackAuthorization,
} from "@/hooks/usePayStackHook";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import StarRating from "./StarRating";

// ─── Local constants & helpers ────────────────────────────────────────────────
const BID_STATUS: Record<BidStatus, { label: string; icon: string }> = {
  pending: { label: "Pending", icon: "time-outline" },
  accepted: { label: "Accepted", icon: "checkmark-circle" },
  rejected: { label: "Rejected", icon: "close-circle" },
};

interface ManufacturerModalProps {
  visible: boolean;
  manufacturer: BidWithManufacturer["manufacturer"] | null;
  bid: BidWithManufacturer | null;
  /** The order ID associated with this bid (needed for payment initiation) */
  orderId: string;
  theme: any;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  /** Called after a successful payment (the hook fires onSuccess) */
  onPaymentComplete?: () => void;
}

const ManufacturerModal: React.FC<ManufacturerModalProps> = ({
  visible,
  manufacturer,
  bid,
  orderId,
  theme,
  onClose,
  onAccept,
  onReject,
  onPaymentComplete,
}) => {
  const [isInitiating, setIsInitiating] = useState(false);
  const [isManufacturerVisible, setIsManufacturerVisible] = useState(visible);
  const [paymentFlowActive, setPaymentFlowActive] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsManufacturerVisible(false);
      setPaymentFlowActive(false);
      return;
    }

    if (!paymentFlowActive) {
      setIsManufacturerVisible(true);
    }
  }, [paymentFlowActive, visible]);

  const {
    openAuthorizationUrl,
    closeAuthorization,
    visible: payVisible,
    authorizationUrl: payUrl,
    loading: payLoading,
    handleLoadStart,
    handleLoadEnd,
    handleShouldStartLoad,
  } = usePaystackAuthorization({
    onSuccess: () => {
      setPaymentFlowActive(false);
      setIsManufacturerVisible(false);
      onClose();
      onPaymentComplete?.();
    },
    onClose: () => {
      setPaymentFlowActive(false);
      setIsManufacturerVisible(false);
    },
  });

  const handleModalClose = useCallback(() => {
    setPaymentFlowActive(false);
    setIsManufacturerVisible(false);
    onClose();
  }, [onClose]);

  // Called when the “Initiate Payment” button is pressed
  const handleInitiatePayment = useCallback(async () => {
    if (!orderId) {
      Alert.alert("Missing order", "No order found for this bid.");
      return;
    }

    setIsInitiating(true);
    try {
      // Pre-check the order
      const { data: order } = await api.get(`orders`);
      const order_id = order?.content?.filter((i: any) => i.bidId === bid?.id);
      // --- Replace with your actual API call (fetch/axios) ---
      const { data } = await api.post("payments/initiate", {
        orderId: order_id[0]?.id,
      });

      const authorizationUrl = data.authorization_url;
      // -------------------------------------------------------

      if (!authorizationUrl) {
        throw new Error("No authorization URL returned");
      }

      setPaymentFlowActive(true);
      setIsManufacturerVisible(false);
      openAuthorizationUrl(authorizationUrl);
    } catch (error: unknown) {
      const responseStatus = (error as { response?: { status?: number } })
        ?.response?.status;
      const responseData = (error as { response?: { data?: unknown } })
        ?.response?.data;

      console.log("Payment initiation error:", responseStatus, responseData);
      Alert.alert(
        "Couldn't start payment",
        "We weren't able to start the checkout. Please try again.",
      );
    } finally {
      setIsInitiating(false);
    }
  }, [orderId, openAuthorizationUrl]);

  if (!manufacturer || !bid) return null;
  const bidStatus = BID_STATUS[bid.status];

  return (
    <>
      <Modal
        visible={isManufacturerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleModalClose}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View
            style={[styles.modalHandle, { backgroundColor: theme.border }]}
          />

          {/* Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <TouchableOpacity
              onPress={handleModalClose}
              style={[
                styles.modalCloseBtn,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Manufacturer Profile
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={{ paddingHorizontal: 20 }}>
              {/* Identity block */}
              <View
                style={[
                  styles.identityBlock,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <View style={styles.identityRow}>
                  {manufacturer.logo ? (
                    <Image
                      source={{ uri: manufacturer.logo }}
                      style={styles.manufacturerLogo}
                    />
                  ) : (
                    <View
                      style={[
                        styles.logoPlaceholder,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.logoInitials, { color: theme.primary }]}
                      >
                        {manufacturer.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.identityText}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[styles.manufacturerName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {manufacturer.name}
                      </Text>
                      {manufacturer.verified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={theme.text}
                        />
                      )}
                    </View>
                    <View style={styles.ratingRow}>
                      <StarRating rating={manufacturer.rating} />
                      <Text
                        style={[
                          styles.ratingText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {manufacturer.rating} ({manufacturer.reviewCount}{" "}
                        reviews)
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.manufacturerLocation,
                        { color: theme.textSecondary },
                      ]}
                    >
                      <Ionicons name="location-outline" size={12} />{" "}
                      {manufacturer.location}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.manufacturerDesc,
                    {
                      color: theme.textSecondary,
                      borderTopColor: theme.border,
                    },
                  ]}
                >
                  {manufacturer.description}
                </Text>
              </View>

              {/* Specialties */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Specialties
              </Text>
              <View style={styles.tagsWrap}>
                {manufacturer.specialties.map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.tag,
                      { backgroundColor: theme.primary + "15" },
                    ]}
                  >
                    <Text
                      style={[styles.tagText, { color: theme.textSecondary }]}
                    >
                      {s}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Bid details */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Their Bid
              </Text>
              <View
                style={[
                  styles.bidDetailCard,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <View style={styles.bidDetailRow}>
                  <View style={styles.bidAmountBlock}>
                    <Text
                      style={[
                        styles.bidAmountLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Bid Amount
                    </Text>
                    <Text
                      style={[styles.bidAmountValue, { color: theme.primary }]}
                    >
                      {bid.amount}
                    </Text>
                  </View>
                  <View style={[styles.bidStatusBadge]}>
                    <Ionicons
                      name={bidStatus.icon as any}
                      size={14}
                      color={theme.primary}
                    />
                    <Text
                      style={[styles.bidStatusText, { color: theme.primary }]}
                    >
                      {bidStatus.label}
                    </Text>
                  </View>
                </View>
                <View
                  style={[styles.bidDivider, { backgroundColor: theme.border }]}
                />
                <View style={styles.bidMeta}>
                  <View style={styles.bidMetaItem}>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.bidMetaText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Delivery in{" "}
                      <Text style={{ color: theme.text, fontWeight: "700" }}>
                        {bid.deliveryDays} days
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.bidMetaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.bidMetaText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Submitted{" "}
                      <Text style={{ color: theme.text, fontWeight: "700" }}>
                        {bid.submittedAt}
                      </Text>
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.bidNoteBox,
                    {
                      backgroundColor: theme.primary + "0A",
                      borderColor: theme.primary + "25",
                    },
                  ]}
                >
                  <Text style={[styles.bidNoteLabel, { color: theme.primary }]}>
                    Note from manufacturer
                  </Text>
                  <Text style={[styles.bidNoteText, { color: theme.text }]}>
                    {bid.notes}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              {bid.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={onReject}
                    style={[styles.rejectBtn, { borderColor: theme.error }]}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={18}
                      color={theme.error}
                    />
                    <Text
                      style={[styles.rejectBtnText, { color: theme.error }]}
                    >
                      Decline Bid
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onAccept}
                    style={[
                      styles.acceptBtn,
                      {
                        backgroundColor: theme.cardBackground,
                        borderWidth: 1,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      style={[styles.acceptBtnText, { color: theme.primary }]}
                    >
                      Accept Bid
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {bid.status === "accepted" && (
                <TouchableOpacity
                  onPress={handleInitiatePayment}
                  disabled={isInitiating}
                  style={[
                    styles.paymentBtn,
                    { backgroundColor: theme.primary },
                    isInitiating && { opacity: 0.7 },
                  ]}
                >
                  {isInitiating ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : (
                    <>
                      <Ionicons
                        name="card-outline"
                        size={18}
                        color={theme.onPrimary}
                      />
                      <Text
                        style={[
                          styles.paymentBtnText,
                          { color: theme.onPrimary },
                        ]}
                      >
                        Initiate Payment
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Contact */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    router.push({
                      pathname: "/ChatRoom",
                      params: {
                        userType: "sme",
                        contactId: manufacturer.id,
                        contactName: manufacturer.name,
                        contactInitials: manufacturer.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2),
                        contactOnline: "0",
                      },
                    });
                  }, 120);
                }}
                style={[
                  styles.contactBtn,
                  {
                    backgroundColor: theme.cardBackground,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginTop: bid.status === "accepted" ? 12 : 0,
                  },
                ]}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={theme.text}
                />
                <Text style={[styles.contactBtnText, { color: theme.text }]}>
                  Message {manufacturer.name}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Paystack authorization modal (replaces the old WebView) */}
      <PaystackAuthorizationModal
        visible={payVisible}
        authorizationUrl={payUrl}
        loading={payLoading}
        theme={{
          background: theme.background,
          borderColor: theme.border,
          card: theme.cardBackground,
          textColor: theme.text,
          primary: theme.primary,
        }}
        onClose={closeAuthorization}
        onSuccess={() => {}}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  identityBlock: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  identityRow: { flexDirection: "row", gap: 14, marginBottom: 12 },
  manufacturerLogo: { width: 64, height: 64, borderRadius: 14 },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitials: { fontSize: 22, fontWeight: "800" },
  identityText: { flex: 1, justifyContent: "center", gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  manufacturerName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { fontSize: 12 },
  manufacturerLocation: { fontSize: 13 },
  manufacturerDesc: {
    fontSize: 14,
    lineHeight: 21,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, fontWeight: "600" },
  bidDetailCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bidDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bidAmountBlock: {},
  bidAmountLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  bidAmountValue: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  bidStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bidStatusText: { fontSize: 13, fontWeight: "700" },
  bidDivider: { height: 1, marginBottom: 12 },
  bidMeta: { gap: 8, marginBottom: 14 },
  bidMetaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  bidMetaText: { fontSize: 14 },
  bidNoteBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  bidNoteLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  bidNoteText: { fontSize: 14, lineHeight: 21 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rejectBtnText: { fontSize: 15, fontWeight: "600" },
  acceptBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  acceptBtnText: { fontSize: 15, fontWeight: "700" },
  paymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 0,
  },
  paymentBtnText: { fontSize: 15, fontWeight: "700" },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  contactBtnText: { fontSize: 15, fontWeight: "700" },
});

export default ManufacturerModal;
