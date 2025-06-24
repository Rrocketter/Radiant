import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StorageService } from "@/services/StorageService";
import { LocationService } from "@/services/LocationService";
import { NotificationService } from "@/services/NotificationService";

const { width, height } = Dimensions.get("window");

interface OnboardingProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    title: "Welcome to Radiant",
    subtitle: "Your personal meteor shower companion",
    description:
      "Track meteor showers with accurate forecasts, personalized notifications, and optimal viewing conditions for your location.",
    gradient: ["#667eea", "#764ba2"],
    icon: "🌟",
  },
  {
    title: "Location-Based Forecasts",
    subtitle: "Personalized for your area",
    description:
      "Get precise viewing conditions, optimal times, and visibility forecasts based on your exact location and local weather patterns.",
    gradient: ["#f093fb", "#f5576c"],
    icon: "📍",
  },
  {
    title: "Smart Notifications",
    subtitle: "Never miss a shower",
    description:
      "Receive timely alerts before peak meteor shower activity. Customize when and how you want to be notified.",
    gradient: ["#4facfe", "#00f2fe"],
    icon: "🔔",
  },
  {
    title: "Research Participation",
    subtitle: "Help advance astronomy education",
    description:
      "By using Radiant, you're contributing to research on how mobile notifications can increase public engagement with astronomical events.",
    gradient: ["#43e97b", "#38f9d7"],
    icon: "🔬",
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [researchConsent, setResearchConsent] = useState(false);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Set onboarding as completed
      await StorageService.setOnboardingCompleted(true);

      // Update research participation status
      await StorageService.updateUserEngagement({
        researchParticipation: researchConsent,
      });

      // Request location permission
      const location = await LocationService.getCurrentLocation();
      if (location) {
        await StorageService.saveUserLocation(location);
      }

      // Setup default notification settings
      const defaultSettings = {
        enabled: true,
        peakReminder: true,
        daysBefore: 2,
        hoursBeforePeak: 6,
        showMagnitudeFilter: false,
        minimumZHR: 15,
      };
      await StorageService.saveNotificationSettings(defaultSettings);

      // Request notification permissions
      await NotificationService.requestPermissions();
      await NotificationService.scheduleShowerNotifications(defaultSettings);

      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      Alert.alert(
        "Error",
        "There was a problem setting up the app. You can adjust settings later."
      );
      onComplete();
    }
  };

  const renderStep = (step: (typeof onboardingSteps)[0], index: number) => (
    <View style={styles.stepContainer} key={index}>
      <LinearGradient colors={step.gradient} style={styles.stepGradient}>
        <View style={styles.stepContent}>
          <ThemedText style={styles.stepIcon}>{step.icon}</ThemedText>
          <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
          <ThemedText style={styles.stepSubtitle}>{step.subtitle}</ThemedText>
          <ThemedText style={styles.stepDescription}>
            {step.description}
          </ThemedText>

          {/* Research consent on the last step */}
          {index === onboardingSteps.length - 1 && (
            <View style={styles.consentContainer}>
              <TouchableOpacity
                style={[
                  styles.consentButton,
                  researchConsent && styles.consentButtonSelected,
                ]}
                onPress={() => setResearchConsent(!researchConsent)}
              >
                <View style={styles.consentCheckbox}>
                  {researchConsent && (
                    <ThemedText style={styles.consentCheck}>✓</ThemedText>
                  )}
                </View>
                <ThemedText style={styles.consentText}>
                  I consent to anonymous usage data collection for research
                  purposes
                </ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.consentNote}>
                Your privacy is important. We only collect anonymous usage
                statistics to improve astronomical education. You can change
                this anytime in settings.
              </ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
        contentOffset={{ x: currentStep * width, y: 0 }}
      >
        {onboardingSteps.map(renderStep)}
      </ScrollView>

      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonSecondary]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <ThemedText
            style={[
              styles.navButtonText,
              styles.navButtonTextSecondary,
              currentStep === 0 && styles.navButtonTextDisabled,
            ]}
          >
            Previous
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNext}
        >
          <ThemedText
            style={[styles.navButtonText, styles.navButtonTextPrimary]}
          >
            {currentStep === onboardingSteps.length - 1
              ? "Get Started"
              : "Next"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: width,
    height: height,
  },
  stepGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    alignItems: "center",
    paddingHorizontal: 40,
    maxWidth: width - 80,
  },
  stepIcon: {
    fontSize: 80,
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 18,
    color: "#ffffff",
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 24,
  },
  consentContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  consentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    marginBottom: 15,
  },
  consentButtonSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  consentCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  consentCheck: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  consentText: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  consentNote: {
    color: "#ffffff",
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: "#ffffff",
    width: 24,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: 50,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  navButtonPrimary: {
    backgroundColor: "#ffffff",
  },
  navButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  navButtonTextPrimary: {
    color: "#333333",
  },
  navButtonTextSecondary: {
    color: "#ffffff",
  },
  navButtonTextDisabled: {
    opacity: 0.3,
  },
});
