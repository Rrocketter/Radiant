import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { METEOR_SHOWERS_2025, getActiveMeteorShowers, getUpcomingMeteorShowers } from '@/data/meteorShowers';
import { MeteorShower, UserLocation, ViewingConditions } from '@/types/meteorShower';
import { LocationService } from '@/services/LocationService';
import { AstronomyService } from '@/services/AstronomyService';
import { StorageService } from '@/services/StorageService';
import { NotificationService } from '@/services/NotificationService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [upcomingShowers, setUpcomingShowers] = useState<MeteorShower[]>([]);
  const [activeShowers, setActiveShowers] = useState<MeteorShower[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    StorageService.recordAppOpen();
  }, []);

  const initializeApp = async () => {
    try {
      // Load saved location or get current location
      let location = await StorageService.getUserLocation();
      if (!location) {
        location = await LocationService.getCurrentLocation();
        if (location) {
          await StorageService.saveUserLocation(location);
        }
      }
      setUserLocation(location);

      // Setup notifications
      NotificationService.setupNotificationListener();
      
      // Load meteor shower data
      updateMeteorShowerData();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMeteorShowerData = () => {
    const today = new Date();
    const active = getActiveMeteorShowers(today);
    const upcoming = getUpcomingMeteorShowers(60); // Next 60 days
    
    setActiveShowers(active);
    setUpcomingShowers(upcoming.slice(0, 5)); // Show top 5 upcoming
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh location
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        await StorageService.saveUserLocation(location);
      }
      updateMeteorShowerData();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleShowerPress = async (shower: MeteorShower) => {
    await StorageService.recordShowerViewed(shower.id);
    // Navigate to shower details (would integrate with navigation)
    Alert.alert(
      shower.name,
      `Peak: ${shower.peak.date}\nRate: ${shower.zhr} meteors/hour\n\n${shower.description}`,
      [{ text: 'OK' }]
    );
  };

  const getNextMajorShower = (): MeteorShower | null => {
    const today = new Date();
    return METEOR_SHOWERS_2025.find(shower => {
      const peakDate = new Date(shower.peak.date);
      return peakDate > today && shower.zhr >= 50;
    }) || null;
  };

  const renderShowerCard = (shower: MeteorShower, isActive: boolean = false) => {
    const daysUntilPeak = AstronomyService.getDaysUntilPeak(shower);
    const cardColor = isActive ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].background;
    
    return (
      <TouchableOpacity
        key={shower.id}
        style={[styles.showerCard, { backgroundColor: cardColor }]}
        onPress={() => handleShowerPress(shower)}
      >
        <View style={styles.showerHeader}>
          <ThemedText style={styles.showerName}>{shower.name}</ThemedText>
          <ThemedText style={styles.showerZHR}>{shower.zhr}/hr</ThemedText>
        </View>
        <ThemedText style={styles.showerRadiant}>Radiant: {shower.radiant}</ThemedText>
        <ThemedText style={styles.showerDate}>
          Peak: {new Date(shower.peak.date).toLocaleDateString()}
        </ThemedText>
        {isActive ? (
          <ThemedText style={styles.activeLabel}>ACTIVE NOW</ThemedText>
        ) : (
          <ThemedText style={styles.daysUntil}>
            {daysUntilPeak > 0 ? `${daysUntilPeak} days` : 'Today'}
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  const nextMajor = getNextMajorShower();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.innerContainer}>
          <ThemedText style={styles.loadingText}>Loading meteor shower data...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Header */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f4c75']}
          style={styles.header}
        >
          <ThemedText style={styles.headerTitle}>Radiant</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {userLocation ? `${userLocation.city || 'Unknown'}, ${userLocation.country || 'Earth'}` : 'Location Unknown'}
          </ThemedText>
        </LinearGradient>

        {/* Next Major Shower */}
        {nextMajor && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Next Major Shower</ThemedText>
            <TouchableOpacity
              style={styles.majorShowerCard}
              onPress={() => handleShowerPress(nextMajor)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.majorShowerGradient}
              >
                <ThemedText style={styles.majorShowerName}>{nextMajor.name}</ThemedText>
                <ThemedText style={styles.majorShowerDetails}>
                  {AstronomyService.getDaysUntilPeak(nextMajor)} days • {nextMajor.zhr} meteors/hour
                </ThemedText>
                <ThemedText style={styles.majorShowerDescription}>
                  {nextMajor.description.split('.')[0]}.
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Showers */}
        {activeShowers.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Active Now</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeShowers.map(shower => renderShowerCard(shower, true))}
            </ScrollView>
          </View>
        )}

        {/* Upcoming Showers */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Upcoming Showers</ThemedText>
          {upcomingShowers.map(shower => renderShowerCard(shower))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <ThemedText style={styles.actionButtonText}>View Calendar</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <ThemedText style={styles.actionButtonText}>Set Notifications</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  section: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  majorShowerCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  majorShowerGradient: {
    padding: 20,
  },
  majorShowerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  majorShowerDetails: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 10,
  },
  majorShowerDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  showerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    marginBottom: 10,
    width: width * 0.7,
    minWidth: 250,
  },
  showerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  showerName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  showerZHR: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  showerRadiant: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  showerDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  daysUntil: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
