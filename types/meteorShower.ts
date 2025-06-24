export interface MeteorShower {
  id: string;
  name: string;
  radiant: string;
  active: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  peak: {
    date: string; // ISO date string
    time?: string; // Optional time for more precise predictions
  };
  zhr: number; // Zenithal Hourly Rate
  velocity: number; // km/s
  parent: string; // Parent comet/asteroid
  description: string;
  bestViewingTime: string;
  radiantPosition: {
    ra: number; // Right Ascension
    dec: number; // Declination
  };
  visibility: {
    hemisphere: "northern" | "southern" | "both";
    monthsVisible: number[];
  };
  difficulty: "easy" | "moderate" | "difficult";
  moonPhaseImpact: "low" | "medium" | "high";
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timezone: string;
}

export interface NotificationSettings {
  enabled: boolean;
  peakReminder: boolean;
  daysBefore: number;
  hoursBeforePeak: number;
  showMagnitudeFilter: boolean;
  minimumZHR: number;
}

export interface ViewingConditions {
  visibility: number; // 0-1 scale
  moonPhase: number; // 0-1 scale
  moonIllumination: number; // 0-100%
  optimalViewingHours: {
    start: string;
    end: string;
  };
  lightPollutionImpact: "low" | "medium" | "high";
}

export interface MeteorShowerEvent {
  shower: MeteorShower;
  viewingConditions: ViewingConditions;
  isVisible: boolean;
  recommendation: string;
}
