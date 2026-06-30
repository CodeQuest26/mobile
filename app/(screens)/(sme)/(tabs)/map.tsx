import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

/* ================= TYPES ================= */

interface Company {
  id: string;
  name: string;
  coordinate: { latitude: number; longitude: number };
  rating: number;
  verified: boolean;
  address: string;
  distance: number;
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/* ================= MOCK DATA ================= */

const generateMockCompanies = (
  centerLat: number,
  centerLon: number,
  radiusKm = 5,
  count = 15,
): Company[] => {
  const names = [
    "Precision Machining Co.",
    "SteelCraft Industries",
    "EcoPack Solutions",
    "Apex Metalworks",
    "NanoFab Technologies",
    "Green Energy Components",
    "Northside Casting",
    "Westend Assembly",
    "East Bay Electronics",
    "Sunrise Robotics",
  ];

  const companies: Company[] = [];
  for (let i = 0; i < count; i++) {
    const offsetLat = (Math.random() - 0.5) * (radiusKm / 111);
    const offsetLon =
      (Math.random() - 0.5) *
      (radiusKm / (111 * Math.cos(centerLat * (Math.PI / 180))));
    const lat = centerLat + offsetLat;
    const lon = centerLon + offsetLon;
    const rating = +(4 + Math.random()).toFixed(1);
    const verified = Math.random() > 0.2;
    const distance = Math.sqrt(offsetLat ** 2 + offsetLon ** 2) * 111 * 1000;
    companies.push({
      id: `c_${i}`,
      name: names[i % names.length],
      coordinate: { latitude: lat, longitude: lon },
      rating,
      verified,
      address: `${Math.floor(Math.random() * 1000)} Industrial Blvd`,
      distance,
    });
  }
  return companies.filter((c) => c.rating >= 4.5 && c.verified);
};

/* ================= COMPONENT ================= */

const Map = () => {
  const theme = Colors[useColorScheme() ?? "light"];
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 + insets.bottom : 56;

  const mapRef = useRef<any>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  const [MapsModule, setMapsModule] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (company: Company) => {
    setSelectedCompany(company);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedCompany(null), 300);
  };

