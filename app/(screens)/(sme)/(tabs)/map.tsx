// import { FadeIn } from "@/components/FadeIn";
// import MainContainer from "@/components/MainContainer";
// import { ThemedText } from "@/components/themed-text";
// import Colors from "@/constants/colors";
// import { Ionicons } from "@expo/vector-icons";
// import * as Location from "expo-location";
// import { router } from "expo-router";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Dimensions,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useColorScheme,
//   View,
// } from "react-native";
// import MapView, {
//   Callout,
//   Marker,
//   PROVIDER_GOOGLE,
//   Region,
// } from "react-native-maps";

// const { width, height } = Dimensions.get("window");

// // Type for nearby manufacturing company
// interface Manufacturer {
//   id: string;
//   name: string;
//   address: string;
//   distance: number; // in km
//   rating: number;
//   coordinates: {
//     latitude: number;
//     longitude: number;
//   };
// }

// // Mock function to generate nearby manufacturers based on user location
// const generateNearbyManufacturers = (
//   userLat: number,
//   userLng: number,
// ): Manufacturer[] => {
//   const companies = [
//     {
//       name: "Precision Machining Co.",
//       address: "123 Industrial Park",
//       rating: 4.8,
//     },
//     {
//       name: "Apex Fabrication",
//       address: "456 Manufacturing Blvd",
//       rating: 4.5,
//     },
//     { name: "Metro Metalworks", address: "789 Steel Avenue", rating: 4.2 },
//     {
//       name: "Elite Electronics Assembly",
//       address: "321 Tech Drive",
//       rating: 4.9,
//     },
//     { name: "Summit Plastics", address: "654 Polymer Lane", rating: 4.3 },
//     { name: "Royal Textile Mills", address: "987 Fabric Street", rating: 4.0 },
//     {
//       name: "Phoenix Aerospace Components",
//       address: "147 Skyway Road",
//       rating: 4.7,
//     },
//     { name: "Cascade Woodworking", address: "258 Timber Trail", rating: 4.4 },
//   ];

//   return companies.map((company, index) => {
//     // Random offset within ~3km radius (approx 0.03 degrees)
//     const latOffset = (Math.random() - 0.5) * 0.05;
//     const lngOffset = (Math.random() - 0.5) * 0.05;
//     const distance = (Math.random() * 4 + 1).toFixed(1);

//     return {
//       id: index.toString(),
//       name: company.name,
//       address: company.address,
//       distance: parseFloat(distance),
//       rating: company.rating,
//       coordinates: {
//         latitude: userLat + latOffset,
//         longitude: userLng + lngOffset,
//       },
//     };
//   });
// };

// const Map = () => {
//   const colorScheme = useColorScheme();
//   const theme = Colors[colorScheme ?? "light"] ?? Colors.light;
//   const mapRef = useRef<MapView>(null);

//   const [userLocation, setUserLocation] =
//     useState<Location.LocationObjectCoords | null>(null);
//   const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [locationPermission, setLocationPermission] = useState<boolean | null>(
//     null,
//   );
//   const [mapRegion, setMapRegion] = useState<Region | null>(null);

//   // Request location permissions
//   const getLocationPermission = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         setLocationPermission(false);
//         setLoading(false);
//         return false;
//       }
//       setLocationPermission(true);
//       return true;
//     } catch (error) {
//       console.error("Location permission error:", error);
//       setLocationPermission(false);
//       setLoading(false);
//       return false;
//     }
//   };

//   const getUserLocation = async () => {
//     try {
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });
//       const coords = location.coords;
//       setUserLocation(coords);

//       const region: Region = {
//         latitude: coords.latitude,
//         longitude: coords.longitude,
//         latitudeDelta: 0.05,
//         longitudeDelta: 0.05,
//       };
//       setMapRegion(region);

//       const nearby = generateNearbyManufacturers(
//         coords.latitude,
//         coords.longitude,
//       );
//       setManufacturers(nearby);

//       return coords;
//     } catch (error) {
//       console.error("Error getting location:", error);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const initializeMap = async () => {
//     setLoading(true);
//     const hasPermission = await getLocationPermission();
//     if (hasPermission) {
//       await getUserLocation();
//     } else {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     initializeMap();
//   }, []);

//   const recenterMap = () => {
//     if (userLocation && mapRef.current) {
//       mapRef.current.animateToRegion({
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.05,
//         longitudeDelta: 0.05,
//       });
//     }
//   };

//   const handleViewDetails = (manufacturer: Manufacturer) => {
//     router.push({
//       pathname: "/(screens)/(sme)/(screens)/companyDetails",
//       params: { id: manufacturer.id, name: manufacturer.name },
//     });
//   };

//   if (loading) {
//     return (
//       <MainContainer safe>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={theme.primary} />
//           <ThemedText
//             style={[styles.loadingText, { color: theme.textSecondary }]}
//           >
//             Finding nearby manufacturers...
//           </ThemedText>
//         </View>
//       </MainContainer>
//     );
//   }

