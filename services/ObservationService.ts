import AsyncStorage from '@react-native-async-storage/async-storage';
import { Observation, ObservationStats } from '@/types/observation';

class ObservationService {
  private static readonly OBSERVATIONS_KEY = 'user_observations';
  private static readonly STATS_KEY = 'observation_stats';

  static async getObservations(): Promise<Observation[]> {
    try {
      const data = await AsyncStorage.getItem(this.OBSERVATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading observations:', error);
      return [];
    }
  }

  static async saveObservation(observation: Observation): Promise<void> {
    try {
      const observations = await this.getObservations();
      const existingIndex = observations.findIndex(obs => obs.id === observation.id);
      
      if (existingIndex >= 0) {
        observations[existingIndex] = { ...observation, updatedAt: new Date().toISOString() };
      } else {
        observations.push(observation);
      }

      await AsyncStorage.setItem(this.OBSERVATIONS_KEY, JSON.stringify(observations));
      await this.updateStats();
    } catch (error) {
      console.error('Error saving observation:', error);
      throw error;
    }
  }

  static async deleteObservation(observationId: string): Promise<void> {
    try {
      const observations = await this.getObservations();
      const filtered = observations.filter(obs => obs.id !== observationId);
      await AsyncStorage.setItem(this.OBSERVATIONS_KEY, JSON.stringify(filtered));
      await this.updateStats();
    } catch (error) {
      console.error('Error deleting observation:', error);
      throw error;
    }
  }

  static async getObservationsByShower(showerId: string): Promise<Observation[]> {
    const observations = await this.getObservations();
    return observations.filter(obs => obs.showerId === showerId);
  }

  static async getObservationsByDateRange(startDate: string, endDate: string): Promise<Observation[]> {
    const observations = await this.getObservations();
    return observations.filter(obs => {
      const obsDate = new Date(obs.date);
      return obsDate >= new Date(startDate) && obsDate <= new Date(endDate);
    });
  }

  static async getStats(): Promise<ObservationStats> {
    try {
      const data = await AsyncStorage.getItem(this.STATS_KEY);
      return data ? JSON.parse(data) : this.getEmptyStats();
    } catch (error) {
      console.error('Error loading stats:', error);
      return this.getEmptyStats();
    }
  }

  private static async updateStats(): Promise<void> {
    try {
      const observations = await this.getObservations();
      const stats = this.calculateStats(observations);
      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  private static calculateStats(observations: Observation[]): ObservationStats {
    if (observations.length === 0) {
      return this.getEmptyStats();
    }

    const totalMeteors = observations.reduce((sum, obs) => sum + obs.observations.meteorsCount, 0);
    const totalHours = observations.reduce((sum, obs) => {
      const start = new Date(`${obs.date}T${obs.startTime}`);
      const end = new Date(`${obs.date}T${obs.endTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    const averageRating = observations.reduce((sum, obs) => sum + obs.rating, 0) / observations.length;

    // Calculate monthly stats
    const monthlyStats: { [month: string]: number } = {};
    observations.forEach(obs => {
      const month = new Date(obs.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    });

    // Calculate shower stats
    const showerStats: { [showerId: string]: any } = {};
    observations.forEach(obs => {
      if (!showerStats[obs.showerId]) {
        showerStats[obs.showerId] = {
          observations: 0,
          totalMeteors: 0,
          averageRating: 0,
          bestSession: { date: obs.date, meteors: obs.observations.meteorsCount, rating: obs.rating }
        };
      }
      
      const stats = showerStats[obs.showerId];
      stats.observations++;
      stats.totalMeteors += obs.observations.meteorsCount;
      
      if (obs.observations.meteorsCount > stats.bestSession.meteors || 
          (obs.observations.meteorsCount === stats.bestSession.meteors && obs.rating > stats.bestSession.rating)) {
        stats.bestSession = { date: obs.date, meteors: obs.observations.meteorsCount, rating: obs.rating };
      }
    });

    // Calculate average ratings for each shower
    Object.keys(showerStats).forEach(showerId => {
      const showerObs = observations.filter(obs => obs.showerId === showerId);
      showerStats[showerId].averageRating = showerObs.reduce((sum, obs) => sum + obs.rating, 0) / showerObs.length;
    });

    // Find favorite shower (most observations)
    const favoriteShower = Object.keys(showerStats).reduce((fav, showerId) => 
      showerStats[showerId].observations > (showerStats[fav]?.observations || 0) ? showerId : fav, '');

    // Calculate streaks
    const sortedObs = observations.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const { currentStreak, longestStreak } = this.calculateStreaks(sortedObs);

    // Find longest session
    const longestSession = Math.max(...observations.map(obs => {
      const start = new Date(`${obs.date}T${obs.startTime}`);
      const end = new Date(`${obs.date}T${obs.endTime}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }));

    return {
      totalObservations: observations.length,
      totalMeteors,
      totalHours,
      averageRating,
      favoriteShower,
      longestSession,
      currentStreak,
      longestStreak,
      monthlyStats,
      showerStats
    };
  }

  private static calculateStreaks(sortedObservations: Observation[]): { currentStreak: number, longestStreak: number } {
    if (sortedObservations.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedObservations.length; i++) {
      const prevDate = new Date(sortedObservations[i - 1].date);
      const currDate = new Date(sortedObservations[i].date);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) { // Within a week counts as continuing streak
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Calculate current streak from the end
    const today = new Date();
    const lastObsDate = new Date(sortedObservations[sortedObservations.length - 1].date);
    const daysSinceLastObs = (today.getTime() - lastObsDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastObs <= 7) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    return { currentStreak, longestStreak };
  }

  private static getEmptyStats(): ObservationStats {
    return {
      totalObservations: 0,
      totalMeteors: 0,
      totalHours: 0,
      averageRating: 0,
      favoriteShower: '',
      longestSession: 0,
      currentStreak: 0,
      longestStreak: 0,
      monthlyStats: {},
      showerStats: {}
    };
  }

  static generateObservationId(): string {
    return `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { ObservationService };