  const fetchCompanies = async (lat: number, lon: number) => {
    setFetching(true);
    await new Promise((r) => setTimeout(r, 600));
    setCompanies(generateMockCompanies(lat, lon, 8, 20));
    setFetching(false);
  };

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  const getLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is needed to show nearby companies. Falling back to Kumasi.",
        );
        const fallback: Region = {
          latitude: 6.6885,
          longitude: -1.6244,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation(fallback);
        await fetchCompanies(fallback.latitude, fallback.longitude);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const region: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
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

  useEffect(() => {
    let mounted = true;
    try {
      const mod = require("react-native-maps");
      if (mounted) setMapsModule(mod);
    } catch (e) {
      console.warn("react-native-maps not available:", e);
    }
    return () => {
      mounted = false;
    };
  }, []);

  const centerUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 800);
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

  /* ================= LOADING ================= */

  if (loading || !userLocation) {
    return (
      <MainContainer safe>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Getting your location…
          </Text>
        </View>
      </MainContainer>
    );
  }

  if (!MapsModule) {
    return (
      <MainContainer>
        <View style={[styles.loading, { padding: 16 }]}>
          <Text
            style={[
              styles.loadingText,
              { color: theme.text, textAlign: "center" },
            ]}
          >
            Map is unavailable on this device. Install and link
            react-native-maps to enable the map view.
          </Text>
        </View>
      </MainContainer>
    );
  }

  /* ================= UI ================= */

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

        {/* ── MAP ── */}
        <MapsModule.default
          ref={mapRef}
          style={styles.map}
          provider={
            Platform.OS === "android"
              ? MapsModule.PROVIDER_GOOGLE
              : MapsModule.PROVIDER_DEFAULT
          }
          initialRegion={userLocation}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {filteredCompanies.map((c) => (
            <MapsModule.Marker
              key={c.id}
              coordinate={c.coordinate}
              pinColor={c.rating > 4.7 ? theme.primary : theme.icon}
              onPress={() => openModal(c)}
            />
          ))}
        </MapsModule.default>

        {/* ── FETCHING PILL ── */}
        {fetching && (
          <View style={styles.fetchingPill}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.fetchingText}>Updating…</Text>
          </View>
        )}

        {/* ── RESULT COUNT PILL ── */}
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

        {/* ── FAB STACK ── */}
        <View style={[styles.fabStack, { bottom: TAB_BAR_HEIGHT + 16 }]}>
          {/* Search FAB */}
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

          {/* Center FAB */}
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

        {/* ── BOTTOM SHEET MODAL ── */}
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
              {/* Handle */}
              <View
                style={[styles.handle, { backgroundColor: theme.border }]}
              />

              {selectedCompany && (
                <View style={styles.sheetContent}>
                  {/* Header */}
                  <View style={styles.sheetHeader}>
                    <View style={styles.sheetTitleBlock}>
                      <Text style={[styles.sheetTitle, { color: theme.text }]}>
                        {selectedCompany.name}
                      </Text>
                      {selectedCompany.verified && (
                        <View
                          style={[
                            styles.verifiedBadge,
                            { backgroundColor: theme.iconBackground },
                          ]}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={12}
                            color={theme.primary}
                          />
                          <Text
                            style={[
                              styles.verifiedText,
                              { color: theme.primary },
                            ]}
                          >
                            Verified
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.closeBtn,
                        { backgroundColor: theme.iconBackground },
                      ]}
                      onPress={closeModal}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={16} color={theme.icon} />
                    </TouchableOpacity>
                  </View>

                  {/* Divider */}
                  <View
                    style={[styles.divider, { backgroundColor: theme.border }]}
                  />

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    <View
                      style={[
                        styles.statChip,
                        { backgroundColor: theme.iconBackground },
                      ]}
                    >
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {selectedCompany.rating}
                      </Text>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Rating
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statChip,
                        { backgroundColor: theme.iconBackground },
                      ]}
                    >
                      <Ionicons
                        name="navigate-outline"
                        size={13}
                        color={theme.primary}
                      />
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {(selectedCompany.distance / 1000).toFixed(1)} km
                      </Text>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Away
                      </Text>
                    </View>
                  </View>

                  {/* Address row */}
                  <View style={[styles.infoRow, { borderColor: theme.border }]}>
                    <View
                      style={[
                        styles.infoIcon,
                        { backgroundColor: theme.iconBackground },
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={15}
                        color={theme.icon}
                      />
                    </View>
                    <Text style={[styles.infoText, { color: theme.text }]}>
                      {selectedCompany.address}
                    </Text>
                  </View>

                  {/* CTA */}
                  <TouchableOpacity
                    style={[styles.cta, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push(
                        "/(screens)/(sme)/(screens)/manufacturerProfile",
                      )
                    }
                  >
                    <Text style={[styles.ctaText, { color: theme.onPrimary }]}>
                      View Profile
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={theme.onPrimary}
                    />
                  </TouchableOpacity>
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

  /* Search bar */
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

  /* Result count pill */
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

  /* Fetching pill */
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
  fetchingText: { color: "#fff", fontSize: 13 },

  /* FAB stack */
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

  /* Modal */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetContent: { gap: 16 },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitleBlock: { flex: 1, gap: 6 },
  sheetTitle: { fontSize: 18, fontWeight: "700", lineHeight: 22 },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: "600" },

  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  divider: { height: StyleSheet.hairlineWidth },

  statsRow: { flexDirection: "row", gap: 10 },
  statChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statValue: { fontSize: 14, fontWeight: "600" },
  statLabel: { fontSize: 12 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  infoText: { fontSize: 14, flex: 1 },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  ctaText: { fontSize: 15, fontWeight: "600" },
});
