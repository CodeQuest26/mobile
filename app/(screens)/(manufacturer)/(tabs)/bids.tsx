// src/app/(screens)/(manufacturer)/(tabs)/bids.tsx
import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { JOBS, type Job } from "@/constants/manufacturerData";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ALL = "All";

// Helpers
const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
};

const isUrgent = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 7;
};

// Job Card
const JobCard = ({ job, theme }: { job: Job; theme: any }) => {
  const urgent = isUrgent(job.deadline);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() =>
          router.push({
            pathname: "/(screens)/(manufacturer)/(screens)/bidDetails",
            params: { id: job.id },
          })
        }
        style={[
          styles.jobCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: urgent ? theme.textSecondary + "40" : theme.border,
          },
        ]}
      >
        {/* Top row */}
        <View style={styles.jobCardTop}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.jobCardTagRow}>
              <View style={[styles.catTag]}>
                <Text
                  style={[styles.catTagText, { color: theme.textSecondary }]}
                >
                  {job.category}
                </Text>
              </View>
            </View>

            <Text style={[styles.jobCardProduct, { color: theme.text }]}>
              {job.product}
            </Text>

            <Text style={[styles.jobCardSme, { color: theme.textSecondary }]}>
              {job.sme}
            </Text>
          </View>

          <View
            style={[
              styles.budgetPill,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
            <Text style={[styles.budgetText, { color: theme.text }]}>
              {job.budget}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.jobCardMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="cube-outline"
              size={13}
              color={theme.textSecondary}
            />

            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {job.quantity}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name="location-outline"
              size={13}
              color={theme.textSecondary}
            />

            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {job.location}
            </Text>
          </View>

          {/* <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={13}
              color={urgent ? theme.warning : theme.textSecondary}
            />

            <Text
              style={[
                styles.metaText,
                { color: urgent ? theme.warning : theme.textSecondary },
              ]}
            >
              {daysUntil(job.deadline)}
            </Text>
          </View> */}
        </View>

        <TouchableOpacity
          style={[styles.bidBtn, { backgroundColor: theme.primary }]}
          onPress={() =>
            router.push({
              pathname: "/(screens)/(manufacturer)/(screens)/bidDetails",
              params: { id: job.id },
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.bidBtnText}>Place Bid</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Screen
const CATEGORIES = [ALL, ...Array.from(new Set(JOBS.map((j) => j.category)))];

export default function BidsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [sortBy, setSortBy] = useState<"newest" | "budget" | "deadline">(
    "newest",
  );
  const [showSort, setShowSort] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const filtered = useMemo(() => {
    let list = [...JOBS];

    if (activeCategory !== ALL) {
      list = list.filter((j) => j.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.product.toLowerCase().includes(q) ||
          j.sme.toLowerCase().includes(q) ||
          j.category.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q),
      );
    }

    if (sortBy === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );
    } else if (sortBy === "budget") {
      list.sort(
        (a, b) =>
          parseFloat(b.budget.replace(/[^\d.]/g, "")) -
          parseFloat(a.budget.replace(/[^\d.]/g, "")),
      );
    } else if (sortBy === "deadline") {
      list.sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
    }

    return list;
  }, [search, activeCategory, sortBy]);

  const sortLabels: Record<string, string> = {
    newest: "Newest",
    budget: "Highest Budget",
    deadline: "Soonest Deadline",
  };

  const handleSearchToggle = () => {
    if (isSearchVisible) {
      // Closing: reset search and hide
      setSearch("");
      setIsSearchVisible(false);
    } else {
      setIsSearchVisible(true);
    }
  };

  return (
    <MainContainer safe>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Job Board</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {filtered.length} open job{filtered.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSearchToggle}
          style={styles.searchButton}
        >
          <Ionicons
            name={isSearchVisible ? "close" : "search-outline"}
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* Expandable Search Bar */}
      {isSearchVisible && (
        <View
          style={[
            styles.searchBarContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search jobs, SMEs, locations…"
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoFocus={true}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sort Button Row */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          onPress={() => setShowSort((v) => !v)}
          style={[
            styles.sortBtn,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="options-outline" size={16} color={theme.text} />
          <Text style={[styles.sortBtnText, { color: theme.text }]}>
            {sortLabels[sortBy]}
          </Text>
          <Ionicons
            name={showSort ? "chevron-up" : "chevron-down"}
            size={14}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View
          style={[
            styles.sortDropdown,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          {(["newest", "budget", "deadline"] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.sortOption,
                sortBy === opt && {
                  backgroundColor: theme.primary + "15",
                },
              ]}
              onPress={() => {
                setSortBy(opt);
                setShowSort(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  {
                    color: sortBy === opt ? theme.primary : theme.text,
                    fontWeight: sortBy === opt ? "700" : "500",
                  },
                ]}
              >
                {sortLabels[opt]}
              </Text>
              {sortBy === opt && (
                <Ionicons name="checkmark" size={16} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Spacer style={{ height: 8 }} />

      {/* Job List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} theme={theme} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="search-outline"
              size={40}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No jobs found
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Try a different search or category
            </Text>
          </View>
        }
      />
    </MainContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  sortRow: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sortDropdown: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 10,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  sortOptionText: { fontSize: 14 },
  chipsRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  jobCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  jobCardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  jobCardTagRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  catTagText: { fontSize: 10.5, fontWeight: "700" },
  urgentTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#f9731615",
  },
  urgentTagText: { fontSize: 10.5, fontWeight: "700" },
  jobCardProduct: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  jobCardSme: { fontSize: 12.5 },
  budgetPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  budgetText: { fontSize: 13, fontWeight: "800" },
  divider: { height: 1 },
  jobCardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontWeight: "500" },
  bidBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 30,
    paddingVertical: 11,
  },
  bidBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13 },
});