//   if (!locationPermission) {
//     return (
//       <MainContainer safe>
//         <View style={styles.permissionContainer}>
//           <Ionicons
//             name="location-outline"
//             size={64}
//             color={theme.textSecondary}
//           />
//           <ThemedText style={[styles.permissionTitle, { color: theme.text }]}>
//             Location Access Required
//           </ThemedText>
//           <ThemedText
//             style={[styles.permissionText, { color: theme.textSecondary }]}
//           >
//             Please enable location services to see nearby manufacturing
//             companies.
//           </ThemedText>

//           <TouchableOpacity
//             style={[
//               styles.permissionButton,
//               { backgroundColor: theme.primary },
//             ]}
//             onPress={initializeMap}
//           >
//             <Text
//               style={[styles.permissionButtonText, { color: theme.onPrimary }]}
//             >
//               Try Again
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </MainContainer>
//     );
//   }

//   return (
//     <MainContainer safe>
//       <View style={styles.container}>
//         {/* Header */}
//         <FadeIn delay={0}>
//           <View style={styles.header}>
//             <View>
//               <ThemedText
//                 style={[styles.greeting, { color: theme.textSecondary }]}
//               >
//                 Find Partners
//               </ThemedText>
//               <Text style={[styles.title, { color: theme.text }]}>
//                 Nearby Manufacturers
//               </Text>
//             </View>
//             <TouchableOpacity
//               onPress={initializeMap}
//               style={[styles.refreshButton, { backgroundColor: theme.border }]}
//             >
//               <Ionicons name="refresh-outline" size={20} color={theme.icon} />
//             </TouchableOpacity>
//           </View>
//         </FadeIn>

//         {/* Map View */}
//         <FadeIn delay={100}>
//           <View style={styles.mapContainer}>
//             {mapRegion && (
//               <MapView
//                 ref={mapRef}
//                 provider={PROVIDER_GOOGLE}
//                 style={styles.map}
//                 initialRegion={mapRegion}
//                 showsUserLocation={true}
//                 showsMyLocationButton={false}
//                 showsCompass={true}
//                 showsBuildings={true}
//               >
//                 {manufacturers.map((manufacturer) => (
//                   <Marker
//                     key={manufacturer.id}
//                     coordinate={manufacturer.coordinates}
//                     title={manufacturer.name}
//                     description={`${manufacturer.distance}km away • ⭐ ${manufacturer.rating}`}
//                   >
//                     <View
//                       style={[
//                         styles.customMarker,
//                         {
//                           backgroundColor: theme.primary,
//                           borderColor: theme.onPrimary,
//                         },
//                       ]}
//                     >
//                       <Ionicons
//                         name="business"
//                         size={16}
//                         color={theme.onPrimary}
//                       />
//                     </View>
//                     <Callout
//                       style={[
//                         styles.callout,
//                         { backgroundColor: theme.cardBackground },
//                       ]}
//                       onPress={() => handleViewDetails(manufacturer)}
//                     >
//                       <View style={styles.calloutContent}>
//                         <Text
//                           style={[styles.calloutTitle, { color: theme.text }]}
//                         >
//                           {manufacturer.name}
//                         </Text>
//                         <Text
//                           style={[
//                             styles.calloutAddress,
//                             { color: theme.textSecondary },
//                           ]}
//                         >
//                           {manufacturer.address}
//                         </Text>
//                         <View style={styles.calloutRow}>
//                           <Ionicons
//                             name="location-outline"
//                             size={14}
//                             color={theme.primary}
//                           />
//                           <Text
//                             style={[
//                               styles.calloutDistance,
//                               { color: theme.textSecondary },
//                             ]}
//                           >
//                             {manufacturer.distance} km away
//                           </Text>
//                         </View>
//                         <View style={styles.calloutRow}>
//                           <Ionicons name="star" size={14} color="#FBBF24" />
//                           <Text
//                             style={[
//                               styles.calloutRating,
//                               { color: theme.textSecondary },
//                             ]}
//                           >
//                             {manufacturer.rating} / 5.0
//                           </Text>
//                         </View>
//                         <TouchableOpacity
//                           style={[
//                             styles.calloutButton,
//                             { backgroundColor: theme.primary },
//                           ]}
//                           onPress={() => handleViewDetails(manufacturer)}
//                         >
//                           <Text
//                             style={[
//                               styles.calloutButtonText,
//                               { color: theme.onPrimary },
//                             ]}
//                           >
//                             View Details
//                           </Text>
//                         </TouchableOpacity>
//                       </View>
//                     </Callout>
//                   </Marker>
//                 ))}
//               </MapView>
//             )}

//             {/* Recenter Button */}
//             <TouchableOpacity
//               style={[
//                 styles.recenterButton,
//                 { backgroundColor: theme.cardBackground },
//               ]}
//               onPress={recenterMap}
//             >
//               <Ionicons name="locate" size={22} color={theme.primary} />
//             </TouchableOpacity>
//           </View>
//         </FadeIn>

