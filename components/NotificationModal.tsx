import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { NotificationSettings } from "@/types/meteorShower";
import { NotificationService } from "@/services/NotificationService";
import { StorageService } from "@/services/StorageService";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentSettings?: NotificationSettings;
}

export function NotificationModal({
  visible,
  onClose,
  onSuccess,
  currentSettings,
}: NotificationModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>(
    currentSettings || {
      enabled: true,
      peakReminder: true,
      daysBefore: 7,
      hoursBeforePeak: 2,
      showMagnitudeFilter: true,
      minimumZHR: 25,
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const hasPermission = await NotificationService.requestPermissions();

      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in Settings to receive meteor shower alerts.",
          [{ text: "OK" }]
        );
        setSaving(false);
        return;
      }

      if (settings.enabled) {
        await NotificationService.scheduleShowerNotifications(settings);
      }

      await StorageService.saveNotificationSettings(settings);

      Alert.alert(
        "Settings Saved",
        settings.enabled
          ? `You'll receive alerts for meteor showers with ${settings.minimumZHR}+ meteors per hour.`
          : "Notifications have been disabled.",
        [
          {
            text: "OK",
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  const zhrOptions = [10, 25, 50, 75, 100];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f4c75"]}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Notification Settings</ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={saving}
          >
            <ThemedText style={styles.saveText}>
              {saving ? "Saving..." : "Save"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Enable Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>
                Enable Notifications
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                Receive alerts for upcoming meteor showers
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) =>
                setSettings({ ...settings, enabled: value })
              }
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.enabled ? "#f5dd4b" : "#f4f3f4"}
            />
          </View>

          {settings.enabled && (
            <>
              {/* Peak Reminders */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <ThemedText style={styles.settingLabel}>
                    Peak Reminders
                  </ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Get notified when showers reach peak activity
                  </ThemedText>
                </View>
                <Switch
                  value={settings.peakReminder}
                  onValueChange={(value) =>
                    setSettings({ ...settings, peakReminder: value })
                  }
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={settings.peakReminder ? "#f5dd4b" : "#f4f3f4"}
                />
              </View>

              {/* Minimum ZHR */}
              <View style={styles.settingSection}>
                <ThemedText style={styles.settingLabel}>
                  Minimum Shower Intensity
                </ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Only show showers with at least this many meteors per hour
                </ThemedText>
                <View style={styles.optionGrid}>
                  {zhrOptions.map((zhr) => (
                    <TouchableOpacity
                      key={zhr}
                      style={[
                        styles.optionButton,
                        settings.minimumZHR === zhr && styles.selectedOption,
                      ]}
                      onPress={() =>
                        setSettings({ ...settings, minimumZHR: zhr })
                      }
                    >
                      <ThemedText
                        style={[
                          styles.optionText,
                          settings.minimumZHR === zhr &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {zhr}+
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Advanced Settings */}
              <View style={styles.settingSection}>
                <ThemedText style={styles.settingLabel}>Advanced</ThemedText>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <ThemedText style={styles.settingSubLabel}>
                      Show Magnitude Filter
                    </ThemedText>
                    <ThemedText style={styles.settingDescription}>
                      Include brightness information in notifications
                    </ThemedText>
                  </View>
                  <Switch
                    value={settings.showMagnitudeFilter}
                    onValueChange={(value) =>
                      setSettings({ ...settings, showMagnitudeFilter: value })
                    }
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={
                      settings.showMagnitudeFilter ? "#f5dd4b" : "#f4f3f4"
                    }
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#81b0ff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  settingSubLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  selectedOption: {
    backgroundColor: "#81b0ff",
    borderColor: "#81b0ff",
  },
  optionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});
