import JobPeekCard from "@/components/JobPeekCard"; // adjust path as needed
import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { JOBS, type Job } from "@/constants/manufacturerData";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const ALL = "All";

// Helper: relative time from ISO date string
const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

// Helper: generate random rating between 3.5 and 5.0
const getRandomRating = () => {
  return +(3.5 + Math.random() * 1.5).toFixed(1);
};

// Helper: generate random bid count between 0 and 24
const getRandomBids = () => {
  return Math.floor(Math.random() * 25);
};

// Transform Job to EnhancedJobPeek
const transformJob = (job: Job): EnhancedJobPeek => ({
  id: job.id,
  product: job.product,
  quantity: job.quantity,
  budget: job.budget,
  location: job.location,
  category: job.category,
  timeAgo: getTimeAgo(job.postedAt),
  rating: getRandomRating(),
  bids: getRandomBids(),
});

export default function JobsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [sortBy, setSortBy] = useState<"newest" | "budget" | "deadline">(
    "newest",
  );
  const [showSort, setShowSort] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Filter, search, and sort the original jobs
  const filteredJobs = useMemo(() => {
    let list = [...JOBS];

    // Category filter
    if (activeCategory !== ALL) {
      list = list.filter((j) => j.category === activeCategory);
    }

    // Search filter
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

    // Sorting
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

  // Transform to EnhancedJobPeek for rendering
  const jobsToRender = useMemo(
    () => filteredJobs.map(transformJob),
    [filteredJobs],
  );

  const sortLabels: Record<string, string> = {
    newest: "Newest",
    budget: "Highest Budget",
    deadline: "Soonest Deadline",
  };

  const handleSearchToggle = () => {
    if (isSearchVisible) {
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
            {jobsToRender.length} open job{jobsToRender.length !== 1 ? "s" : ""}
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
            },
          ]}
        >
          {(["newest", "budget", "deadline"] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.sortOption,
                sortBy === opt && { backgroundColor: theme.primary + "15" },
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

      <Spacer style={{ height: 10 }} />

      {/* Job Grid with JobPeekCard */}
      <FlatList
        data={jobsToRender}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobPeekCard job={item} theme={theme} />}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContainer}
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
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 13,
  },
});
