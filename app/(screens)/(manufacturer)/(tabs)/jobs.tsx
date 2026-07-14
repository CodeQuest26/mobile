import JobPeekCard from "@/components/JobPeekCard";
import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

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

// Interface for the API's job response (subset of JobDetailResponse)
interface ApiJob {
  id: string;
  title: string;
  productType: string;
  sectorTag: string;
  quantity: number;
  specifications?: string;
  budgetMinGhs: number;
  budgetMaxGhs: number;
  deadline: string; // date string
  deliveryAddress?: string;
  attachmentUrls?: string[];
  status: string;
  createdAt: string; // ISO date
  updatedAt: string;
  smeName: string;
  smeId: string;
}

// Internal job type used for filtering/sorting/display
interface Job {
  id: string;
  product: string; // from productType
  quantity: number;
  budget: string; // formatted budget range
  location: string; // from deliveryAddress or fallback
  category: string; // from sectorTag
  postedAt: string; // from createdAt
  deadline: string; // from deadline
  sme: string; // from smeName
  rating?: number; // not provided by API, default 0
  bids?: number; // not provided by API, default 0
}

// The shape expected by JobPeekCard
interface EnhancedJobPeek {
  id: string;
  product: string;
  quantity: number;
  budget: string;
  location: string;
  category: string;
  timeAgo: string;
  rating: number;
  bids: number;
}

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

  // State for real jobs from API
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Request first page with a large page size to get all jobs at once
      const response = await api.get("/api/v1/jobs", {
        params: {
          page: 0,
          size: 1000,
          // optionally add sectorTag filter? could be added later
        },
      });
      // response.data should be PagedResponseJobDetailResponse
      const apiJobs: ApiJob[] = response.data.content || [];

      // Transform API jobs to internal Job format
      const transformed: Job[] = apiJobs.map((job) => ({
        id: job.id,
        product: job.productType || "Unnamed Product",
        quantity: job.quantity || 0,
        budget: formatBudget(job.budgetMinGhs, job.budgetMaxGhs),
        location: job.deliveryAddress || "Location not specified",
        category: job.sectorTag || "Uncategorized",
        postedAt: job.createdAt || new Date().toISOString(),
        deadline: job.deadline || new Date().toISOString(),
        sme: job.smeName || "Unknown Client",
        rating: 0, // API does not provide rating on job list
        bids: 0, // API does not provide bid count on job list
      }));
      setJobs(transformed);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format budget range
  const formatBudget = (min: number, max: number) => {
    if (!min && !max) return "GHS 0";
    const minStr = min ? `GHS ${min.toLocaleString()}` : "";
    const maxStr = max ? `GHS ${max.toLocaleString()}` : "";
    if (minStr && maxStr) return `${minStr} - ${maxStr}`;
    return minStr || maxStr;
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter, search, and sort the real jobs
  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    // Category filter (if not ALL)
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
      // Sort by budgetMinGhs (extract from budget string? Better to store numeric)
      // We'll parse the budget string to get min numeric value
      list.sort((a, b) => {
        const aMin = extractBudgetMin(a.budget);
        const bMin = extractBudgetMin(b.budget);
        return bMin - aMin; // descending
      });
    } else if (sortBy === "deadline") {
      list.sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
    }

    return list;
  }, [search, activeCategory, sortBy, jobs]);

  // Helper to extract numeric min from budget string like "GHS 1,500 - GHS 2,000"
  const extractBudgetMin = (budgetStr: string) => {
    const match = budgetStr.match(/GHS\s*([\d,]+)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ""));
    }
    return 0;
  };

  // Transform to EnhancedJobPeek for rendering
  const jobsToRender = useMemo<EnhancedJobPeek[]>(
    () =>
      filteredJobs.map((job) => ({
        id: job.id,
        product: job.product,
        quantity: job.quantity,
        budget: job.budget,
        location: job.location,
        category: job.category,
        timeAgo: getTimeAgo(job.postedAt),
        rating: job.rating ?? 0,
        bids: job.bids ?? 0,
      })),
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
            {loading
              ? "Loading..."
              : `${jobsToRender.length} open job${jobsToRender.length !== 1 ? "s" : ""}`}
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
          !loading ? (
            <View style={styles.empty}>
              <Ionicons
                name="search-outline"
                size={40}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No Jobs Found
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                New Jobs will appear here as they are posted.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: theme.textSecondary }}>
                Loading Jobs...
              </Text>
            </View>
          ) : null
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
