import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

// Matches the Factory schema from the OpenAPI spec
interface Factory {
  id: string;
  companyName: string;
  description?: string | null;
  sectorTags: string[];
  machineryList?: string | null;
  minOrderQuantity?: number | null;
  maxOrderQuantity?: number | null;
  address?: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "SUSPENDED" | "REJECTED";
  verificationNotes?: string | null;
  isFeatured: boolean;
  responseTimeHours?: number | null;
  completionRate?: number | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  ownerPhoneNumber: string;
  latitude?: number | null;
  longitude?: number | null;
}

type ActionStatus = "VERIFIED" | "REJECTED";

const STATUS_COLORS: Record<Factory["verificationStatus"], string> = {
  PENDING: "#D97706",
  VERIFIED: "#16A34A",
  SUSPENDED: "#DC2626",
  REJECTED: "#6B7280",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const DetailRow = ({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
}) => (
  <View style={styles.detailRow}>
    <Ionicons
      name={icon as any}
      size={15}
      color={theme.textSecondary}
      style={{ width: 20 }}
    />
    <View style={{ flex: 1 }}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
    </View>
  </View>
);

const VerificationQueue = () => {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selected, setSelected] = useState<Factory | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState<ActionStatus | null>(null);
  const theme = Colors[useColorScheme() ?? "light"];

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const fetchFactories = async () => {
    try {
      const { data } = await api.get("admin/factories/verification-queue", {
        params: { status: "PENDING", page: 0, size: 100 },
      });
      setFactories(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      Alert.alert("Error", handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFactories();
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFactories();
  }, []);

  const openReview = (item: Factory) => {
    setSelected(item);
    setNotes(item.verificationNotes || "");
    setSheetVisible(true);
  };

  useEffect(() => {
    if (sheetVisible) {
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 14,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sheetVisible]);

  const closeSheet = (onDone?: () => void) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
      setSelected(null);
      onDone?.();
    });
  };

  const handleAction = async (status: ActionStatus) => {
    if (!selected) return;
    setSubmitting(status);

    try {
      // Same leading-slash fix here.
      await api.patch(`admin/factories/${selected.id}/verify`, {
        status,
        notes: notes.trim() || undefined,
      });

      setFactories((prev) => prev.filter((f) => f.id !== selected.id));

      closeSheet(() => {
        Alert.alert(
          "Success",
          `Factory ${status === "VERIFIED" ? "verified" : "rejected"}.`,
        );
      });
    } catch (err) {
      Alert.alert("Action Failed", handleApiError(err));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <MainContainer safe>
      <Text style={[styles.header, { color: theme.text }]}>
        Verification Queue
      </Text>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="small"
          color={theme.text}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={factories}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.text}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: theme.cardBackground }]}
              onPress={() => openReview(item)}
            >
              <Text style={[styles.title, { color: theme.text }]}>
                {item.companyName}
              </Text>
              <Text style={{ color: theme.textSecondary }}>
                Owner: {item.ownerName}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                marginTop: 50,
              }}
            >
              No pending verifications
            </Text>
          }
        />
      )}

      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeSheet()}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => closeSheet()}
          >
            <Animated.View
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            />
          </Pressable>

          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.cardBackground,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: theme.border }]} />

            {selected && (
              <>
                <ScrollView
                  style={styles.scrollArea}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Identity */}
                  <View style={styles.identityRow}>
                    <Text
                      style={[styles.title, { color: theme.text, flex: 1 }]}
                    >
                      {selected.companyName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            STATUS_COLORS[selected.verificationStatus] + "18",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              STATUS_COLORS[selected.verificationStatus],
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: STATUS_COLORS[selected.verificationStatus] },
                        ]}
                      >
                        {selected.verificationStatus}
                      </Text>
                    </View>
                  </View>

                  {selected.sectorTags && selected.sectorTags.length > 0 && (
                    <View style={styles.tagRow}>
                      {selected.sectorTags.map((tag, idx) => (
                        <View
                          key={`${tag}-${idx}`}
                          style={[
                            styles.tagChip,
                            { backgroundColor: theme.background },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selected.description ? (
                    <Text
                      style={[
                        styles.description,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {selected.description}
                    </Text>
                  ) : null}

                  <DetailRow
                    icon="call-outline"
                    label="Phone"
                    value={selected.ownerPhoneNumber}
                    theme={theme}
                  />

                  {/* Capacity */}
                  {(selected.minOrderQuantity != null ||
                    selected.maxOrderQuantity != null ||
                    selected.machineryList) && (
                    <>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        CAPACITY
                      </Text>
                      {(selected.minOrderQuantity != null ||
                        selected.maxOrderQuantity != null) && (
                        <DetailRow
                          icon="cube-outline"
                          label="Order Quantity Range"
                          value={`${selected.minOrderQuantity ?? "—"} to ${
                            selected.maxOrderQuantity ?? "—"
                          } units`}
                          theme={theme}
                        />
                      )}
                      {selected.machineryList && (
                        <DetailRow
                          icon="construct-outline"
                          label="Machinery"
                          value={selected.machineryList}
                          theme={theme}
                        />
                      )}
                    </>
                  )}

                  {/* Location */}
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    LOCATION
                  </Text>
                  <DetailRow
                    icon="location-outline"
                    label="Address"
                    value={selected.address || "Not provided"}
                    theme={theme}
                  />
                  {selected.latitude != null && selected.longitude != null && (
                    <DetailRow
                      icon="pin-outline"
                      label="Coordinates"
                      value={`${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`}
                      theme={theme}
                    />
                  )}

                  {/* Timeline */}
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    TIMELINE
                  </Text>
                  <DetailRow
                    icon="calendar-outline"
                    label="Applied"
                    value={formatDate(selected.createdAt)}
                    theme={theme}
                  />
                  <DetailRow
                    icon="time-outline"
                    label="Last Updated"
                    value={formatDate(selected.updatedAt)}
                    theme={theme}
                  />

                  {/* Performance */}
                  {(selected.responseTimeHours != null ||
                    selected.completionRate != null) && (
                    <>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        PERFORMANCE
                      </Text>
                      {selected.responseTimeHours != null && (
                        <DetailRow
                          icon="flash-outline"
                          label="Avg. Response Time"
                          value={`${selected.responseTimeHours.toFixed(1)} hours`}
                          theme={theme}
                        />
                      )}
                      {selected.completionRate != null && (
                        <DetailRow
                          icon="checkmark-done-outline"
                          label="Completion Rate"
                          value={`${(selected.completionRate * 100).toFixed(0)}%`}
                          theme={theme}
                        />
                      )}
                    </>
                  )}

                  {/* Notes */}
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    REVIEW NOTES
                  </Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                      },
                    ]}
                    placeholder="Optional notes…"
                    placeholderTextColor={theme.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />

                  <View style={{ height: 8 }} />
                </ScrollView>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={[styles.btn, { backgroundColor: "#DC2626" }]}
                    onPress={() => handleAction("REJECTED")}
                    disabled={submitting !== null}
                  >
                    {submitting === "REJECTED" ? (
                      <ActivityIndicator color={theme.onPrimary} size="small" />
                    ) : (
                      <Text
                        style={[styles.btnText, { color: theme.onPrimary }]}
                      >
                        Reject
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[styles.btn, { backgroundColor: "#16A34A" }]}
                    onPress={() => handleAction("VERIFIED")}
                    disabled={submitting !== null}
                  >
                    {submitting === "VERIFIED" ? (
                      <ActivityIndicator color={theme.onPrimary} size="small" />
                    ) : (
                      <Text
                        style={[styles.btnText, { color: theme.onPrimary }]}
                      >
                        Verify
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: "bold", margin: 20 },
  card: {
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  scrollArea: { flexGrow: 0 },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  tagChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "600" },
  description: { fontSize: 13.5, lineHeight: 20, marginBottom: 14 },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 10.5, fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 13.5, fontWeight: "500" },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    minHeight: 70,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  btn: { padding: 15, borderRadius: 8, width: "48%", alignItems: "center" },
  btnText: { fontWeight: "700" },
});

export default VerificationQueue;
