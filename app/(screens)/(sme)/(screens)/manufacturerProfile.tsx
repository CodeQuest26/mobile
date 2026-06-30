import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

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

// Mock manufacturer data
const MOCK_MANUFACTURERS = [
  {
    id: "m1",
    name: "Accra Metal Works",
    location: "Accra, Ghana",
    rating: 4.8,
    completedJobs: 89,
    capacity: "High Volume (10K+ units/month)",
    specializations: ["Metal Packaging", "Beverage Cans", "Custom Printing"],
    description:
      "ISO 9001 certified manufacturer specializing in metal packaging solutions. We have over 10 years of experience in beverage packaging and custom branding. Our state-of-the-art facility includes advanced printing equipment and quality control systems.",
    certifications: ["ISO 9001", "HACCP", "Food Grade Certified"],
    photos: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400",
    ],
    contact: {
      phone: "+233 24 123 4567",
      email: "info@accrametalworks.com",
      website: "www.accrametalworks.com",
    },
    stats: {
      onTimeDelivery: "98%",
      qualityRating: "4.9",
      responseTime: "< 2 hours",
    },
  },
  {
    id: "m2",
    name: "Ghana Industrial Ltd",
    location: "Tema, Ghana",
    rating: 4.6,
    completedJobs: 156,
    capacity: "Medium-High Volume (5K-10K units/month)",
    specializations: [
      "Industrial Manufacturing",
      "CNC Machining",
      "Custom Fabrication",
    ],
    description:
      "Full-service manufacturing company with integrated design capabilities. We specialize in custom fabrication and CNC machining for various industries including packaging and industrial equipment.",
    certifications: ["ISO 14001", "OHSAS 18001"],
    photos: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    ],
    contact: {
      phone: "+233 20 987 6543",
      email: "contact@ghanaindustrial.com",
      website: "www.ghanaindustrial.com",
    },
    stats: {
      onTimeDelivery: "95%",
      qualityRating: "4.7",
      responseTime: "< 4 hours",
    },
  },
  {
    id: "m3",
    name: "Tema Manufacturing Co.",
    location: "Tema, Ghana",
    rating: 4.4,
    completedJobs: 67,
    capacity: "Medium Volume (2K-5K units/month)",
    specializations: [
      "Metal Packaging",
      "Quality Control",
      "Competitive Pricing",
    ],
    description:
      "Specialized manufacturer focusing on metal packaging solutions with extensive quality control processes. We offer competitive pricing with guaranteed delivery times.",
    certifications: ["ISO 9001"],
    photos: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400",
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400",
    ],
    contact: {
      phone: "+233 27 555 7890",
      email: "sales@temamanufacturing.com",
      website: "www.temamanufacturing.com",
    },
    stats: {
      onTimeDelivery: "92%",
      qualityRating: "4.5",
      responseTime: "< 6 hours",
    },
  },
];

interface CertificationBadgeProps {
  certification: string;
  theme: any;
}

const CertificationBadge = ({
  certification,
  theme,
}: CertificationBadgeProps) => {
  return (
    <View
      style={[
        styles.certificationBadge,
        { backgroundColor: theme.primary + "20", borderColor: theme.primary },
      ]}
    >
      <Ionicons name="shield-checkmark" size={14} color={theme.primary} />
      <Text style={[styles.certificationText, { color: theme.primary }]}>
        {certification}
      </Text>
    </View>
  );
};

const ManufacturerProfile = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  // Mock manufacturer data - in real app, fetch by ID
  const manufacturer =
    MOCK_MANUFACTURERS.find((m) => m.id === id) || MOCK_MANUFACTURERS[0];

  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const renderPhoto = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      onPress={() => setSelectedPhoto(index)}
      style={styles.photoContainer}
    >
      <Image source={{ uri: item }} style={styles.photo} />
    </TouchableOpacity>
  );

  return (
    <MainContainer safe>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Factory Profile
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Section */}
        <FadeIn delay={50}>
          <View style={styles.heroSection}>
            <View style={styles.heroContent}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {manufacturer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </Text>
              </View>
              <View style={styles.heroText}>
                <Text style={[styles.manufacturerName, { color: theme.text }]}>
                  {manufacturer.name}
                </Text>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {manufacturer.location}
                  </Text>
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text style={[styles.ratingText, { color: theme.text }]}>
                    {manufacturer.rating} ({manufacturer.completedJobs} jobs
                    completed)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* About Section */}
        <FadeIn delay={150}>
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              About
            </Text>
            <Text style={[styles.description, { color: theme.text }]}>
              {manufacturer.description}
            </Text>

            <View style={styles.capacityRow}>
              <Ionicons
                name="business-outline"
                size={16}
                color={theme.primary}
              />
              <Text style={[styles.capacityText, { color: theme.primary }]}>
                {manufacturer.capacity}
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Specializations */}
        <FadeIn delay={200}>
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Specializations
            </Text>
            <View style={styles.specializationsContainer}>
              {manufacturer.specializations.map((spec, index) => (
                <View
                  key={index}
                  style={[
                    styles.specializationChip,
                    { backgroundColor: theme.primary + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.specializationText,
                      { color: theme.primary },
                    ]}
                  >
                    {spec}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* Certifications */}
        {/* <FadeIn delay={250}>
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Certifications
            </Text>
            <View style={styles.certificationsContainer}>
              {manufacturer.certifications.map((cert, index) => (
                <CertificationBadge
                  key={index}
                  certification={cert}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        </FadeIn> */}

        {/* Photos */}
        {manufacturer.photos.length > 0 && (
          <FadeIn delay={300}>
            <View
              style={[
                // styles.section,

                {
                  paddingVertical: 15,
                  marginBottom: 15,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, marginLeft: 30 },
                ]}
              >
                Facility Photos
              </Text>
              <FlatList
                data={manufacturer.photos}
                renderItem={renderPhoto}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosList}
              />
            </View>
          </FadeIn>
        )}

        {/* Contact Information */}
        <FadeIn delay={350}>
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Contact Information
            </Text>

            <View style={styles.contactContainer}>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="call-outline" size={20} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.text }]}>
                  {manufacturer.contact.phone}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.text }]}>
                  {manufacturer.contact.email}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactRow}>
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={theme.primary}
                />

                <Text style={[styles.contactText, { color: theme.text }]}>
                  {manufacturer.contact.website}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>
      </ScrollView>
    </MainContainer>
  );
};

export default ManufacturerProfile;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 15,
    marginBottom: 24,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
  },
  heroText: {
    flex: 1,
  },
  manufacturerName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Sections
  section: {
    marginHorizontal: 15,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  capacityText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Specializations
  specializationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specializationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Certifications
  certificationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  certificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  certificationText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Photos
  photosList: {
    paddingRight: 16,
    marginLeft: 15,
  },
  photoContainer: {
    marginRight: 12,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },

  // Contact
  contactContainer: {
    gap: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
