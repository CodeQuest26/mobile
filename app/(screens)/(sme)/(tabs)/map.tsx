import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
// INCREASED IMAGE HEIGHT FROM 200 TO 240
const HERO_HEIGHT = 240;

/* ================= TYPES ================= */

interface Company {
  id: string;
  name: string;
  category: string;
  coordinate: { latitude: number; longitude: number };
  rating: number;
  verified: boolean;
  address: string;
  distance: number;
  photo: string | null;
  phone: string;
  description: string;
  verificationStatus: string;
  website: string;
  isOpen: boolean;
  hours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
}

interface FactoryApiResponse {
  id: string;
  companyName?: string | null;
  name?: string | null;
  description?: string | null;
  sectorTags?: string[] | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  coordinates?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
  verificationStatus?: string | null;
  isVerified?: boolean | null;
  rating?: number | null;
  averageRating?: number | null;
  profileImageUrl?: string | null;
  logoUrl?: string | null;
  ownerPhoneNumber?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  isOpen?: boolean | null;
  active?: boolean | null;
  isActive?: boolean | null;
  hours?: Company["hours"] | null;
}

type UserLocation = {
  latitude: number;
  longitude: number;
};

/* ================= BACKEND DATA ================= */

const toFiniteNumber = (value: number | string | null | undefined) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const distanceInMeters = (
  from: UserLocation,
  to: { latitude: number; longitude: number },
) => {
  const earthRadius = 6_371_000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeFactory = (
  factory: FactoryApiResponse,
  userLocation: UserLocation,
): Company | null => {
  const latitude = toFiniteNumber(
    factory.latitude ?? factory.coordinates?.latitude,
  );
  const longitude = toFiniteNumber(
    factory.longitude ?? factory.coordinates?.longitude,
  );

  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  const name = factory.companyName || factory.name || "Manufacturer";
  const rating = factory.averageRating ?? factory.rating ?? 0;

  return {
    id: factory.id,
    name,
    category: factory.sectorTags?.join(" • ") || "Manufacturer",
    coordinate: { latitude, longitude },
    rating: typeof rating === "number" && Number.isFinite(rating) ? rating : 0,
    verified:
      factory.isVerified === true || factory.verificationStatus === "VERIFIED",
    address: factory.address || "Address not provided",
    distance: distanceInMeters(userLocation, { latitude, longitude }),
    photo: factory.profileImageUrl || factory.logoUrl || null,
    phone: factory.ownerPhoneNumber || factory.phoneNumber || "Not provided",
    description: factory.description || "No description provided.",
    verificationStatus:
      factory.verificationStatus ||
      (factory.isVerified === true ? "VERIFIED" : "UNVERIFIED"),
    website: factory.website || "Not provided",
    isOpen: factory.isOpen ?? false,
    hours: factory.hours || {
      weekday: "Not provided",
      saturday: "Not provided",
      sunday: "Not provided",
    },
  };
};

/* ================= COMPONENT ================= */

const Map = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const blurTint = colorScheme === "dark" ? "dark" : "light";

  const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 + insets.bottom : 56;

  const mapRef = useRef<any>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  // Animation driving value tracking sheet scroll position
  const scrollY = useRef(new Animated.Value(0)).current;

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [factoryError, setFactoryError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (company: Company) => {
    scrollY.setValue(0); // Reset animation scroll offsets
    setSelectedCompany(company);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedCompany(null), 300);
  };

  const fetchCompanies = async (lat: number, lon: number) => {
    setFetching(true);
    setFactoryError(null);
    try {
      const response = await api.get("/factories", {
        params: { page: 0, size: 1000 },
      });
      const payload = response.data;
      const factories: FactoryApiResponse[] = Array.isArray(payload)
        ? payload
        : payload?.content || payload?.factories || [];
      const location = { latitude: lat, longitude: lon };
      const normalizedCompanies = factories
        .filter(
          (factory) =>
            (factory.verificationStatus || "").toUpperCase() === "VERIFIED" ||
            factory.isVerified === true,
        )
        .filter(
          (factory) =>
            factory.active !== false && factory.isActive !== false,
        )
        .map((factory) => normalizeFactory(factory, location))
        .filter((factory): factory is Company => factory !== null);

      setCompanies(normalizedCompanies);
    } catch (error) {
      setCompanies([]);
      setFactoryError(handleApiError(error));
    } finally {
      setFetching(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  const markers = useMemo(
    () =>
      filteredCompanies.map((c) => ({
        id: c.id,
        coordinates: c.coordinate,
        title: c.name,
      })),
    [filteredCompanies],
  );

  const getLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is needed to show nearby companies. Falling back to Kumasi.",
        );
        const fallback: UserLocation = {
          latitude: 6.6885,
          longitude: -1.6244,
        };
        setUserLocation(fallback);
        await fetchCompanies(fallback.latitude, fallback.longitude);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const region: UserLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLocation(region);
      await fetchCompanies(region.latitude, region.longitude);
    } catch {
      Alert.alert("Error", "Failed to get your location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const centerUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setCameraPosition({
        coordinates: userLocation,
        zoom: 15,
      });
    }
  };

  const retryFactories = () => {
    if (userLocation) {
      void fetchCompanies(userLocation.latitude, userLocation.longitude);
    }
  };

  const toggleSearch = () => {
    setSearchVisible((v) => {
      const next = !v;
      if (next) setTimeout(() => searchInputRef.current?.focus(), 250);
      else setQuery("");
      return next;
    });
  };

  const handleMarkerClick = (marker: { id?: string }) => {
    const company = filteredCompanies.find((c) => c.id === marker.id);
    if (company) openModal(company);
  };

  /* ================= PARALLAX & HEADER INTERPOLATIONS ================= */

  // Scales up image elastically when pulled down
  const imageScale = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolate: "clamp",
  });

  // Moves image upwards at a slower velocity rate to create standard depth parallax
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT / 2, 0, -HERO_HEIGHT * 0.3],
    extrapolate: "clamp",
  });

  // Controls the appearance of the top sticky navigation header
  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 60, HERO_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  /* ================= LOADING STACKS ================= */

  if (loading || !userLocation) {
    return (
      <MainContainer safe>
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Getting your location…
          </Text>
        </View>
      </MainContainer>
    );
  }

  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return (
      <MainContainer>
        <View style={[styles.loading, { padding: 16 }]}>
          <Text
            style={[
              styles.loadingText,
              { color: theme.text, textAlign: "center" },
            ]}
          >
            Maps are only available on Android and iOS.
          </Text>
        </View>
      </MainContainer>
    );
  }

  /* ================= RENDER INTERFACE ================= */

  return (
    <MainContainer>
      <View style={styles.container}>
        {/* ── SEARCH BAR ── */}
        {searchVisible && (
          <View
            style={[
              styles.searchBar,
              {
                top: insets.top + 12,
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={theme.textSecondary}
            />
            <TextInput
              ref={searchInputRef}
              placeholder="Search manufacturers…"
              placeholderTextColor={theme.textSecondary}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── MAP CANVAS LAYER ── */}
        {Platform.OS === "ios" ? (
          <AppleMaps.View
            ref={mapRef}
            style={styles.map}
            cameraPosition={{ coordinates: userLocation, zoom: 14 }}
            markers={markers.map((m) => ({
              ...m,
              tintColor:
                (filteredCompanies.find((c) => c.id === m.id)?.rating ?? 0) >
                4.7
                  ? theme.primary
                  : theme.icon,
            }))}
            properties={{ isMyLocationEnabled: true }}
            uiSettings={{ myLocationButtonEnabled: false }}
            onMarkerClick={handleMarkerClick}
          />
        ) : (
          <GoogleMaps.View
            ref={mapRef}
            style={styles.map}
            cameraPosition={{ coordinates: userLocation, zoom: 14 }}
            markers={markers}
            properties={{ isMyLocationEnabled: true }}
            uiSettings={{
              myLocationButtonEnabled: false,
              compassEnabled: false,
            }}
            onMarkerClick={handleMarkerClick}
          />
        )}

        {/* ── SYNC/FETCHING PILL ── */}
        {fetching && (
          <View style={styles.fetchingPill}>
            <ActivityIndicator color={theme.onPrimary} size="small" />
            <Text style={[styles.fetchingText, { color: theme.onPrimary }]}>
              Updating…
            </Text>
          </View>
        )}

        {!fetching && factoryError && (
          <View
            style={[
              styles.mapStateCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="cloud-offline-outline" size={28} color={theme.error} />
            <Text style={[styles.mapStateTitle, { color: theme.text }]}>Unable to load factories</Text>
            <Text style={[styles.mapStateMessage, { color: theme.textSecondary }]}>
              {factoryError}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={retryFactories}
            >
              <Text style={{ color: theme.onPrimary, fontWeight: "600" }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!fetching && !factoryError && companies.length === 0 && (
          <View
            style={[
              styles.mapStateCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="business-outline" size={28} color={theme.primary} />
            <Text style={[styles.mapStateTitle, { color: theme.text }]}>No verified factories available</Text>
            <Text style={[styles.mapStateMessage, { color: theme.textSecondary }]}>
              Verified factories with valid map coordinates will appear here.
            </Text>
          </View>
        )}

        {/* ── SEARCH RESULT QUANTITY COUNT ── */}
        {!fetching && searchVisible && (
          <View
            style={[
              styles.resultPill,
              {
                top: insets.top + 64,
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[styles.resultPillText, { color: theme.textSecondary }]}
            >
              {filteredCompanies.length} manufacturer
              {filteredCompanies.length !== 1 ? "s" : ""} found
            </Text>
          </View>
        )}

        {/* ── FLOATING CONTROLS (FAB) ── */}
        <View style={[styles.fabStack, { bottom: TAB_BAR_HEIGHT + 16 }]}>
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: searchVisible
                  ? theme.primary
                  : theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={toggleSearch}
            activeOpacity={0.85}
          >
            <Ionicons
              name={searchVisible ? "close" : "search"}
              size={20}
              color={searchVisible ? theme.onPrimary : theme.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={centerUser}
            activeOpacity={0.85}
          >
            <Ionicons name="locate" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* ── APPLE MAPS STYLE SHEET MODAL ── */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeModal}
          statusBarTranslucent
        >
          <Pressable style={styles.backdrop} onPress={closeModal}>
            <Pressable
              style={[styles.sheet, { backgroundColor: theme.cardBackground }]}
              onPress={() => {}}
            >
              {selectedCompany && (
                <View style={styles.sheetLayoutWrapper}>
                  {/* 1. ABSOLUTE PARALLAX BACKGROUND HERO LAYER */}
                  <Animated.View
                    style={[
                      styles.heroContainer,
                      {
                        transform: [
                          { translateY: imageTranslateY },
                          { scale: imageScale },
                        ],
                      },
                    ]}
                  >
                    {selectedCompany.photo ? (
                      <Image
                        source={{ uri: selectedCompany.photo }}
                        style={styles.heroImage}
                      />
                    ) : (
                      <View style={styles.heroImagePlaceholder}>
                        <Ionicons
                          name="business-outline"
                          size={42}
                          color={theme.primary}
                        />
                      </View>
                    )}

                    {/* Graduated blur band — replaces the single flat BlurView */}
                    <View
                      style={[styles.blurFadeContainer, { height: 100 }]}
                      pointerEvents="none"
                    >
                      <BlurView
                        intensity={20}
                        tint={blurTint}
                        style={[styles.blurBand, { top: 0, height: 100 }]}
                      />
                      <BlurView
                        intensity={40}
                        tint={blurTint}
                        style={[styles.blurBand, { top: 25, height: 75 }]}
                      />
                      <BlurView
                        intensity={65}
                        tint={blurTint}
                        style={[styles.blurBand, { top: 50, height: 50 }]}
                      />
                      <BlurView
                        intensity={90}
                        tint={blurTint}
                        style={[styles.blurBand, { top: 72, height: 28 }]}
                      />

                      <LinearGradient
                        colors={[
                          "rgba(255,255,255,0)",
                          "rgba(255,255,255,0.04)",
                          "rgba(255,255,255,0.12)",
                          "rgba(255,255,255,0.3)",
                          "rgba(255,255,255,0.6)",
                          "rgba(255,255,255,0.85)",
                          "rgba(255,255,255,1)",
                        ]}
                        locations={[0, 0.15, 0.32, 0.5, 0.68, 0.85, 1]}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                    </View>
                  </Animated.View>

                  {/* 2. DYNAMIC STICKY HEADER FADING OVER SCROLL ELEMENT */}
                  <Animated.View
                    style={[
                      styles.stickyHeader,
                      {
                        opacity: stickyHeaderOpacity,
                        backgroundColor:
                          colorScheme === "dark"
                            ? "rgba(30,30,30,0.6)"
                            : "rgba(255,255,255,0.6)",
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <BlurView
                      intensity={80}
                      tint={blurTint}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text
                      numberOfLines={1}
                      style={[styles.stickyHeaderTitle, { color: theme.text }]}
                    >
                      {selectedCompany.name}
                    </Text>
                  </Animated.View>

                  {/* 3. STATIC CLOSE ACTION PILL OVERLAP */}
                  <TouchableOpacity
                    style={styles.heroCloseButton}
                    onPress={closeModal}
                    activeOpacity={0.7}
                    hitSlop={12}
                  >
                    <BlurView
                      intensity={90}
                      tint="dark"
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="close" size={18} color={theme.onPrimary} />
                  </TouchableOpacity>

                  {/* 4. MAIN INTERACTION VIEW SCRIPTER WITH PARALLAX EVENT */}
                  <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                      { useNativeDriver: true },
                    )}
                    contentContainerStyle={styles.scrollContent}
                  >
                    {/* Visual block spacer preserving space for background absolute layout frame */}
                    <View style={{ height: HERO_HEIGHT - 35 }} />

                    {/* Overlapping Rounded Company Avatar Badge */}
                    <View style={styles.avatarBadgeContainer}>
                      <BlurView
                        intensity={60}
                        tint="light"
                        style={styles.avatarBadgeBlur}
                      />
                      <View style={styles.avatarIconContainer}>
                        <Ionicons name="business" size={32} color="#4CAF50" />
                      </View>
                    </View>

                    {/* Descriptive Identity Blocks */}
                    <View style={styles.identitySection}>
                      <Text
                        style={[styles.companyTitle, { color: theme.text }]}
                      >
                        {selectedCompany.name}
                      </Text>
                      <Text
                        style={[
                          styles.companySubtitle,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {selectedCompany.category}
                      </Text>
                      <Text
                        style={[styles.distanceText, { color: theme.textSecondary }]}
                      >
                        ★ {selectedCompany.rating > 0 ? selectedCompany.rating.toFixed(1) : "No ratings"} · {selectedCompany.distance < 1000
                          ? `${Math.round(selectedCompany.distance)} m away`
                          : `${(selectedCompany.distance / 1000).toFixed(1)} km away`}
                      </Text>
                    </View>

                    <View style={styles.contentSection}>
                      <Text style={[styles.sectionHeading, { color: theme.text }]}>About</Text>
                      <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                        {selectedCompany.description}
                      </Text>
                    </View>

                    {/* ── HOURS RENDER STACK ── */}
                    <View style={styles.contentSection}>
                      <Text
                        style={[styles.sectionHeading, { color: theme.text }]}
                      >
                        Hours
                      </Text>

                      <View style={styles.dataGridRow}>
                        <Text
                          style={[
                            styles.statusOpenLabel,
                            {
                              color: selectedCompany.isOpen
                                ? theme.primary
                                : theme.error,
                            },
                          ]}
                        >
                          {selectedCompany.isOpen ? "Open" : "Closed"}
                        </Text>
                        <Text
                          style={[styles.rightValueText, { color: theme.text }]}
                        >
                          {selectedCompany.hours.weekday}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.sectionDivider,
                          { backgroundColor: theme.border },
                        ]}
                      />

                      <View style={styles.dataGridRow}>
                        <Text
                          style={[styles.mutedLabelText, { color: theme.textSecondary }]}
                        >
                          Verification
                        </Text>
                        <Text style={[styles.rightValueText, { color: theme.primary }]}>
                          {selectedCompany.verificationStatus}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.sectionDivider,
                          { backgroundColor: theme.border },
                        ]}
                      />

                      <View style={styles.dropdownHeaderRow}>
                        <Text
                          style={[
                            styles.mutedLabelText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Normal Hours
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={14}
                          color={theme.textSecondary}
                        />
                      </View>

                      <View style={styles.subTimeRow}>
                        <Text style={[styles.dayText, { color: theme.text }]}>
                          Mon – Wed
                        </Text>
                        <Text
                          style={[styles.rightValueText, { color: theme.text }]}
                        >
                          {selectedCompany.hours.weekday}
                        </Text>
                      </View>
                      <View style={styles.subTimeRow}>
                        <Text style={[styles.dayText, { color: theme.text }]}>
                          Thu – Sat
                        </Text>
                        <Text
                          style={[styles.rightValueText, { color: theme.text }]}
                        >
                          {selectedCompany.hours.saturday}
                        </Text>
                      </View>
                      <View style={styles.subTimeRow}>
                        <Text style={[styles.dayText, { color: theme.text }]}>
                          Sunday
                        </Text>
                        <Text
                          style={[styles.rightValueText, { color: theme.text }]}
                        >
                          {selectedCompany.hours.sunday}
                        </Text>
                      </View>
                    </View>

                    {/* ── DETAILS RENDER STACK ── */}
                    <View style={styles.contentSection}>
                      <Text
                        style={[styles.sectionHeading, { color: theme.text }]}
                      >
                        Details
                      </Text>

                      <View style={styles.dataGridRow}>
                        <Text
                          style={[
                            styles.mutedLabelText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Phone
                        </Text>
                        <TouchableOpacity>
                          <Text style={styles.interactiveLinkText}>
                            {selectedCompany.phone}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.sectionDivider,
                          { backgroundColor: theme.border },
                        ]}
                      />

                      <View style={styles.dataGridRow}>
                        <Text
                          style={[
                            styles.mutedLabelText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Website
                        </Text>
                        <TouchableOpacity>
                          <Text style={[styles.interactiveLinkText]}>
                            {selectedCompany.website}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.sectionDivider,
                          { backgroundColor: theme.border },
                        ]}
                      />

                      <View
                        style={[
                          styles.dataGridRow,
                          { alignItems: "flex-start" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.mutedLabelText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Address
                        </Text>
                        <Text
                          style={[
                            styles.rightValueText,
                            { color: theme.text, textAlign: "right", flex: 1 },
                          ]}
                        >
                          {selectedCompany.address}
                        </Text>
                      </View>
                    </View>
                  </Animated.ScrollView>

                  {/* Pinned Soft-Capsule Navigation CTA Row */}
                  <View
                    style={[
                      styles.ctaFixedContainer,
                      { backgroundColor: theme.cardBackground },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.capsuleCtaButton,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#2c2c2e" : "#eaf2ff",
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        closeModal();
                        setTimeout(() => {
                          router.push(
                            "/(screens)/(sme)/(screens)/manufacturerProfile",
                          );
                        }, 200);
                      }}
                    >
                      <View style={styles.ctaIconBadgeCircle}>
                        <Ionicons
                          name="arrow-redo"
                          size={14}
                          color={theme.onPrimary}
                        />
                      </View>
                      <Text style={styles.capsuleCtaText}>Get Directions</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </MainContainer>
  );
};

export default Map;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 15 },
  mapStateCard: {
    position: "absolute",
    top: "42%",
    left: 24,
    right: 24,
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  mapStateTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  mapStateMessage: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  /* Search bar styling */
  searchBar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

  /* Result pills */
  resultPill: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  resultPillText: { fontSize: 12, fontWeight: "500" },

  /* Fetching updates marker */
  fetchingPill: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fetchingText: { fontSize: 13 },

  /* FAB layout */
  fabStack: {
    position: "absolute",
    right: 16,
    gap: 10,
    alignItems: "center",
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  /* Redesigned Bottom Sheet presentation layers */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    height: SCREEN_HEIGHT * 0.88,
  },
  sheetLayoutWrapper: {
    flex: 1,
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  /* Parallax Backdrop Frames */
  heroContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    zIndex: 0,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
  },
  blurFadeContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  blurBand: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  /* Sticky blurred top row elements */
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  stickyHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    maxWidth: "65%",
  },

  heroCloseButton: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Profile header card contents */
  avatarBadgeContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignSelf: "center",
    zIndex: 5,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
  },
  avatarBadgeBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarIconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  identitySection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  companyTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  companySubtitle: {
    fontSize: 14,
    marginTop: 2,
    color: "#8E8E93",
  },
  distanceText: {
    fontSize: 13,
    marginTop: 6,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },

  /* Apple details blocks presentation layouts */
  contentSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  dataGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  dropdownHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  subTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  statusOpenLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  dayText: {
    fontSize: 16,
  },
  mutedLabelText: {
    fontSize: 16,
    width: 90,
  },
  rightValueText: {
    fontSize: 16,
    fontWeight: "400",
  },
  interactiveLinkText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "400",
  },

  /* Bottom Fixed Action Elements */
  ctaFixedContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    zIndex: 15,
  },
  capsuleCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
    gap: 8,
  },
  ctaIconBadgeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  capsuleCtaText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
