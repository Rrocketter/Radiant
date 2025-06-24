import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
  SafeAreaView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { METEOR_SHOWERS_2025 } from "@/data/meteorShowers";
import { MeteorShower } from "@/types/meteorShower";

const { width } = Dimensions.get("window");
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

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showersByMonth, setShowersByMonth] = useState<{
    [key: number]: MeteorShower[];
  }>({});

  useEffect(() => {
    organizeShowersByMonth();
  }, []);

  const organizeShowersByMonth = () => {
    const organized: { [key: number]: MeteorShower[] } = {};

    METEOR_SHOWERS_2025.forEach((shower) => {
      const peakDate = new Date(shower.peak.date);
      const month = peakDate.getMonth();

      if (!organized[month]) {
        organized[month] = [];
      }
      organized[month].push(shower);
    });

    // Sort showers within each month by peak date
    Object.keys(organized).forEach((month) => {
      organized[parseInt(month)].sort(
        (a, b) =>
          new Date(a.peak.date).getTime() - new Date(b.peak.date).getTime()
      );
    });

    setShowersByMonth(organized);
  };

  const renderMonthButton = (monthIndex: number) => {
    const isSelected = monthIndex === selectedMonth;
    const hasShowers = showersByMonth[monthIndex]?.length > 0;

    return (
      <TouchableOpacity
        key={monthIndex}
        style={[
          styles.monthButton,
          isSelected && {
            backgroundColor: Colors[colorScheme ?? "light"].tint,
          },
          !hasShowers && styles.monthButtonEmpty,
        ]}
        onPress={() => setSelectedMonth(monthIndex)}
      >
        <ThemedText
          style={[
            styles.monthButtonText,
            isSelected && styles.monthButtonTextSelected,
            !hasShowers && styles.monthButtonTextEmpty,
          ]}
        >
          {monthNames[monthIndex].slice(0, 3)}
        </ThemedText>
        {hasShowers && (
          <View
            style={[
              styles.showerCount,
              isSelected && styles.showerCountSelected,
            ]}
          >
            <Text
              style={[
                styles.showerCountText,
                isSelected && styles.showerCountTextSelected,
              ]}
            >
              {showersByMonth[monthIndex].length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderShowerItem = (shower: MeteorShower) => {
    const peakDate = new Date(shower.peak.date);
    const today = new Date();
    const isPast = peakDate < today;
    const isToday = peakDate.toDateString() === today.toDateString();

    return (
      <TouchableOpacity
        key={shower.id}
        style={[
          styles.showerItem,
          isPast && styles.showerItemPast,
          isToday && styles.showerItemToday,
        ]}
      >
        <View style={styles.showerItemHeader}>
          <ThemedText
            style={[styles.showerItemName, isPast && styles.showerItemTextPast]}
          >
            {shower.name}
          </ThemedText>
          <ThemedText
            style={[styles.showerItemZHR, isPast && styles.showerItemTextPast]}
          >
            {shower.zhr}/hr
          </ThemedText>
        </View>

        <View style={styles.showerItemDetails}>
          <ThemedText
            style={[styles.showerItemDate, isPast && styles.showerItemTextPast]}
          >
            Peak: {peakDate.toLocaleDateString()}
            {shower.peak.time && ` at ${shower.peak.time}`}
          </ThemedText>
          <ThemedText
            style={[
              styles.showerItemRadiant,
              isPast && styles.showerItemTextPast,
            ]}
          >
            Radiant: {shower.radiant}
          </ThemedText>
        </View>

        <View style={styles.showerItemFooter}>
          <ThemedText
            style={[
              styles.showerItemDuration,
              isPast && styles.showerItemTextPast,
            ]}
          >
            Active: {new Date(shower.active.start).toLocaleDateString()} -{" "}
            {new Date(shower.active.end).toLocaleDateString()}
          </ThemedText>
          <View
            style={[
              styles.difficultyBadge,
              shower.difficulty === "easy" && styles.difficultyEasy,
              shower.difficulty === "moderate" && styles.difficultyModerate,
              shower.difficulty === "difficult" && styles.difficultyDifficult,
            ]}
          >
            <Text style={styles.difficultyText}>
              {shower.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        {isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>PEAKS TODAY</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedMonthShowers = showersByMonth[selectedMonth] || [];

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Meteor Calendar</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            2025 Annual Shower Schedule
          </ThemedText>
        </View>

        {/* Month Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.monthSelector}
          contentContainerStyle={styles.monthSelectorContent}
        >
          {monthNames.map((_, index) => renderMonthButton(index))}
        </ScrollView>

        {/* Selected Month Display */}
        <View style={styles.selectedMonthHeader}>
          <ThemedText style={styles.selectedMonthTitle}>
            {monthNames[selectedMonth]} 2025
          </ThemedText>
          <ThemedText style={styles.selectedMonthSubtitle}>
            {selectedMonthShowers.length} meteor shower
            {selectedMonthShowers.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        {/* Shower List */}
        <ScrollView style={styles.showerList}>
          {selectedMonthShowers.length > 0 ? (
            selectedMonthShowers.map((shower) => renderShowerItem(shower))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No meteor showers peak in {monthNames[selectedMonth]}
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Try selecting a different month to see upcoming showers
              </ThemedText>
            </View>
          )}
          <View style={styles.bottomPadding} />
        </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  monthSelector: {
    maxHeight: 80,
  },
  monthSelectorContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  monthButton: {
    minWidth: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  monthButtonEmpty: {
    opacity: 0.3,
  },
  monthButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  monthButtonTextSelected: {
    color: "#ffffff",
  },
  monthButtonTextEmpty: {
    opacity: 0.5,
  },
  showerCount: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ff4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  showerCountSelected: {
    backgroundColor: "#ffffff",
  },
  showerCountText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  showerCountTextSelected: {
    color: "#ff4444",
  },
  selectedMonthHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  selectedMonthTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  selectedMonthSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  showerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  showerItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  showerItemPast: {
    opacity: 0.6,
    borderLeftColor: "#9ca3af",
  },
  showerItemToday: {
    borderLeftColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  showerItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  showerItemName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  showerItemZHR: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  showerItemTextPast: {
    opacity: 0.6,
  },
  showerItemDetails: {
    marginBottom: 8,
  },
  showerItemDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  showerItemRadiant: {
    fontSize: 14,
    opacity: 0.7,
  },
  showerItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  showerItemDuration: {
    fontSize: 12,
    opacity: 0.6,
    flex: 1,
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
  todayBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  bottomPadding: {
    height: 100,
  },
});
