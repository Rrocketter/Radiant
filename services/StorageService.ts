import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserLocation, NotificationSettings } from "../types/meteorShower";

const STORAGE_KEYS = {
  USER_LOCATION: "@radiant_user_location",
  NOTIFICATION_SETTINGS: "@radiant_notification_settings",
  ONBOARDING_COMPLETED: "@radiant_onboarding_completed",
  FAVORITE_SHOWERS: "@radiant_favorite_showers",
  USER_ENGAGEMENT: "@radiant_user_engagement",
  THEME_PREFERENCE: "@radiant_theme_preference",
} as const;

export interface UserEngagement {
  appOpens: number;
  notificationInteractions: number;
  showersViewed: string[];
  lastActiveDate: string;
  totalTimeSpent: number; // in minutes
  favoriteShowers: string[];
  surveyCompleted: boolean;
  researchParticipation: boolean;
}

export class StorageService {
  // User Location
  static async saveUserLocation(location: UserLocation): Promise<void> {
    try {
      const jsonValue = JSON.stringify(location);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_LOCATION, jsonValue);
    } catch (error) {
      console.error("Error saving user location:", error);
      throw error;
    }
  }

  static async getUserLocation(): Promise<UserLocation | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_LOCATION);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error("Error getting user location:", error);
      return null;
    }
  }

  // Notification Settings
  static async saveNotificationSettings(
    settings: NotificationSettings
  ): Promise<void> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, jsonValue);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      throw error;
    }
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const jsonValue = await AsyncStorage.getItem(
        STORAGE_KEYS.NOTIFICATION_SETTINGS
      );
      if (jsonValue) {
        return JSON.parse(jsonValue);
      }

      // Return default settings
      return {
        enabled: true,
        peakReminder: true,
        daysBefore: 2,
        hoursBeforePeak: 6,
        showMagnitudeFilter: false,
        minimumZHR: 15,
      };
    } catch (error) {
      console.error("Error getting notification settings:", error);
      // Return default settings on error
      return {
        enabled: true,
        peakReminder: true,
        daysBefore: 2,
        hoursBeforePeak: 6,
        showMagnitudeFilter: false,
        minimumZHR: 15,
      };
    }
  }

  // Onboarding
  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        completed.toString()
      );
    } catch (error) {
      console.error("Error setting onboarding status:", error);
      throw error;
    }
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED
      );
      return value === "true";
    } catch (error) {
      console.error("Error getting onboarding status:", error);
      return false;
    }
  }

  // Favorite Showers
  static async addFavoriteShower(showerId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteShowers();
      if (!favorites.includes(showerId)) {
        favorites.push(showerId);
        const jsonValue = JSON.stringify(favorites);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_SHOWERS, jsonValue);
      }
    } catch (error) {
      console.error("Error adding favorite shower:", error);
      throw error;
    }
  }

  static async removeFavoriteShower(showerId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteShowers();
      const updatedFavorites = favorites.filter((id) => id !== showerId);
      const jsonValue = JSON.stringify(updatedFavorites);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_SHOWERS, jsonValue);
    } catch (error) {
      console.error("Error removing favorite shower:", error);
      throw error;
    }
  }

  static async getFavoriteShowers(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(
        STORAGE_KEYS.FAVORITE_SHOWERS
      );
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error("Error getting favorite showers:", error);
      return [];
    }
  }

  static async isFavoriteShower(showerId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteShowers();
      return favorites.includes(showerId);
    } catch (error) {
      console.error("Error checking favorite shower:", error);
      return false;
    }
  }

  // User Engagement (for research purposes)
  static async updateUserEngagement(
    updates: Partial<UserEngagement>
  ): Promise<void> {
    try {
      const currentEngagement = await this.getUserEngagement();
      const updatedEngagement = { ...currentEngagement, ...updates };
      const jsonValue = JSON.stringify(updatedEngagement);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ENGAGEMENT, jsonValue);
    } catch (error) {
      console.error("Error updating user engagement:", error);
      throw error;
    }
  }

  static async getUserEngagement(): Promise<UserEngagement> {
    try {
      const jsonValue = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_ENGAGEMENT
      );
      if (jsonValue) {
        return JSON.parse(jsonValue);
      }

      // Return default engagement data
      return {
        appOpens: 0,
        notificationInteractions: 0,
        showersViewed: [],
        lastActiveDate: new Date().toISOString(),
        totalTimeSpent: 0,
        favoriteShowers: [],
        surveyCompleted: false,
        researchParticipation: false,
      };
    } catch (error) {
      console.error("Error getting user engagement:", error);
      return {
        appOpens: 0,
        notificationInteractions: 0,
        showersViewed: [],
        lastActiveDate: new Date().toISOString(),
        totalTimeSpent: 0,
        favoriteShowers: [],
        surveyCompleted: false,
        researchParticipation: false,
      };
    }
  }

  static async recordAppOpen(): Promise<void> {
    try {
      const engagement = await this.getUserEngagement();
      await this.updateUserEngagement({
        appOpens: engagement.appOpens + 1,
        lastActiveDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording app open:", error);
    }
  }

  static async recordShowerViewed(showerId: string): Promise<void> {
    try {
      const engagement = await this.getUserEngagement();
      const viewedShowers = [...engagement.showersViewed];
      if (!viewedShowers.includes(showerId)) {
        viewedShowers.push(showerId);
      }
      await this.updateUserEngagement({
        showersViewed: viewedShowers,
      });
    } catch (error) {
      console.error("Error recording shower viewed:", error);
    }
  }

  static async recordNotificationInteraction(): Promise<void> {
    try {
      const engagement = await this.getUserEngagement();
      await this.updateUserEngagement({
        notificationInteractions: engagement.notificationInteractions + 1,
      });
    } catch (error) {
      console.error("Error recording notification interaction:", error);
    }
  }

  // Theme Preference
  static async saveThemePreference(
    theme: "light" | "dark" | "auto"
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
      throw error;
    }
  }

  static async getThemePreference(): Promise<"light" | "dark" | "auto"> {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      return (theme as "light" | "dark" | "auto") || "auto";
    } catch (error) {
      console.error("Error getting theme preference:", error);
      return "auto";
    }
  }

  // Clear all data (for debugging/reset)
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw error;
    }
  }
}
