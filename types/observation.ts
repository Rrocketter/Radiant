export interface Observation {
  id: string;
  showerId: string;
  showerName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  conditions: {
    skyClarity: 1 | 2 | 3 | 4 | 5; // 1 = Poor, 5 = Excellent
    lightPollution: 1 | 2 | 3 | 4 | 5; // 1 = Heavy, 5 = None
    weather: 'clear' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'foggy';
    temperature?: number;
    humidity?: number;
  };
  observations: {
    meteorsCount: number;
    brightestMagnitude?: number;
    fireballs: number;
    colorsSeen: string[];
    peakActivity?: string;
  };
  equipment?: {
    camera: boolean;
    telescope: boolean;
    binoculars: boolean;
    other?: string;
  };
  notes: string;
  photos?: string[];
  rating: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationStats {
  totalObservations: number;
  totalMeteors: number;
  totalHours: number;
  averageRating: number;
  favoriteShower: string;
  longestSession: number;
  currentStreak: number;
  longestStreak: number;
  monthlyStats: { [month: string]: number };
  showerStats: { [showerId: string]: ObservationShowerStats };
}

export interface ObservationShowerStats {
  observations: number;
  totalMeteors: number;
  averageRating: number;
  bestSession: {
    date: string;
    meteors: number;
    rating: number;
  };
}
