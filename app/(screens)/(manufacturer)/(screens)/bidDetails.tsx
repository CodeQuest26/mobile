import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
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

import { getJobById } from "@/constants/manufacturerData";

const { width, height } = Dimensions.get("window");

export default function BidDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;
  const isDark = colorScheme === "dark";

  const [job] = useState(() => getJobById(id));
  const [bidAmount, setBidAmount] = useState("");
  const [note, setNote] = useState("");
  const [bidSubmitted, setBidSubmitted] = useState(false);

  // Lightbox Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!job) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <Text style={{ color: theme.text }}>Job not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: theme.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </MainContainer>
    );
  }

  const jobImages = job.images || [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1563784462386-044fd95e9852?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=400",
  ];

  const handleSubmitBid = () => {
    if (!bidAmount.trim()) {
      Alert.alert("Missing amount", "Please enter your bid amount.");
      return;
    }
    const parsed = parseFloat(bidAmount.replace(/,/g, ""));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid bid amount.");
      return;
    }
    setBidSubmitted(true);
  };

  return (
    <MainContainer>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Clean Minimal Inline Header */}
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
        {/* Job overview card */}
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
                {job.category}
              </Text>
            </View>

            <Text style={[styles.productTitle, { color: theme.text }]}>
              {job.product}
            </Text>

            <Text style={[styles.smeLabel, { color: theme.textSecondary }]}>
              Posted by{" "}
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                {job.sme}
              </Text>
            </Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text
                  style={[styles.infoLabel, { color: theme.textSecondary }]}
                >
                  Quantity
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {job.quantity}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text
                  style={[styles.infoLabel, { color: theme.textSecondary }]}
                >
                  Budget
                </Text>
                <Text style={[styles.infoValue, { color: theme.primary }]}>
                  {job.budget}
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
                {job.location}
              </Text>
              <Text style={[styles.postedAt, { color: theme.textSecondary }]}>
                · Posted {job.postedAt}
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Reference Gallery Row */}
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

        {/* Description */}
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
              Description
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              {job.description}
            </Text>
          </View>
        </FadeIn>

        {/* Requirements */}
        <FadeIn delay={140}>
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
              Requirements
            </Text>
            {job.requirements.map((req, idx) => (
              <View key={idx} style={styles.reqRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={theme.primary}
                  style={{ marginTop: 1 }}
                />
                <Text style={[styles.reqText, { color: theme.textSecondary }]}>
                  {req}
                </Text>
              </View>
            ))}
          </View>
        </FadeIn>

        {/* Bid form */}
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
                  . {job.sme} will be notified and may contact you shortly.
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
                    style={[styles.input, { color: theme.text }]}
                    placeholder="e.g. 48,000"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={bidAmount}
                    onChangeText={setBidAmount}
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
                  style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSubmitBid}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.submitBtnText, { color: theme.onPrimary }]}
                  >
                    Submit Bid
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </FadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Image Lightbox Portal */}
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
            <Ionicons name="close" size={28} color="#fff" />
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
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 6,
  },
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
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locText: { fontSize: 12 },
  postedAt: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  galleryContainer: {
    gap: 10,
    marginLeft: 16,
    paddingRight: 16,
  },
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

  successBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  successTitle: { fontSize: 16, fontWeight: "700" },
  successSub: { fontSize: 14, textAlign: "center", lineHeight: 21 },

  // Lightbox Specific Layout Styles
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
  lightboxImage: {
    width: width,
    height: height * 0.75,
  },
});
