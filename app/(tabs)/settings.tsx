import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  SafeAreaView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { NotificationSettings, UserLocation } from "@/types/meteorShower";
import { StorageService, UserEngagement } from "@/services/StorageService";
import { NotificationService } from "@/services/NotificationService";
import { LocationService } from "@/services/LocationService";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(
    null
  );
  const [themePreference, setThemePreference] = useState<
    "light" | "dark" | "auto"
  >("auto");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [notifications, location, engagement, theme] = await Promise.all([
        StorageService.getNotificationSettings(),
        StorageService.getUserLocation(),
        StorageService.getUserEngagement(),
        StorageService.getThemePreference(),
      ]);

      setNotificationSettings(notifications);
      setUserLocation(location);
      setUserEngagement(engagement);
      setThemePreference(theme);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSettings = async (
    updates: Partial<NotificationSettings>
  ) => {
    if (!notificationSettings) return;

    const newSettings = { ...notificationSettings, ...updates };
    try {
      await StorageService.saveNotificationSettings(newSettings);

      if (newSettings.enabled) {
        await NotificationService.scheduleShowerNotifications(newSettings);
      } else {
        await NotificationService.cancelAllNotifications();
      }

      setNotificationSettings(newSettings);
    } catch (error) {
      Alert.alert("Error", "Failed to update notification settings");
    }
  };

  const updateLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        await StorageService.saveUserLocation(location);
        setUserLocation(location);
        Alert.alert("Success", "Location updated successfully");
      } else {
        Alert.alert(
          "Error",
          "Could not get your current location. Please check location permissions."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update location");
    }
  };

  const testNotifications = async () => {
    try {
      await NotificationService.sendTestNotification();
      Alert.alert("Test Sent", "Check your notifications to see if it worked!");
    } catch (error) {
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to send test notification"
      );
    }
  };

  const clearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will remove all your preferences, favorites, and saved data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              await NotificationService.cancelAllNotifications();
              await loadSettings();
              Alert.alert("Success", "All data has been cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  };

  const updateTheme = async (theme: "light" | "dark" | "auto") => {
    try {
      await StorageService.saveThemePreference(theme);
      setThemePreference(theme);
    } catch (error) {
      Alert.alert("Error", "Failed to update theme preference");
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderSettingRow = (
    title: string,
    subtitle: string | null,
    rightComponent: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingInfo}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>
        )}
      </View>
      <View style={styles.settingControl}>{rightComponent}</View>
    </TouchableOpacity>
  );

  if (loading || !notificationSettings) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        </View>
        <ThemedText style={styles.loadingText}>Loading settings...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Customize your experience
          </ThemedText>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Notifications */}
          {renderSection(
            "Notifications",
            <>
              {renderSettingRow(
                "Enable Notifications",
                "Receive alerts for upcoming meteor showers",
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={(value) =>
                    updateNotificationSettings({ enabled: value })
                  }
                  trackColor={{
                    false: "#767577",
                    true: Colors[colorScheme ?? "light"].tint,
                  }}
                />
              )}

              {notificationSettings.enabled && (
                <>
                  {renderSettingRow(
                    "Peak Reminders",
                    "Get notified before shower peaks",
                    <Switch
                      value={notificationSettings.peakReminder}
                      onValueChange={(value) =>
                        updateNotificationSettings({ peakReminder: value })
                      }
                      trackColor={{
                        false: "#767577",
                        true: Colors[colorScheme ?? "light"].tint,
                      }}
                    />
                  )}

                  {renderSettingRow(
                    "Days Before Peak",
                    `Advance notice: ${notificationSettings.daysBefore} days`,
                    <TextInput
                      style={styles.numberInput}
                      value={notificationSettings.daysBefore.toString()}
                      onChangeText={(text) => {
                        const days = parseInt(text) || 1;
                        if (days >= 1 && days <= 30) {
                          updateNotificationSettings({ daysBefore: days });
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  )}

                  {renderSettingRow(
                    "Hours Before Peak",
                    `Final reminder: ${notificationSettings.hoursBeforePeak} hours`,
                    <TextInput
                      style={styles.numberInput}
                      value={notificationSettings.hoursBeforePeak.toString()}
                      onChangeText={(text) => {
                        const hours = parseInt(text) || 1;
                        if (hours >= 1 && hours <= 48) {
                          updateNotificationSettings({
                            hoursBeforePeak: hours,
                          });
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  )}

                  {renderSettingRow(
                    "Minimum Rate Filter",
                    `Only showers with ${notificationSettings.minimumZHR}+ meteors/hour`,
                    <TextInput
                      style={styles.numberInput}
                      value={notificationSettings.minimumZHR.toString()}
                      onChangeText={(text) => {
                        const zhr = parseInt(text) || 1;
                        if (zhr >= 1 && zhr <= 200) {
                          updateNotificationSettings({ minimumZHR: zhr });
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  )}

                  {renderSettingRow(
                    "Test Notifications",
                    "Send a test notification now",
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={testNotifications}
                    >
                      <ThemedText style={styles.testButtonText}>
                        Test
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}

          {/* Location */}
          {renderSection(
            "Location",
            <>
              {renderSettingRow(
                "Current Location",
                userLocation
                  ? `${userLocation.city || "Unknown"}, ${
                      userLocation.country || "Earth"
                    }`
                  : "Location not set",
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={updateLocation}
                >
                  <ThemedText style={styles.updateButtonText}>
                    Update
                  </ThemedText>
                </TouchableOpacity>
              )}

              {userLocation && (
                <View style={styles.locationDetails}>
                  <ThemedText style={styles.locationText}>
                    Latitude: {userLocation.latitude.toFixed(4)}°
                  </ThemedText>
                  <ThemedText style={styles.locationText}>
                    Longitude: {userLocation.longitude.toFixed(4)}°
                  </ThemedText>
                  <ThemedText style={styles.locationText}>
                    Timezone: {userLocation.timezone}
                  </ThemedText>
                </View>
              )}
            </>
          )}

          {/* Appearance */}
          {renderSection(
            "Appearance",
            <>
              {["auto", "light", "dark"].map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeOption,
                    themePreference === theme && styles.themeOptionSelected,
                  ]}
                  onPress={() =>
                    updateTheme(theme as "light" | "dark" | "auto")
                  }
                >
                  <ThemedText
                    style={[
                      styles.themeOptionText,
                      themePreference === theme &&
                        styles.themeOptionTextSelected,
                    ]}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)} Theme
                  </ThemedText>
                  {themePreference === theme && (
                    <ThemedText style={styles.themeOptionCheck}>✓</ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Usage Statistics (for research) */}
          {userEngagement &&
            renderSection(
              "Usage Statistics",
              <>
                <View style={styles.statRow}>
                  <ThemedText style={styles.statLabel}>App Opens:</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {userEngagement.appOpens}
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <ThemedText style={styles.statLabel}>
                    Showers Viewed:
                  </ThemedText>
                  <ThemedText style={styles.statValue}>
                    {userEngagement.showersViewed.length}
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <ThemedText style={styles.statLabel}>
                    Notifications Clicked:
                  </ThemedText>
                  <ThemedText style={styles.statValue}>
                    {userEngagement.notificationInteractions}
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <ThemedText style={styles.statLabel}>Time Spent:</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {Math.round(userEngagement.totalTimeSpent)} min
                  </ThemedText>
                </View>
              </>
            )}

          {/* Data Management */}
          {renderSection(
            "Data Management",
            <>
              {renderSettingRow(
                "Clear All Data",
                "Remove all preferences and favorites",
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={clearAllData}
                >
                  <ThemedText style={styles.dangerButtonText}>Clear</ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* App Info */}
          {renderSection(
            "About",
            <>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Version:</ThemedText>
                <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Data Source:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  International Meteor Organization
                </ThemedText>
              </View>
            </>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    minHeight: 120,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingVertical: 10,
    opacity: 0.8,
  },
  sectionContent: {
    backgroundColor: "#f8f9fa",
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  settingControl: {
    marginLeft: 12,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    textAlign: "center",
    fontSize: 16,
  },
  testButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  updateButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  updateButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  locationDetails: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  themeOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  themeOptionText: {
    fontSize: 16,
  },
  themeOptionTextSelected: {
    fontWeight: "600",
    color: "#3b82f6",
  },
  themeOptionCheck: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "bold",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dangerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  bottomPadding: {
    height: 100,
  },
});
