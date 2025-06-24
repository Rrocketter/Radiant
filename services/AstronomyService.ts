import {
  MeteorShower,
  UserLocation,
  ViewingConditions,
} from "../types/meteorShower";

export class AstronomyService {
  /**
   * Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = new moon)
   */
  static getMoonPhase(date: Date): number {
    const baseDate = new Date("2000-01-06"); // Known new moon date
    const daysSince =
      (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
    const cycle = daysSince / 29.53059; // Lunar cycle length
    const phase = cycle - Math.floor(cycle);
    return phase;
  }

  /**
   * Calculate moon illumination percentage
   */
  static getMoonIllumination(date: Date): number {
    const phase = this.getMoonPhase(date);
    return Math.round(Math.abs(Math.cos(phase * 2 * Math.PI)) * 100);
  }

  /**
   * Calculate if a meteor shower is visible from a given location
   */
  static isShowerVisible(
    shower: MeteorShower,
    location: UserLocation
  ): boolean {
    // Simple hemisphere check - in reality this would be more complex
    if (shower.visibility.hemisphere === "northern" && location.latitude < 0) {
      return false;
    }
    if (shower.visibility.hemisphere === "southern" && location.latitude > 0) {
      return false;
    }
    return true;
  }

  /**
   * Calculate viewing conditions for a meteor shower
   */
  static calculateViewingConditions(
    shower: MeteorShower,
    location: UserLocation,
    date: Date
  ): ViewingConditions {
    const moonPhase = this.getMoonPhase(date);
    const moonIllumination = this.getMoonIllumination(date);

    // Calculate visibility score (0-1)
    let visibility = 1.0;

    // Reduce visibility based on moon brightness
    if (shower.moonPhaseImpact === "high") {
      visibility *= 1 - (moonIllumination / 100) * 0.8;
    } else if (shower.moonPhaseImpact === "medium") {
      visibility *= 1 - (moonIllumination / 100) * 0.5;
    } else {
      visibility *= 1 - (moonIllumination / 100) * 0.2;
    }

    // Estimate light pollution based on latitude (simplified)
    let lightPollutionImpact: "low" | "medium" | "high" = "medium";
    const absLat = Math.abs(location.latitude);
    if (absLat > 60) {
      lightPollutionImpact = "low"; // Far north/south generally less populated
    } else if (absLat < 30) {
      lightPollutionImpact = "high"; // More populated areas
    }

    // Adjust visibility for light pollution
    if (lightPollutionImpact === "high") {
      visibility *= 0.6;
    } else if (lightPollutionImpact === "medium") {
      visibility *= 0.8;
    }

    return {
      visibility: Math.max(0, visibility),
      moonPhase,
      moonIllumination,
      optimalViewingHours: this.calculateOptimalViewingHours(shower, location),
      lightPollutionImpact,
    };
  }

  /**
   * Calculate optimal viewing hours for a shower
   */
  private static calculateOptimalViewingHours(
    shower: MeteorShower,
    location: UserLocation
  ): { start: string; end: string } {
    // Simplified calculation - in reality this would involve radiant position calculations
    if (shower.bestViewingTime.includes("midnight")) {
      return { start: "23:00", end: "05:00" };
    } else if (shower.bestViewingTime.includes("evening")) {
      return { start: "21:00", end: "02:00" };
    } else if (shower.bestViewingTime.includes("dawn")) {
      return { start: "02:00", end: "06:00" };
    } else {
      return { start: "22:00", end: "06:00" }; // All night
    }
  }

  /**
   * Convert UTC time to local time string
   */
  static formatLocalTime(utcTime: string, timezone: string): string {
    try {
      const date = new Date(utcTime);
      return date.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return utcTime;
    }
  }

  /**
   * Calculate days until peak
   */
  static getDaysUntilPeak(shower: MeteorShower): number {
    const today = new Date();
    const peakDate = new Date(shower.peak.date);
    const diffTime = peakDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get recommendation text based on viewing conditions
   */
  static getViewingRecommendation(
    conditions: ViewingConditions,
    shower: MeteorShower
  ): string {
    if (conditions.visibility > 0.8) {
      return `Excellent viewing conditions! ${shower.name} should be clearly visible.`;
    } else if (conditions.visibility > 0.6) {
      return `Good viewing conditions. Look for ${shower.name} in a dark location.`;
    } else if (conditions.visibility > 0.4) {
      return `Fair conditions. ${shower.name} may be visible from dark sky locations.`;
    } else if (conditions.visibility > 0.2) {
      return `Poor conditions due to moonlight. Try viewing ${shower.name} late at night.`;
    } else {
      return `Very poor conditions. ${shower.name} will be difficult to see due to bright moonlight.`;
    }
  }
}
