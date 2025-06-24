import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  SafeAreaView,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NotificationModal } from "@/components/NotificationModal";
import { ViewingConditionsWidget } from "@/components/ViewingConditionsWidget";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  METEOR_SHOWERS_2025,
  getActiveMeteorShowers,
  getUpcomingMeteorShowers,
} from "@/data/meteorShowers";
import {
  MeteorShower,
  UserLocation,
  ViewingConditions,
  NotificationSettings,
} from "@/types/meteorShower";
import { LocationService } from "@/services/LocationService";
import { AstronomyService } from "@/services/AstronomyService";
import { StorageService } from "@/services/StorageService";
import { NotificationService } from "@/services/NotificationService";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [upcomingShowers, setUpcomingShowers] = useState<MeteorShower[]>([]);
  const [activeShowers, setActiveShowers] = useState<MeteorShower[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotificationSettings, setCurrentNotificationSettings] =
    useState<NotificationSettings | undefined>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeApp();
    StorageService.recordAppOpen();

    // Start fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const initializeApp = async () => {
    try {
      // Load saved location or get current location
      let location = await StorageService.getUserLocation();
      if (!location) {
        location = await LocationService.getCurrentLocation();
        if (location) {
          await StorageService.saveUserLocation(location);
        }
      }
      setUserLocation(location);

      // Setup notifications
      NotificationService.setupNotificationListener();

      // Load meteor shower data
      updateMeteorShowerData();
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMeteorShowerData = () => {
    const today = new Date();
    const active = getActiveMeteorShowers(today);
    const upcoming = getUpcomingMeteorShowers(60); // Next 60 days

    setActiveShowers(active);
    setUpcomingShowers(upcoming.slice(0, 5)); // Show top 5 upcoming
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh location
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        await StorageService.saveUserLocation(location);
      }
      updateMeteorShowerData();
    } catch (error) {
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleShowerPress = async (shower: MeteorShower) => {
    await StorageService.recordShowerViewed(shower.id);

    Alert.alert(
      shower.name,
      `Peak: ${shower.peak.date}\nRate: ${shower.zhr} meteors/hour\n\n${shower.description}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add to Favorites",
          onPress: async () => {
            try {
              await StorageService.addFavoriteShower(shower.id);
              Alert.alert(
                "Added",
                `${shower.name} has been added to your favorites!`
              );
            } catch (error) {
              Alert.alert("Error", "Failed to add to favorites");
            }
          },
        },
        {
          text: "View Details",
          onPress: () => console.log("Navigate to details"),
        },
      ]
    );
  };

  const checkNotificationStatus = async () => {
    try {
      const settings = await StorageService.getNotificationSettings();
      setNotificationsEnabled(settings?.enabled || false);
      setCurrentNotificationSettings(settings);
    } catch (error) {
      console.error("Error checking notification status:", error);
    }
  };

  const handleViewCalendar = () => {
    // For now, we'll show an alert with navigation hint
    // In a real app, you'd use proper navigation
    Alert.alert("Navigate to Calendar", "Opening calendar view...", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Go",
        onPress: () => {
          // This would normally be: router.push('/calendar')
          console.log("Navigate to calendar tab");
        },
      },
    ]);
  };

  const handleSetNotifications = async () => {
    setShowNotificationModal(true);
  };

  const handleNotificationSuccess = () => {
    checkNotificationStatus();
  };

  const setupNotifications = async (minimumZHR: number) => {
    try {
      const settings = {
        enabled: true,
        peakReminder: true,
        daysBefore: 7,
        hoursBeforePeak: 2,
        showMagnitudeFilter: true,
        minimumZHR,
      };

      await NotificationService.scheduleShowerNotifications(settings);
      await StorageService.saveNotificationSettings(settings);
      setNotificationsEnabled(true);

      Alert.alert(
        "Notifications Enabled",
        `You'll receive alerts for meteor showers with ${minimumZHR}+ meteors per hour.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to setup notifications");
    }
  };

  const getViewingConditions = () => {
    if (!userLocation) return "Unknown";

    const hour = currentTime.getHours();
    if (hour >= 22 || hour <= 5) {
      return "Excellent - Dark hours";
    } else if (hour >= 20 || hour <= 6) {
      return "Good - Twilight";
    }
    return "Poor - Daylight";
  };

  const getTonightsBest = (): MeteorShower | null => {
    const tonight = new Date();
    tonight.setHours(0, 0, 0, 0);

    return (
      activeShowers.find((shower) => {
        const peakDate = new Date(shower.peak.date);
        const diffDays = Math.abs(
          (peakDate.getTime() - tonight.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 2; // Show if within 2 days of peak
      }) || null
    );
  };

  const getNextMajorShower = (): MeteorShower | null => {
    const today = new Date();
    return (
      METEOR_SHOWERS_2025.find((shower) => {
        const peakDate = new Date(shower.peak.date);
        return peakDate > today && shower.zhr >= 50;
      }) || null
    );
  };

  const renderShowerCard = (
    shower: MeteorShower,
    isActive: boolean = false
  ) => {
    const daysUntilPeak = AstronomyService.getDaysUntilPeak(shower);
    const cardColor = isActive
      ? Colors[colorScheme ?? "light"].tint
      : Colors[colorScheme ?? "light"].background;

    return (
      <TouchableOpacity
        key={shower.id}
        style={[
          styles.showerCard,
          { backgroundColor: cardColor },
          isActive && styles.activeShowerCard,
        ]}
        onPress={() => handleShowerPress(shower)}
        activeOpacity={0.8}
      >
        {isActive && (
          <View style={styles.activeIndicator}>
            <View style={styles.pulseDot} />
          </View>
        )}
        <View style={styles.showerHeader}>
          <ThemedText
            style={[styles.showerName, isActive && { color: "#ffffff" }]}
          >
            {shower.name}
          </ThemedText>
          <ThemedText
            style={[
              styles.showerZHR,
              isActive && { color: "rgba(255, 255, 255, 0.9)" },
            ]}
          >
            {shower.zhr}/hr
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.showerRadiant,
            isActive && { color: "rgba(255, 255, 255, 0.8)" },
          ]}
        >
          Radiant: {shower.radiant}
        </ThemedText>
        <ThemedText
          style={[
            styles.showerDate,
            isActive && { color: "rgba(255, 255, 255, 0.9)" },
          ]}
        >
          Peak: {new Date(shower.peak.date).toLocaleDateString()}
        </ThemedText>
        {isActive ? (
          <ThemedText style={styles.activeLabel}>🔥 ACTIVE NOW</ThemedText>
        ) : (
          <ThemedText style={styles.daysUntil}>
            {daysUntilPeak > 0 ? `${daysUntilPeak} days` : "Today"}
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  const nextMajor = getNextMajorShower();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.innerContainer}>
          <ThemedText style={styles.loadingText}>
            Loading meteor shower data...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ThemedView style={styles.innerContainer}>
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Enhanced Header */}
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f4c75"]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>Radiant</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {userLocation
                  ? `${userLocation.city || "Unknown"}, ${
                      userLocation.country || "Earth"
                    }`
                  : "Location Unknown"}
              </ThemedText>
              <View style={styles.timeInfo}>
                <Ionicons name="time-outline" size={16} color="#ffffff" />
                <ThemedText style={styles.timeText}>
                  {currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </ThemedText>
              </View>
            </View>
          </LinearGradient>

          {/* Viewing Conditions Card */}
          <View style={styles.section}>
            <ViewingConditionsWidget
              userLocation={userLocation}
              onPress={() =>
                Alert.alert(
                  "Viewing Conditions",
                  "Detailed weather and astronomical conditions for meteor observation. This would normally show real-time data from weather APIs.",
                  [{ text: "OK" }]
                )
              }
            />
          </View>

          {/* Next Major Shower */}
          {nextMajor && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                🌟 Next Major Shower
              </ThemedText>
              <TouchableOpacity
                style={styles.majorShowerCard}
                onPress={() => handleShowerPress(nextMajor)}
              >
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E53"]}
                  style={styles.majorShowerGradient}
                >
                  <View style={styles.majorShowerHeader}>
                    <ThemedText style={styles.majorShowerName}>
                      {nextMajor.name}
                    </ThemedText>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color="#ffffff"
                    />
                  </View>
                  <ThemedText style={styles.majorShowerDetails}>
                    {AstronomyService.getDaysUntilPeak(nextMajor)} days •{" "}
                    {nextMajor.zhr} meteors/hour
                  </ThemedText>
                  <ThemedText style={styles.majorShowerDescription}>
                    {nextMajor.description.split(".")[0]}.
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Showers */}
          {activeShowers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  🔥 Active Now
                </ThemedText>
                <View style={styles.liveBadge}>
                  <View style={styles.liveIndicator} />
                  <ThemedText style={styles.liveText}>LIVE</ThemedText>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activeShowers.map((shower) => renderShowerCard(shower, true))}
              </ScrollView>
            </View>
          )}

          {/* Upcoming Showers */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              📅 Upcoming This Month
            </ThemedText>
            {upcomingShowers
              .slice(0, 3)
              .map((shower) => renderShowerCard(shower))}
            {upcomingShowers.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={handleViewCalendar}
              >
                <ThemedText style={styles.viewMoreText}>
                  View {upcomingShowers.length - 3} more in calendar
                </ThemedText>
                <Ionicons name="arrow-forward" size={16} color="#667eea" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              ⚡ Quick Actions
            </ThemedText>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={handleViewCalendar}
              >
                <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                <ThemedText style={styles.actionButtonText}>
                  View Calendar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  notificationsEnabled
                    ? styles.enabledAction
                    : styles.secondaryAction,
                ]}
                onPress={handleSetNotifications}
              >
                <Ionicons
                  name={
                    notificationsEnabled
                      ? "notifications"
                      : "notifications-outline"
                  }
                  size={20}
                  color="#ffffff"
                />
                <ThemedText style={styles.actionButtonText}>
                  {notificationsEnabled ? "Notifications On" : "Setup Alerts"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fun Stats */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>📊 This Year</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>
                  {METEOR_SHOWERS_2025.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Total Showers</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>
                  {METEOR_SHOWERS_2025.filter((s) => s.zhr >= 50).length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Major Events</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>
                  {activeShowers.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Active Now</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </Animated.ScrollView>
      </ThemedView>

      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSuccess={handleNotificationSuccess}
        currentSettings={currentNotificationSettings}
      />
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
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    minHeight: 120,
  },
  headerContent: {
    alignItems: "center",
    width: "100%",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 38,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  section: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  majorShowerCard: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 10,
  },
  majorShowerGradient: {
    padding: 20,
  },
  majorShowerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  majorShowerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  majorShowerDetails: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
    marginBottom: 10,
  },
  majorShowerDescription: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.8,
  },
  showerCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    marginBottom: 10,
    width: width * 0.7,
    minWidth: 250,
    position: "relative",
  },
  activeShowerCard: {
    backgroundColor: "#FF6B6B",
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activeIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  showerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  showerName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  showerZHR: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  showerRadiant: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  showerDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  daysUntil: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.6,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: "#667eea",
  },
  secondaryAction: {
    backgroundColor: "#64748b",
  },
  enabledAction: {
    backgroundColor: "#10b981",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  bottomPadding: {
    height: 100,
  },
});
