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
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  verified: boolean;
  address: string;
  distance: number;
}

/* ================= MOCK DATA ================= */

const generateMockCompanies = (
  centerLat: number,
  centerLon: number,
  radiusKm = 5,
  count = 15,
): Company[] => {
  const companies: Company[] = [];

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

  // Tab bar height: 49pt on iOS + bottom inset, 56dp on Android
  const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 + insets.bottom : 56;

  const mapRef = useRef<any>(null);

  const [MapsModule, setMapsModule] = useState<any>(null);

  const [userLocation, setUserLocation] = useState<any | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const searchInputRef = useRef<TextInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  /* ================= MODAL ================= */

  const openModal = (company: Company) => {
    setSelectedCompany(company);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedCompany(null), 300);
  };

  /* ================= LOCATION & DATA ================= */

  const fetchCompanies = async (lat: number, lon: number) => {
    setFetching(true);
    await new Promise((r) => setTimeout(r, 600));
    const data = generateMockCompanies(lat, lon, 8, 20);
    setCompanies(data);
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

      // ✅ Real current position with highest accuracy
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
    } catch (e) {
      Alert.alert("Error", "Failed to get your location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  // Attempt to dynamically require react-native-maps to avoid crashing
  // when the native module isn't available during development.
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

  /* ================= LOADING ================= */

  if (loading || !userLocation) {
    return (
      <MainContainer safe>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Getting your location...
          </Text>
        </View>
      </MainContainer>
    );
  }

  // If maps native module isn't available, show a safe fallback UI.
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
        {/* SEARCH BAR (toggleable) */}
        {searchVisible && (
          <View
            style={[
              styles.searchContainer,
              {
                top: 16 + insets.top,
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <TextInput
              ref={(r) => {
                searchInputRef.current = r;
              }}
              placeholder="Search companies or services"
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <TouchableOpacity
                onPress={() => setQuery("")}
                style={styles.searchClear}
              >
                <Text style={{ color: theme.primary }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* MAP */}
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
          showsCompass
        >
          {filteredCompanies.map((c) => (
            <MapsModule.Marker
              key={c.id}
              coordinate={c.coordinate}
              pinColor={c.rating > 4.7 ? "#FFD700" : "#F06292"}
              onPress={() => openModal(c)}
            />
          ))}
        </MapsModule.default>

        {/* FETCHING OVERLAY */}
        {fetching && (
          <View style={styles.topOverlay}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.overlayText}>Updating...</Text>
          </View>
        )}

        {/* ✅ CENTER BUTTON — sits above tab bar */}
        <TouchableOpacity
          style={[styles.centerBtn, { bottom: TAB_BAR_HEIGHT + 16 }]}
          onPress={centerUser}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 22 }}>📍</Text>
        </TouchableOpacity>

        {/* SEARCH FAB — shows/hides the search bar */}
        <TouchableOpacity
          style={[styles.searchFab, { bottom: TAB_BAR_HEIGHT + 16 + 72 }]}
          onPress={() => {
            setSearchVisible((v) => {
              const next = !v;
              if (next) setTimeout(() => searchInputRef.current?.focus(), 250);
              return next;
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color={theme.onPrimary} />
        </TouchableOpacity>

        {/* ================= MODAL ================= */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeModal}
          statusBarTranslucent
        >
          {/* Backdrop — tap to dismiss */}
          <Pressable style={styles.modalBackdrop} onPress={closeModal}>
            {/* Inner Pressable blocks propagation so tapping card doesn't close */}
            <Pressable
              style={[
                styles.modalCard,
                {
                  height: SCREEN_HEIGHT * 0.5,
                  backgroundColor: theme.cardBackground,
                },
              ]}
              onPress={() => {}}
            >
              {/* Handle bar */}
              <View style={[styles.handle, { backgroundColor: theme.icon }]} />

              {/* Close button */}
              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.iconBackground },
                ]}
                onPress={closeModal}
              >
                <Ionicons name="close" size={20} color={theme.icon} />
              </TouchableOpacity>

              {selectedCompany && (
                <View style={styles.modalContent}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {selectedCompany.name}
                  </Text>

                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.textSecondary + 50 },
                    ]}
                  />

                  <View style={[styles.row]}>
                    <Text style={[styles.rowIcon, { color: theme.text }]}>
                      ⭐
                    </Text>
                    <Text style={[styles.rowText, { color: theme.text }]}>
                      {selectedCompany.rating} Rating
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={[styles.rowIcon, { color: theme.text }]}>
                      📍
                    </Text>
                    <Text style={[styles.rowText, { color: theme.text }]}>
                      {selectedCompany.address}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={[styles.rowIcon, { color: theme.text }]}>
                      🛣️
                    </Text>
                    <Text style={[styles.rowText, { color: theme.text }]}>
                      {(selectedCompany.distance / 1000).toFixed(1)} km away
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={[styles.rowIcon, { color: theme.text }]}>
                      {selectedCompany.verified ? "✅" : "❌"}
                    </Text>
                    <Text
                      style={[
                        styles.rowText,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {selectedCompany.verified ? "Verified" : "Unverified"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      return router.push(
                        "/(screens)/(sme)/(screens)/manufacturerProfile",
                      );
                      // closeModal()
                    }}
                  >
                    <Text style={styles.ctaBtnText}>View Details</Text>
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

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },

  topOverlay: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  overlayText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 13,
  },

  /* ✅ No hardcoded bottom — set dynamically via TAB_BAR_HEIGHT */
  centerBtn: {
    position: "absolute",
    right: 20,
    backgroundColor: "#fff",
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  searchFab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#111",
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },

  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },

  closeBtn: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },

  modalContent: {
    flex: 1,
    marginTop: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginRight: 36,
  },

  divider: {
    height: 1,
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  rowIcon: {
    fontSize: 18,
    width: 32,
  },
  rowText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },

  ctaBtn: {
    marginTop: "auto",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  /* SEARCH */
  searchContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  searchClear: {
    marginLeft: 8,
    padding: 6,
  },
});
