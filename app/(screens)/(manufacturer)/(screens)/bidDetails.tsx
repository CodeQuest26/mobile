import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Matches JobDetailResponse from the OpenAPI spec
interface JobDetail {
  id: string;
  smeId: string;
  smeName: string;
  title: string;
  productType: string;
  sectorTag: string;
  quantity: number;
  specifications?: string;
  budgetMinGhs: number;
  budgetMaxGhs: number;
  deadline: string;
  attachmentUrls?: string[];
  deliveryAddress?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const formatBudget = (min: number, max: number) => {
  if (!min && !max) return "GHS 0";
  const minStr = min ? `GHS ${min.toLocaleString()}` : "";
  const maxStr = max ? `GHS ${max.toLocaleString()}` : "";
  if (minStr && maxStr) return `${minStr} - ${maxStr}`;
  return minStr || maxStr;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

const defaultImages = [
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1563784462386-044fd95e9852?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=400",
];

export default function BidDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;
  const isDark = colorScheme === "dark";

  const { hasHydrated, token } = useAuthStore();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bidAmount, setBidAmount] = useState("");
  const [productionDays, setProductionDays] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || !id) {
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`jobs/${id}`);
        setJob(data);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError("Couldn't load this job. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [hasHydrated, token, id]);

  if (!hasHydrated || loading) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </MainContainer>
    );
  }

  if (error || !job) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <Text style={{ color: theme.text }}>{error || "Job not found."}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: theme.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </MainContainer>
    );
  }

  // API only gives us attachmentUrls, not a dedicated "images" field —
  // fall back to placeholder images when none were attached to the job.
  const jobImages =
    job.attachmentUrls && job.attachmentUrls.length > 0
      ? job.attachmentUrls
      : defaultImages;

  const handleSubmitBid = async () => {
    if (!bidAmount.trim()) {
      Alert.alert("Missing amount", "Please enter your bid amount.");
      return;
    }
    const totalPrice = parseFloat(bidAmount.replace(/,/g, ""));
    if (isNaN(totalPrice) || totalPrice <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid bid amount.");
      return;
    }

    const days = parseInt(productionDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert(
        "Missing production time",
        "Please enter how many days production will take.",
      );
      return;
    }

    const pricePerUnit =
      job.quantity > 0 ? totalPrice / job.quantity : totalPrice;

    if (pricePerUnit < 0.01) {
      Alert.alert(
        "Bid too low",
        "Your bid amount is too small for this quantity. Please increase it.",
      );
      return;
    }

    const deliveryDateEstimate = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0];

    try {
      setSubmitting(true);
      await api.post(`jobs/${job.id}/bids`, {
        jobId: job.id,
        pricePerUnitGhs: Number(pricePerUnit.toFixed(2)),
        totalPriceGhs: totalPrice,
        productionDays: days,
        deliveryDateEstimate,
        message: note.trim() || undefined,
      });
      setBidSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorCode = (err.response?.data as any)?.error;

        if (
          err.response?.status === 412 &&
          errorCode === "FACTORY_PROFILE_MISSING"
        ) {
          Alert.alert(
            "Complete your factory profile first",
            "You need to set up your factory profile before you can submit bids.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Set up now",
                onPress: () =>
                  router.push(
                    "/(screens)/(manufacturer)/(screens)/editProfile",
                  ),
              },
            ],
          );
          return;
        }

        console.error("Bid submission failed:", {
          status: err.response?.status,
          data: err.response?.data,
        });
      } else {
        console.error("Error submitting bid:", err);
      }
      Alert.alert("Couldn't submit bid", handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainContainer>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Job Details
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn delay={0}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                marginHorizontal: 16,
              },
            ]}
          >
            <View
              style={[styles.catTag, { backgroundColor: theme.primary + "15" }]}
            >
              <Text style={[styles.catText, { color: theme.primary }]}>
                {job.sectorTag}
              </Text>
            </View>

            <Text style={[styles.productTitle, { color: theme.text }]}>
              {job.title || job.productType}
            </Text>

            <Text style={[styles.smeLabel, { color: theme.textSecondary }]}>
              Posted by{" "}
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                {job.smeName}
              </Text>
            </Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoItem]}>
                <Text
                  style={[styles.infoLabel, { color: theme.textSecondary }]}
                >
                  Quantity
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {job.quantity.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.infoItem, { alignItems: "flex-start" }]}>
                <Text
                  style={[styles.infoLabel, { color: theme.textSecondary }]}
                >
                  Budget
                </Text>

                <Text style={[styles.infoValue, { color: theme.primary }]}>
                  {formatBudget(job.budgetMinGhs, job.budgetMaxGhs)}
                </Text>
              </View>
            </View>

            <View style={styles.locRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color={theme.textSecondary}
              />
              <Text style={[styles.locText, { color: theme.textSecondary }]}>
                {job.deliveryAddress || "Location not specified"}
              </Text>
              <Text style={[styles.postedAt, { color: theme.textSecondary }]}>
                · Posted {timeAgo(job.createdAt)}
              </Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={60}>
          <View style={[styles.card, { padding: 0 }]}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginLeft: 35 },
              ]}
            >
              Reference Gallery
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContainer}
            >
              {jobImages.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => setSelectedImage(img)}
                >
                  <Image source={{ uri: img }} style={styles.galleryImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </FadeIn>

        {job.specifications && (
          <FadeIn delay={100}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  marginHorizontal: 16,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Specifications
              </Text>
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                {job.specifications}
              </Text>
            </View>
          </FadeIn>
        )}

        <FadeIn delay={180}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                marginHorizontal: 16,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {bidSubmitted ? "Bid Submitted ✓" : "Place Your Bid"}
            </Text>

            {bidSubmitted ? (
              <View style={styles.successBox}>
                <Ionicons
                  name="checkmark-circle"
                  size={40}
                  color={theme.primary}
                />
                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Bid placed successfully!
                </Text>
                <Text
                  style={[styles.successSub, { color: theme.textSecondary }]}
                >
                  You bid{" "}
                  <Text style={{ color: theme.primary, fontWeight: "700" }}>
                    GH₵{" "}
                    {parseFloat(bidAmount.replace(/,/g, "")).toLocaleString()}
                  </Text>
                  . {job.smeName} will be notified and may contact you shortly.
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Your bid amount (GH₵)
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                >
                  <Text style={[styles.currencyPrefix, { color: theme.text }]}>
                    GH₵
                  </Text>
                  <TextInput
                    value={bidAmount}
                    onChangeText={(text) => {
                      // Allow only numbers with one decimal point
                      const filtered = text.replace(/[^0-9.]/g, "");

                      // Prevent multiple decimals
                      const valid = filtered.replace(/(\..*)\./g, "$1");

                      setBidAmount(valid);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="Enter bid amount"
                    style={{
                      color: theme.text,
                    }}
                  />
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.textSecondary, marginTop: 12 },
                  ]}
                >
                  Production time (days)
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                >
                  <TextInput
                    value={productionDays}
                    onChangeText={(text) => {
                      // Allow only integers
                      const filtered = text.replace(/[^0-9]/g, "");

                      setProductionDays(filtered);
                    }}
                    keyboardType="number-pad"
                    placeholder="Enter number of days"
                    style={{
                      color: theme.text,
                    }}
                  />
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.textSecondary, marginTop: 12 },
                  ]}
                >
                  Note to SME{" "}
                  <Text style={{ fontStyle: "italic" }}>(optional)</Text>
                </Text>

                <TextInput
                  style={[
                    styles.noteInput,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                  placeholder="Briefly describe your capacity or turnaround time…"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={note}
                  onChangeText={setNote}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: submitting ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleSubmitBid}
                  activeOpacity={0.85}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={theme.onPrimary} />
                  ) : (
                    <Text
                      style={[styles.submitBtnText, { color: theme.onPrimary }]}
                    >
                      Submit Bid
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </FadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.lightboxOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <StatusBar barStyle="light-content" />
          <TouchableOpacity
            style={styles.closeLightboxBtn}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color={theme.onPrimary} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: { paddingTop: 8, paddingBottom: 20 },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  card: { borderRadius: 20, padding: 16, marginBottom: 16, gap: 6 },
  catTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catText: { fontSize: 10.5, fontWeight: "700" },
  productTitle: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
  smeLabel: { fontSize: 13 },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 8 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoItem: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 11, fontWeight: "600" },
  infoValue: { fontSize: 13, fontWeight: "700" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locText: { fontSize: 12 },
  postedAt: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  galleryContainer: { gap: 10, marginLeft: 16, paddingRight: 16 },
  galleryImage: {
    width: width * 0.4,
    height: 95,
    borderRadius: 12,
    resizeMode: "cover",
  },
  bodyText: { fontSize: 14, lineHeight: 21 },
  reqRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  reqText: { fontSize: 14, flex: 1, lineHeight: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 6,
  },
  currencyPrefix: { fontSize: 15, fontWeight: "700" },
  input: { flex: 1, fontSize: 15 },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  submitBtn: {
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnText: { fontSize: 15, fontWeight: "700" },
  successBox: { alignItems: "center", paddingVertical: 16, gap: 10 },
  successTitle: { fontSize: 16, fontWeight: "700" },
  successSub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeLightboxBtn: {
    position: "absolute",
    top: 54,
    right: 24,
    zIndex: 20,
    padding: 8,
  },
  lightboxImage: { width: width, height: height * 0.75 },
});
