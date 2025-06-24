import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
  SafeAreaView,
  TextInput,
  Animated,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { METEOR_SHOWERS_2025 } from "@/data/meteorShowers";
import { MeteorShower } from "@/types/meteorShower";
import { StorageService } from "@/services/StorageService";

const { width } = Dimensions.get("window");

type ViewMode = "calendar" | "list" | "timeline";
type CalendarMode = "month" | "year";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthNamesShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedShower, setSelectedShower] = useState<MeteorShower | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredShowers, setFilteredShowers] =
    useState<MeteorShower[]>(METEOR_SHOWERS_2025);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadFavorites();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterShowers();
  }, [searchQuery]);

  const loadFavorites = async () => {
    try {
      const favoriteShowers = await StorageService.getFavoriteShowers();
      setFavorites(favoriteShowers);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const filterShowers = () => {
    if (!searchQuery.trim()) {
      setFilteredShowers(METEOR_SHOWERS_2025);
      return;
    }

    const filtered = METEOR_SHOWERS_2025.filter(
      (shower) =>
        shower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shower.radiant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shower.parent.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredShowers(filtered);
  };

  const toggleSearch = () => {
    const newValue = !showSearchBar;
    setShowSearchBar(newValue);

    Animated.timing(searchAnim, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (!newValue) {
      setSearchQuery("");
      setFilteredShowers(METEOR_SHOWERS_2025); // Reset filtered showers immediately
    }
  };

  const toggleFavorite = async (showerId: string) => {
    try {
      const isFavorite = favorites.includes(showerId);
      if (isFavorite) {
        await StorageService.removeFavoriteShower(showerId);
        setFavorites(favorites.filter((id) => id !== showerId));
      } else {
        await StorageService.addFavoriteShower(showerId);
        setFavorites([...favorites, showerId]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update favorites");
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getShowerForDate = (date: Date): MeteorShower[] => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    return filteredShowers.filter((shower) => {
      const peakDate = shower.peak.date;
      const startDate = shower.active.start;
      const endDate = shower.active.end;

      return (
        dateStr === peakDate || (dateStr >= startDate && dateStr <= endDate)
      );
    });
  };

  const getMoonPhase = (date: Date) => {
    // Simplified moon phase calculation
    const knownNewMoon = new Date("2025-01-29").getTime();
    const synodicMonth = 29.530588853;
    const daysSinceNewMoon =
      (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);

    // Handle negative values for dates before known new moon
    const normalizedDays =
      daysSinceNewMoon >= 0
        ? daysSinceNewMoon
        : (daysSinceNewMoon % synodicMonth) + synodicMonth;
    const currentPhase = ((normalizedDays % synodicMonth) / synodicMonth) * 8;

    const phases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    return phases[Math.floor(currentPhase) % 8]; // Ensure index is within bounds
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const today = new Date();
    const totalCells = 42; // 6 rows x 7 days
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const showers = getShowerForDate(date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dayStr = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayStr}`;
      const hasPeak = showers.some((s) => s.peak.date === dateStr);
      const hasActivity = showers.length > 0;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected,
            hasActivity && styles.calendarDayActive,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isToday && styles.calendarDayTextToday,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {day}
          </Text>
          {hasPeak && <View style={styles.peakIndicator} />}
          {hasActivity && !hasPeak && <View style={styles.activityIndicator} />}
          {showers.length > 1 && (
            <Text style={styles.multipleIndicator}>{showers.length}</Text>
          )}
        </TouchableOpacity>
      );
    }

    // Fill remaining cells to complete the grid
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<View key={`empty-end-${i}`} style={styles.calendarDay} />);
    }

    // Split days into rows of 7
    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(
        <View key={`row-${i}`} style={styles.calendarRow}>
          {days.slice(i, i + 7)}
        </View>
      );
    }

    return (
      <View style={styles.calendarGrid}>
        {/* Day headers */}
        <View style={styles.calendarRow}>
          {dayNames.map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>
        {/* Calendar rows */}
        {rows}
      </View>
    );
  };

  const renderYearView = () => {
    return (
      <ScrollView style={styles.yearView}>
        {Array.from({ length: 12 }, (_, month) => {
          const monthShowers = filteredShowers.filter((shower) => {
            const peakDate = new Date(shower.peak.date);
            return peakDate.getMonth() === month;
          });

          return (
            <TouchableOpacity
              key={month}
              style={styles.yearMonthCard}
              onPress={() => {
                setCurrentMonth(month);
                setCalendarMode("month");
              }}
            >
              <LinearGradient
                colors={
                  monthShowers.length > 0
                    ? ["#667eea", "#764ba2"]
                    : ["#f1f5f9", "#e2e8f0"]
                }
                style={styles.yearMonthGradient}
              >
                <Text
                  style={[
                    styles.yearMonthName,
                    { color: monthShowers.length > 0 ? "#ffffff" : "#64748b" },
                  ]}
                >
                  {monthNames[month]}
                </Text>
                <Text
                  style={[
                    styles.yearMonthCount,
                    {
                      color:
                        monthShowers.length > 0
                          ? "rgba(255,255,255,0.9)"
                          : "#94a3b8",
                    },
                  ]}
                >
                  {monthShowers.length} shower
                  {monthShowers.length !== 1 ? "s" : ""}
                </Text>
                {monthShowers.length > 0 && (
                  <View style={styles.yearMonthShowers}>
                    {monthShowers.slice(0, 2).map((shower) => (
                      <Text key={shower.id} style={styles.yearMonthShowerName}>
                        {shower.name}
                      </Text>
                    ))}
                    {monthShowers.length > 2 && (
                      <Text style={styles.yearMonthMore}>
                        +{monthShowers.length - 2} more
                      </Text>
                    )}
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderShowerCard = (shower: MeteorShower, isExpanded = false) => {
    const isFavorite = favorites.includes(shower.id);
    const peakDate = new Date(shower.peak.date);
    const today = new Date();
    const isPast = peakDate < today;
    const isActive =
      today >= new Date(shower.active.start) &&
      today <= new Date(shower.active.end);
    const daysUntilPeak = Math.ceil(
      (peakDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        key={shower.id}
        style={[
          styles.showerCard,
          isActive && styles.showerCardActive,
          isPast && styles.showerCardPast,
        ]}
        onPress={() =>
          setSelectedShower(selectedShower?.id === shower.id ? null : shower)
        }
        activeOpacity={0.8}
      >
        <View style={styles.showerCardHeader}>
          <View style={styles.showerCardTitleRow}>
            <Text
              style={[
                styles.showerCardTitle,
                isActive && styles.showerCardTitleActive,
                isPast && styles.showerCardTitlePast,
              ]}
            >
              {shower.name}
            </Text>
            <TouchableOpacity
              onPress={() => toggleFavorite(shower.id)}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#ef4444" : "#64748b"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.showerCardMetadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="flash" size={16} color="#f59e0b" />
              <Text style={styles.metadataText}>{shower.zhr}/hr</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar" size={16} color="#3b82f6" />
              <Text style={styles.metadataText}>
                {peakDate.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="location" size={16} color="#8b5cf6" />
              <Text style={styles.metadataText}>{shower.radiant}</Text>
            </View>
          </View>
        </View>

        {isActive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>ACTIVE NOW</Text>
          </View>
        )}

        {!isPast && daysUntilPeak >= 0 && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {daysUntilPeak === 0
                ? "Peaks today!"
                : daysUntilPeak === 1
                ? "Peaks tomorrow"
                : `${daysUntilPeak} days until peak`}
            </Text>
          </View>
        )}

        {selectedShower?.id === shower.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.showerDescription}>{shower.description}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Active Period</Text>
                <Text style={styles.detailValue}>
                  {new Date(shower.active.start).toLocaleDateString()} -{" "}
                  {new Date(shower.active.end).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Parent Body</Text>
                <Text style={styles.detailValue}>{shower.parent}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Velocity</Text>
                <Text style={styles.detailValue}>{shower.velocity} km/s</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Best Viewing</Text>
                <Text style={styles.detailValue}>{shower.bestViewingTime}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Difficulty</Text>
                <View
                  style={[
                    styles.difficultyBadge,
                    shower.difficulty === "easy" && styles.difficultyEasy,
                    shower.difficulty === "moderate" &&
                      styles.difficultyModerate,
                    shower.difficulty === "difficult" &&
                      styles.difficultyDifficult,
                  ]}
                >
                  <Text style={styles.difficultyText}>
                    {shower.difficulty.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Moon Impact</Text>
                <Text style={styles.detailValue}>{shower.moonPhaseImpact}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTimelineView = () => {
    let showersToDisplay = filteredShowers;

    // Filter by current month/year if in month mode
    if (calendarMode === "month") {
      showersToDisplay = filteredShowers.filter((shower) => {
        const showerDate = new Date(shower.peak.date);
        const showerMonth = showerDate.getMonth();
        const showerYear = showerDate.getFullYear();
        return showerMonth === currentMonth && showerYear === currentYear;
      });
    }

    const sortedShowers = [...showersToDisplay].sort(
      (a, b) =>
        new Date(a.peak.date).getTime() - new Date(b.peak.date).getTime()
    );

    return (
      <ScrollView style={styles.timelineContainer}>
        {sortedShowers.map((shower, index) => (
          <View key={shower.id} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={styles.timelineDot} />
              {index < sortedShowers.length - 1 && (
                <View style={styles.timelineConnector} />
              )}
            </View>
            <View style={styles.timelineContent}>
              {renderShowerCard(shower)}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const selectedDateShowers = getShowerForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ThemedView style={styles.innerContainer}>
        <Animated.View style={[{ opacity: fadeAnim }, { flex: 1 }]}>
          {/* Enhanced Header */}
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f4c75"]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTitleRow}>
                <ThemedText style={styles.headerTitle}>
                  {calendarMode === "month" ? monthNames[currentMonth] : "Year"}{" "}
                  {currentYear}
                </ThemedText>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    onPress={toggleSearch}
                    style={styles.headerButton}
                  >
                    <Ionicons name="search" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setCalendarMode(
                        calendarMode === "month" ? "year" : "month"
                      )
                    }
                    style={styles.headerButton}
                  >
                    <Ionicons
                      name={calendarMode === "month" ? "grid" : "calendar"}
                      size={24}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <ThemedText style={styles.headerSubtitle}>
                {filteredShowers.length} meteor shower
                {filteredShowers.length !== 1 ? "s" : ""} •{" "}
                {getMoonPhase(selectedDate)}
              </ThemedText>
            </View>

            {/* Search Bar */}
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  height: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 60],
                  }),
                  opacity: searchAnim,
                },
              ]}
            >
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#64748b" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search meteor showers..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </LinearGradient>

          {/* Navigation Controls */}
          {calendarMode === "month" && (
            <View style={styles.navigationBar}>
              <TouchableOpacity
                onPress={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={24} color="#64748b" />
              </TouchableOpacity>

              <View style={styles.viewModeSelector}>
                {(["calendar", "list", "timeline"] as ViewMode[]).map(
                  (mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.viewModeButton,
                        viewMode === mode && styles.viewModeButtonActive,
                      ]}
                      onPress={() => setViewMode(mode)}
                    >
                      <Ionicons
                        name={
                          mode === "calendar"
                            ? "grid"
                            : mode === "list"
                            ? "list"
                            : "time"
                        }
                        size={20}
                        color={viewMode === mode ? "#ffffff" : "#64748b"}
                      />
                    </TouchableOpacity>
                  )
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
          )}

          {/* Main Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {calendarMode === "year" ? (
              renderYearView()
            ) : (
              <>
                {viewMode === "calendar" && renderCalendarGrid()}

                {viewMode === "timeline" && renderTimelineView()}

                {viewMode === "list" && (
                  <View style={styles.listContainer}>
                    {filteredShowers
                      .filter((shower) => {
                        if (calendarMode === "month") {
                          const showerDate = new Date(shower.peak.date);
                          const showerMonth = showerDate.getMonth();
                          const showerYear = showerDate.getFullYear();
                          return (
                            showerMonth === currentMonth &&
                            showerYear === currentYear
                          );
                        }
                        return true;
                      })
                      .map((shower) => renderShowerCard(shower))}
                  </View>
                )}

                {/* Selected Date Details */}
                {viewMode === "calendar" && selectedDateShowers.length > 0 && (
                  <View style={styles.selectedDateSection}>
                    <ThemedText style={styles.selectedDateTitle}>
                      {selectedDate.toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </ThemedText>
                    {selectedDateShowers.map((shower) =>
                      renderShowerCard(shower, false)
                    )}
                  </View>
                )}
              </>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
    width: "100%",
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  searchContainer: {
    overflow: "hidden",
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  navigationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeSelector: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: "#667eea",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Calendar Grid Styles
  calendarGrid: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 1,
  },
  dayHeader: {
    flex: 1,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 1,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  calendarDay: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    position: "relative",
    marginHorizontal: 1,
    marginVertical: 1,
  },
  calendarDayToday: {
    backgroundColor: "#ddd6fe",
    borderWidth: 2,
    borderColor: "#8b5cf6",
  },
  calendarDaySelected: {
    backgroundColor: "#667eea",
  },
  calendarDayActive: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1e293b",
  },
  calendarDayTextToday: {
    color: "#8b5cf6",
    fontWeight: "bold",
  },
  calendarDayTextSelected: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  peakIndicator: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  activityIndicator: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f59e0b",
  },
  multipleIndicator: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: "#10b981",
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "bold",
    paddingHorizontal: 2,
    paddingVertical: 0,
    borderRadius: 6,
    minWidth: 12,
    textAlign: "center",
    lineHeight: 12,
  },

  // Year View Styles
  yearView: {
    flex: 1,
    paddingTop: 16,
  },
  yearMonthCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  yearMonthGradient: {
    padding: 20,
  },
  yearMonthName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  yearMonthCount: {
    fontSize: 14,
    marginBottom: 8,
  },
  yearMonthShowers: {
    gap: 4,
  },
  yearMonthShowerName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  yearMonthMore: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontStyle: "italic",
  },

  // Shower Card Styles
  showerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#667eea",
  },
  showerCardActive: {
    borderLeftColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  showerCardPast: {
    opacity: 0.6,
    borderLeftColor: "#9ca3af",
  },
  showerCardHeader: {
    marginBottom: 12,
  },
  showerCardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  showerCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  showerCardTitleActive: {
    color: "#065f46",
  },
  showerCardTitlePast: {
    color: "#6b7280",
  },
  favoriteButton: {
    padding: 4,
  },
  showerCardMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  countdownContainer: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  showerDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: "#1e293b",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#6b7280",
  },
  difficultyEasy: {
    backgroundColor: "#10b981",
  },
  difficultyModerate: {
    backgroundColor: "#f59e0b",
  },
  difficultyDifficult: {
    backgroundColor: "#ef4444",
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },

  // Timeline Styles
  timelineContainer: {
    flex: 1,
    paddingTop: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLine: {
    width: 24,
    alignItems: "center",
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#667eea",
    marginTop: 8,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: "#e2e8f0",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },

  // List View Styles
  listContainer: {
    paddingTop: 16,
  },
  selectedDateSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },

  bottomPadding: {
    height: 100,
  },
});
