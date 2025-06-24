import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { METEOR_SHOWERS_2025, getMeteorShowerById } from "@/data/meteorShowers";
import { MeteorShower, UserLocation } from "@/types/meteorShower";
import { StorageService } from "@/services/StorageService";
import { AstronomyService } from "@/services/AstronomyService";
import { LocationService } from "@/services/LocationService";

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const [favoriteShowers, setFavoriteShowers] = useState<MeteorShower[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
    loadUserLocation();
  }, []);

  const loadFavorites = async () => {
    try {
      const favoriteIds = await StorageService.getFavoriteShowers();
      const showers = favoriteIds
        .map((id) => getMeteorShowerById(id))
        .filter((shower) => shower !== undefined) as MeteorShower[];

      // Sort by peak date
      showers.sort(
        (a, b) =>
          new Date(a.peak.date).getTime() - new Date(b.peak.date).getTime()
      );
      setFavoriteShowers(showers);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLocation = async () => {
    try {
      const location = await StorageService.getUserLocation();
      setUserLocation(location);
    } catch (error) {
      console.error("Error loading user location:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    await loadUserLocation();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (shower: MeteorShower) => {
    Alert.alert(
      "Remove Favorite",
      `Remove ${shower.name} from your favorites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.removeFavoriteShower(shower.id);
              await loadFavorites();
            } catch (error) {
              Alert.alert("Error", "Failed to remove favorite");
            }
          },
        },
      ]
    );
  };

  const handleShowerPress = (shower: MeteorShower) => {
    const today = new Date();
    const peakDate = new Date(shower.peak.date);
    const daysUntilPeak = AstronomyService.getDaysUntilPeak(shower);

    let viewingConditions = "";
    if (userLocation) {
      const conditions = AstronomyService.calculateViewingConditions(
        shower,
        userLocation,
        peakDate
      );
      viewingConditions = `\n\nViewing Conditions: ${Math.round(
        conditions.visibility * 100
      )}%\n${AstronomyService.getViewingRecommendation(conditions, shower)}`;
    }

    Alert.alert(
      shower.name,
      `Peak: ${peakDate.toLocaleDateString()}\nRate: ${
        shower.zhr
      } meteors/hour\nRadiant: ${
        shower.radiant
      }\nDays until peak: ${daysUntilPeak}\n\n${
        shower.description
      }${viewingConditions}`,
      [
        {
          text: "Remove from Favorites",
          style: "destructive",
          onPress: () => handleRemoveFavorite(shower),
        },
        { text: "OK", style: "default" },
      ]
    );
  };

  const addFavorite = () => {
    // Show list of all showers to add
    const availableShowers = METEOR_SHOWERS_2025.filter(
      (shower) => !favoriteShowers.some((fav) => fav.id === shower.id)
    );

    if (availableShowers.length === 0) {
      Alert.alert(
        "All Set!",
        "You have already added all meteor showers to your favorites."
      );
      return;
    }

    const showerOptions = availableShowers.map((shower) => ({
      text: `${shower.name} (${shower.zhr}/hr)`,
      onPress: async () => {
        try {
          await StorageService.addFavoriteShower(shower.id);
          await loadFavorites();
        } catch (error) {
          Alert.alert("Error", "Failed to add favorite");
        }
      },
    }));

    Alert.alert(
      "Add Favorite",
      "Choose a meteor shower to add to your favorites:",
      [...showerOptions, { text: "Cancel", style: "cancel" }]
    );
  };

  const renderShowerCard = (shower: MeteorShower) => {
    const today = new Date();
    const peakDate = new Date(shower.peak.date);
    const daysUntilPeak = AstronomyService.getDaysUntilPeak(shower);
    const isPast = peakDate < today;
    const isActive =
      today >= new Date(shower.active.start) &&
      today <= new Date(shower.active.end);

    return (
      <TouchableOpacity
        key={shower.id}
        style={[
          styles.showerCard,
          isPast && styles.showerCardPast,
          isActive && styles.showerCardActive,
        ]}
        onPress={() => handleShowerPress(shower)}
      >
        <View style={styles.showerHeader}>
          <ThemedText style={[styles.showerName, isPast && styles.textPast]}>
            {shower.name}
          </ThemedText>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(shower)}
          >
            <ThemedText style={styles.removeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.showerDetails}>
          <ThemedText style={[styles.showerInfo, isPast && styles.textPast]}>
            Peak: {peakDate.toLocaleDateString()}
          </ThemedText>
          <ThemedText style={[styles.showerInfo, isPast && styles.textPast]}>
            Rate: {shower.zhr} meteors/hour
          </ThemedText>
          <ThemedText style={[styles.showerInfo, isPast && styles.textPast]}>
            Radiant: {shower.radiant}
          </ThemedText>
        </View>

        <View style={styles.showerFooter}>
          {isActive ? (
            <View style={styles.activeStatus}>
              <ThemedText style={styles.activeStatusText}>
                ACTIVE NOW
              </ThemedText>
            </View>
          ) : isPast ? (
            <ThemedText style={styles.pastStatus}>PAST</ThemedText>
          ) : (
            <ThemedText style={styles.upcomingStatus}>
              {daysUntilPeak} days remaining
            </ThemedText>
          )}

          <View
            style={[
              styles.difficultyBadge,
              shower.difficulty === "easy" && styles.difficultyEasy,
              shower.difficulty === "moderate" && styles.difficultyModerate,
              shower.difficulty === "difficult" && styles.difficultyDifficult,
            ]}
          >
            <ThemedText style={styles.difficultyText}>
              {shower.difficulty.toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.innerContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Favorites</ThemedText>
          </View>
          <ThemedText style={styles.loadingText}>
            Loading favorites...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Favorites</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {favoriteShowers.length} favorite shower
            {favoriteShowers.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {favoriteShowers.length > 0 ? (
            <>
              {favoriteShowers.map((shower) => renderShowerCard(shower))}
              <TouchableOpacity style={styles.addButton} onPress={addFavorite}>
                <ThemedText style={styles.addButtonText}>
                  + Add More Favorites
                </ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateTitle}>
                No Favorites Yet
              </ThemedText>
              <ThemedText style={styles.emptyStateText}>
                Add meteor showers to your favorites to track them easily and
                get personalized notifications.
              </ThemedText>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={addFavorite}
              >
                <ThemedText style={styles.addFirstButtonText}>
                  Add Your First Favorite
                </ThemedText>
              </TouchableOpacity>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
  },
  showerCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  showerCardPast: {
    opacity: 0.6,
    borderLeftColor: "#9ca3af",
  },
  showerCardActive: {
    borderLeftColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  showerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  showerName: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  textPast: {
    opacity: 0.6,
  },
  showerDetails: {
    marginBottom: 12,
  },
  showerInfo: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  showerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeStatus: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeStatusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  pastStatus: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: "500",
  },
  upcomingStatus: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3b82f6",
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
  addButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginVertical: 20,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  addFirstButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFirstButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 100,
  },
});
