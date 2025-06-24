import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  Text,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Observation, ObservationStats } from "@/types/observation";
import { ObservationService } from "@/services/ObservationService";
import { MeteorShower } from "@/types/meteorShower";
import { METEOR_SHOWERS_2025, getMeteorShowerById } from "@/data/meteorShowers";

export default function ObservationLogScreen() {
  const colorScheme = useColorScheme();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [stats, setStats] = useState<ObservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedObservation, setSelectedObservation] =
    useState<Observation | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [observationsData, statsData] = await Promise.all([
        ObservationService.getObservations(),
        ObservationService.getStats(),
      ]);

      // Sort observations by date (newest first)
      observationsData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setObservations(observationsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading observation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddObservation = () => {
    setSelectedObservation(null);
    setShowAddModal(true);
  };

  const handleEditObservation = (observation: Observation) => {
    setSelectedObservation(observation);
    setShowAddModal(true);
  };

  const handleDeleteObservation = (observation: Observation) => {
    Alert.alert(
      "Delete Observation",
      `Are you sure you want to delete this observation from ${observation.date}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ObservationService.deleteObservation(observation.id);
              await loadData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete observation");
            }
          },
        },
      ]
    );
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <ThemedText style={styles.statsTitle}>
          Your Observation Stats
        </ThemedText>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {stats.totalObservations}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Sessions</ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {stats.totalMeteors}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Meteors Seen</ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {stats.totalHours.toFixed(1)}h
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Time</ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              ⭐ {stats.averageRating.toFixed(1)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Avg Rating</ThemedText>
          </View>
        </View>

        {stats.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <ThemedText style={styles.streakText}>
              🔥 {stats.currentStreak} session streak!
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  const renderObservationCard = (observation: Observation) => {
    const shower = getMeteorShowerById(observation.showerId);
    const date = new Date(observation.date);
    const startTime = new Date(`${observation.date}T${observation.startTime}`);
    const endTime = new Date(`${observation.date}T${observation.endTime}`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes

    return (
      <TouchableOpacity
        key={observation.id}
        style={styles.observationCard}
        onPress={() => handleEditObservation(observation)}
      >
        <View style={styles.observationHeader}>
          <View style={styles.observationTitleSection}>
            <ThemedText style={styles.observationTitle}>
              {observation.showerName}
            </ThemedText>
            <ThemedText style={styles.observationDate}>
              {date.toLocaleDateString()} • {Math.round(duration)}min
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteObservation(observation)}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.observationStats}>
          <View style={styles.observationStatItem}>
            <ThemedText style={styles.observationStatNumber}>
              {observation.observations.meteorsCount}
            </ThemedText>
            <ThemedText style={styles.observationStatLabel}>Meteors</ThemedText>
          </View>

          {observation.observations.fireballs > 0 && (
            <View style={styles.observationStatItem}>
              <ThemedText style={styles.observationStatNumber}>
                {observation.observations.fireballs}
              </ThemedText>
              <ThemedText style={styles.observationStatLabel}>
                Fireballs
              </ThemedText>
            </View>
          )}

          <View style={styles.observationStatItem}>
            <ThemedText style={styles.observationStatNumber}>
              {"⭐".repeat(observation.rating)}
            </ThemedText>
            <ThemedText style={styles.observationStatLabel}>Rating</ThemedText>
          </View>
        </View>

        <View style={styles.observationConditions}>
          <ThemedText style={styles.conditionItem}>
            Sky:{" "}
            {
              ["Poor", "Fair", "Good", "Very Good", "Excellent"][
                observation.conditions.skyClarity - 1
              ]
            }
          </ThemedText>
          <ThemedText style={styles.conditionItem}>
            Weather: {observation.conditions.weather.replace("_", " ")}
          </ThemedText>
        </View>

        {observation.notes && (
          <ThemedText style={styles.observationNotes} numberOfLines={2}>
            "{observation.notes}"
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.innerContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Observation Log</ThemedText>
          </View>
          <ThemedText style={styles.loadingText}>
            Loading observations...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Observation Log</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Track your meteor shower experiences
          </ThemedText>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderStatsCard()}

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              Recent Observations
            </ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddObservation}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {observations.length > 0 ? (
            observations.map((observation) =>
              renderObservationCard(observation)
            )
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateTitle}>
                Start Your Journey
              </ThemedText>
              <ThemedText style={styles.emptyStateText}>
                Record your first meteor shower observation to begin tracking
                your astronomical adventures!
              </ThemedText>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={handleAddObservation}
              >
                <Text style={styles.addFirstButtonText}>
                  Record First Observation
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {showAddModal && (
          <AddObservationModal
            visible={showAddModal}
            observation={selectedObservation}
            onClose={() => setShowAddModal(false)}
            onSave={loadData}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

// Add Observation Modal Component
const AddObservationModal = ({
  visible,
  observation,
  onClose,
  onSave,
}: {
  visible: boolean;
  observation: Observation | null;
  onClose: () => void;
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<Observation>>({
    showerId: "",
    showerName: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "21:00",
    endTime: "23:00",
    conditions: {
      skyClarity: 3,
      lightPollution: 3,
      weather: "clear",
    },
    observations: {
      meteorsCount: 0,
      fireballs: 0,
      colorsSeen: [],
    },
    notes: "",
    rating: 3,
  });

  useEffect(() => {
    if (observation) {
      setFormData(observation);
    }
  }, [observation]);

  const handleSave = async () => {
    try {
      const observationData: Observation = {
        id: observation?.id || ObservationService.generateObservationId(),
        showerId: formData.showerId!,
        showerName: formData.showerName!,
        date: formData.date!,
        startTime: formData.startTime!,
        endTime: formData.endTime!,
        location: formData.location || {
          latitude: 0,
          longitude: 0,
          city: "Unknown",
          country: "Unknown",
        },
        conditions: formData.conditions!,
        observations: formData.observations!,
        notes: formData.notes!,
        rating: formData.rating!,
        createdAt: observation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await ObservationService.saveObservation(observationData);
      onSave();
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save observation");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>
            {observation ? "Edit" : "Add"} Observation
          </ThemedText>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Shower Selection */}
          <View style={styles.formSection}>
            <ThemedText style={styles.formLabel}>Meteor Shower</ThemedText>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  "Select Shower",
                  "Choose the meteor shower you observed:",
                  METEOR_SHOWERS_2025.map((shower) => ({
                    text: shower.name,
                    onPress: () => {
                      setFormData((prev) => ({
                        ...prev,
                        showerId: shower.id,
                        showerName: shower.name,
                      }));
                    },
                  })).concat([{ text: "Cancel", style: "cancel" }])
                );
              }}
            >
              <Text style={styles.pickerButtonText}>
                {formData.showerName || "Select Shower"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date and Time */}
          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1 }]}>
              <ThemedText style={styles.formLabel}>Date</ThemedText>
              <TextInput
                style={styles.formInput}
                value={formData.date}
                onChangeText={(date) =>
                  setFormData((prev) => ({ ...prev, date }))
                }
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1, marginRight: 10 }]}>
              <ThemedText style={styles.formLabel}>Start Time</ThemedText>
              <TextInput
                style={styles.formInput}
                value={formData.startTime}
                onChangeText={(startTime) =>
                  setFormData((prev) => ({ ...prev, startTime }))
                }
                placeholder="HH:MM"
              />
            </View>
            <View style={[styles.formSection, { flex: 1, marginLeft: 10 }]}>
              <ThemedText style={styles.formLabel}>End Time</ThemedText>
              <TextInput
                style={styles.formInput}
                value={formData.endTime}
                onChangeText={(endTime) =>
                  setFormData((prev) => ({ ...prev, endTime }))
                }
                placeholder="HH:MM"
              />
            </View>
          </View>

          {/* Observations */}
          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1, marginRight: 10 }]}>
              <ThemedText style={styles.formLabel}>Meteors Seen</ThemedText>
              <TextInput
                style={styles.formInput}
                value={formData.observations?.meteorsCount?.toString() || ""}
                onChangeText={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    observations: {
                      ...prev.observations!,
                      meteorsCount: parseInt(value) || 0,
                    },
                  }))
                }
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={[styles.formSection, { flex: 1, marginLeft: 10 }]}>
              <ThemedText style={styles.formLabel}>Fireballs</ThemedText>
              <TextInput
                style={styles.formInput}
                value={formData.observations?.fireballs?.toString() || ""}
                onChangeText={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    observations: {
                      ...prev.observations!,
                      fireballs: parseInt(value) || 0,
                    },
                  }))
                }
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          {/* Sky Conditions */}
          <View style={styles.formSection}>
            <ThemedText style={styles.formLabel}>
              Sky Clarity:{" "}
              {
                ["Poor", "Fair", "Good", "Very Good", "Excellent"][
                  formData.conditions?.skyClarity! - 1
                ]
              }
            </ThemedText>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    formData.conditions?.skyClarity === rating &&
                      styles.ratingButtonActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions!,
                        skyClarity: rating as 1 | 2 | 3 | 4 | 5,
                      },
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      formData.conditions?.skyClarity === rating &&
                        styles.ratingButtonTextActive,
                    ]}
                  >
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Overall Rating */}
          <View style={styles.formSection}>
            <ThemedText style={styles.formLabel}>Overall Rating</ThemedText>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    formData.rating === rating && styles.ratingButtonActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      rating: rating as 1 | 2 | 3 | 4 | 5,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      formData.rating === rating &&
                        styles.ratingButtonTextActive,
                    ]}
                  >
                    ⭐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formSection}>
            <ThemedText style={styles.formLabel}>Notes</ThemedText>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={formData.notes}
              onChangeText={(notes) =>
                setFormData((prev) => ({ ...prev, notes }))
              }
              placeholder="Describe your experience, notable meteors, conditions..."
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
    paddingHorizontal: 20,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
  },
  statsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  streakBadge: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  streakText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  observationCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  observationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  observationTitleSection: {
    flex: 1,
  },
  observationTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  observationDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  observationStats: {
    flexDirection: "row",
    marginBottom: 12,
  },
  observationStatItem: {
    alignItems: "center",
    marginRight: 20,
  },
  observationStatNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  observationStatLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  observationConditions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  conditionItem: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 15,
  },
  observationNotes: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCancelButton: {
    color: "#6b7280",
    fontSize: 16,
  },
  modalSaveButton: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  formTextArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#374151",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingButton: {
    width: 50,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingButtonActive: {
    backgroundColor: "#3b82f6",
  },
  ratingButtonText: {
    fontSize: 16,
    color: "#6b7280",
  },
  ratingButtonTextActive: {
    color: "#ffffff",
  },
});
