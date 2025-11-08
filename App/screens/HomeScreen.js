import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LOCATIONS, getCrowdLevel, getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';
import LocationCard from '../components/LocationCard';

export default function HomeScreen({ navigation }) {
  const [locations, setLocations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    // Simulate API call - replace with actual API endpoint
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const locationsWithCrowd = LOCATIONS.map(location => ({
      ...location,
      crowdData: getCrowdLevel(location.id),
    }));
    
    // Sort by crowd level (low first)
    locationsWithCrowd.sort((a, b) => {
      const order = { low: 0, medium: 1, high: 2, unknown: 3 };
      return order[a.crowdData.level] - order[b.crowdData.level];
    });
    
    setLocations(locationsWithCrowd);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLocations();
    setRefreshing(false);
  };

  const renderLocation = ({ item }) => (
    <LocationCard
      location={item}
      onPress={() => navigation.navigate('LocationDetail', { location: item })}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f3460" />
        <Text style={styles.loadingText}>Loading study spaces...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>📍</Text>
          <Text style={styles.title}>Find Your Study Space</Text>
        </View>
        <Text style={styles.subtitle}>
          Real-time crowd levels at UB locations
        </Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statText}>Low</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.statText}>Medium</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.statText}>High</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={locations}
        renderItem={renderLocation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No locations available</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statText: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
  },
});