//         {/* Bottom Manufacturers List */}
//         <FadeIn delay={200}>
//           <View style={styles.bottomListContainer}>
//             <View style={styles.bottomListHeader}>
//               <Text style={[styles.bottomListTitle, { color: theme.text }]}>
//                 Nearby Manufacturing Partners
//               </Text>
//               <TouchableOpacity
//                 onPress={() =>
//                   router.push("/(screens)/(sme)/(screens)/manufacturersList")
//                 }
//               >
//                 <Text style={[styles.seeAllText, { color: theme.primary }]}>
//                   See All
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.horizontalList}
//               contentContainerStyle={styles.horizontalListContent}
//             >
//               {manufacturers.map((manufacturer, index) => (
//                 <TouchableOpacity
//                   key={manufacturer.id}
//                   style={[
//                     styles.manufacturerCard,
//                     {
//                       backgroundColor: theme.cardBackground,
//                       borderColor: theme.border,
//                       marginLeft: index === 0 ? 16 : 0,
//                     },
//                   ]}
//                   onPress={() => handleViewDetails(manufacturer)}
//                 >
//                   <View style={styles.cardIconContainer}>
//                     <Ionicons name="business" size={24} color={theme.primary} />
//                   </View>
//                   <Text
//                     style={[styles.cardName, { color: theme.text }]}
//                     numberOfLines={1}
//                   >
//                     {manufacturer.name}
//                   </Text>
//                   <View style={styles.cardDetails}>
//                     <View style={styles.cardRow}>
//                       <Ionicons
//                         name="location-outline"
//                         size={12}
//                         color={theme.textSecondary}
//                       />
//                       <Text
//                         style={[
//                           styles.cardDistance,
//                           { color: theme.textSecondary },
//                         ]}
//                       >
//                         {manufacturer.distance} km
//                       </Text>
//                     </View>
//                     <View style={styles.cardRow}>
//                       <Ionicons name="star" size={12} color="#FBBF24" />
//                       <Text
//                         style={[
//                           styles.cardRating,
//                           { color: theme.textSecondary },
//                         ]}
//                       >
//                         {manufacturer.rating}
//                       </Text>
//                     </View>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         </FadeIn>
//       </View>
//     </MainContainer>
//   );
// };

// export default Map;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 16,
//   },
//   loadingText: {
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   permissionContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 32,
//     gap: 16,
//   },
//   permissionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     textAlign: "center",
//   },
//   permissionText: {
//     fontSize: 14,
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   permissionButton: {
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//     marginTop: 8,
//   },
//   permissionButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   greeting: {
//     fontSize: 13,
//     fontWeight: "500",
//     marginBottom: 4,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "700",
//   },
//   refreshButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   mapContainer: {
//     height: height * 0.5,
//     marginHorizontal: 16,
//     borderRadius: 20,
//     overflow: "hidden",
//     marginVertical: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   map: {
//     width: "100%",
//     height: "100%",
//   },
//   customMarker: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   callout: {
//     width: 240,
//     padding: 0,
//     borderRadius: 12,
//     overflow: "hidden",
//   },
//   calloutContent: {
//     padding: 12,
//   },
//   calloutTitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     marginBottom: 4,
//   },
//   calloutAddress: {
//     fontSize: 11,
//     marginBottom: 6,
//   },
//   calloutRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     marginBottom: 4,
//   },
//   calloutDistance: {
//     fontSize: 11,
//   },
//   calloutRating: {
//     fontSize: 11,
//   },
//   calloutButton: {
//     marginTop: 8,
//     paddingVertical: 6,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   calloutButtonText: {
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   recenterButton: {
//     position: "absolute",
//     bottom: 12,
//     right: 12,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   bottomListContainer: {
//     marginTop: 16,
//     flex: 1,
//   },
//   bottomListHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   bottomListTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   seeAllText: {
//     fontSize: 13,
//     fontWeight: "600",
//   },
//   horizontalList: {
//     flexGrow: 0,
//   },
//   horizontalListContent: {
//     paddingRight: 16,
//     gap: 12,
//   },
//   manufacturerCard: {
//     width: 140,
//     padding: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     alignItems: "center",
//     gap: 8,
//   },
//   cardIconContainer: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: "rgba(75, 179, 126, 0.1)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 4,
//   },
//   cardName: {
//     fontSize: 13,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   cardDetails: {
//     flexDirection: "row",
//     gap: 12,
//     marginTop: 4,
//   },
//   cardRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   cardDistance: {
//     fontSize: 11,
//   },
//   cardRating: {
//     fontSize: 11,
//   },
// });

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Map = () => {
  return (
    <View>
      <Text>Map</Text>
    </View>
  );
};

export default Map;

const styles = StyleSheet.create({});
