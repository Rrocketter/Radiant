import * as Location from "expo-location";
import { UserLocation } from "../types/meteorShower";

export class LocationService {
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Location permission error:", error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error("Location permission denied");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode[0];
      const timezone = await this.getTimezone(
        location.coords.latitude,
        location.coords.longitude
      );

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: address?.city || undefined,
        country: address?.country || undefined,
        timezone: timezone,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  }

  private static async getTimezone(lat: number, lon: number): Promise<string> {
    try {
      // Using a simple approach for timezone detection
      // In production, you might want to use a more robust timezone API
      const offset = Math.round(lon / 15);
      const sign = offset >= 0 ? "+" : "-";
      const hours = Math.abs(offset).toString().padStart(2, "0");
      return `UTC${sign}${hours}:00`;
    } catch (error) {
      console.error("Error getting timezone:", error);
      return "UTC+00:00";
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
