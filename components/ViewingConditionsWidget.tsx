import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";

interface ViewingConditionsWidgetProps {
  userLocation?: { latitude: number; longitude: number } | null;
  onPress?: () => void;
}

export function ViewingConditionsWidget({
  userLocation,
  onPress,
}: ViewingConditionsWidgetProps) {
  const [conditions, setConditions] = useState({
    visibility: "Good",
    moonPhase: "New Moon",
    cloudCover: "Clear",
    lightPollution: "Moderate",
    score: 8.5,
  });

  useEffect(() => {
    // Simulate fetching weather/astronomy data
    // In a real app, this would fetch from weather APIs
    const hour = new Date().getHours();
    let visibility = "Poor";
    let score = 3;

    if (hour >= 22 || hour <= 5) {
      visibility = "Excellent";
      score = 9;
    } else if (hour >= 20 || hour <= 6) {
      visibility = "Good";
      score = 7;
    } else if (hour >= 18 || hour <= 8) {
      visibility = "Fair";
      score = 5;
    }

    // Simulate moon phase calculation
    const moonPhases = [
      "New Moon",
      "Waxing Crescent",
      "First Quarter",
      "Waxing Gibbous",
      "Full Moon",
      "Waning Gibbous",
      "Last Quarter",
      "Waning Crescent",
    ];
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const moonPhase = moonPhases[Math.floor((dayOfYear / 29.5) % 8)];

    // Adjust score based on moon phase
    if (
      moonPhase === "New Moon" ||
      moonPhase === "Waning Crescent" ||
      moonPhase === "Waxing Crescent"
    ) {
      score += 1;
    } else if (moonPhase === "Full Moon") {
      score -= 2;
    }

    setConditions({
      visibility,
      moonPhase,
      cloudCover: Math.random() > 0.3 ? "Clear" : "Partly Cloudy",
      lightPollution: userLocation ? "Low" : "Unknown",
      score: Math.min(10, Math.max(1, score + Math.random() * 2 - 1)),
    });
  }, [userLocation]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return ["#10b981", "#059669"];
    if (score >= 6) return ["#f59e0b", "#d97706"];
    return ["#ef4444", "#dc2626"];
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return "checkmark-circle";
    if (score >= 6) return "warning";
    return "close-circle";
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={getScoreColor(conditions.score)}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="eye-outline" size={20} color="#ffffff" />
            <ThemedText style={styles.title}>Viewing Conditions</ThemedText>
          </View>
          <View style={styles.scoreContainer}>
            <Ionicons
              name={getScoreIcon(conditions.score)}
              size={20}
              color="#ffffff"
            />
            <ThemedText style={styles.score}>
              {conditions.score.toFixed(1)}/10
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.conditionRow}>
            <View style={styles.conditionItem}>
              <Ionicons name="eye" size={16} color="rgba(255, 255, 255, 0.8)" />
              <ThemedText style={styles.conditionLabel}>Visibility</ThemedText>
              <ThemedText style={styles.conditionValue}>
                {conditions.visibility}
              </ThemedText>
            </View>
            <View style={styles.conditionItem}>
              <Ionicons
                name="moon"
                size={16}
                color="rgba(255, 255, 255, 0.8)"
              />
              <ThemedText style={styles.conditionLabel}>Moon</ThemedText>
              <ThemedText style={styles.conditionValue}>
                {conditions.moonPhase}
              </ThemedText>
            </View>
          </View>

          <View style={styles.conditionRow}>
            <View style={styles.conditionItem}>
              <Ionicons
                name="cloud"
                size={16}
                color="rgba(255, 255, 255, 0.8)"
              />
              <ThemedText style={styles.conditionLabel}>Sky</ThemedText>
              <ThemedText style={styles.conditionValue}>
                {conditions.cloudCover}
              </ThemedText>
            </View>
            <View style={styles.conditionItem}>
              <Ionicons
                name="bulb"
                size={16}
                color="rgba(255, 255, 255, 0.8)"
              />
              <ThemedText style={styles.conditionLabel}>
                Light Pollution
              </ThemedText>
              <ThemedText style={styles.conditionValue}>
                {conditions.lightPollution}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            {conditions.score >= 8 && "Perfect for meteor watching! 🌟"}
            {conditions.score >= 6 &&
              conditions.score < 8 &&
              "Good conditions tonight 👍"}
            {conditions.score < 6 && "Not ideal, but meteors still visible 🌙"}
          </ThemedText>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  score: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    gap: 8,
  },
  conditionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  conditionItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  conditionLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  conditionValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontStyle: "italic",
  },
});
