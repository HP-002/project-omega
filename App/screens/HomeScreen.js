import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCrowdData } from '../contexts/WebSocketContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { USE_MOCK_DATA } from '../config/websocket';
import { getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';
// Use Expo Go compatible versions (React Native Animated API)
import AnimatedLocationCard from '../components/AnimatedLocationCardExpoGo';
import PulseIndicator from '../components/PulseIndicatorExpoGo';

export default function HomeScreen({ navigation }) {
  const { isConnected, getLocationsWithCrowd, crowdData, error, reconnectAttempts } = useCrowdData();
  const { pinnedLocations, isPinned } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const filterScale = useRef(new Animated.Value(1)).current;

  // Get locations with real-time crowd data from WebSocket
  // Updates automatically when crowdData changes
  const locations = useMemo(() => {
    let locationsWithCrowd = getLocationsWithCrowd();
    
    // Filter to show only pinned if filter is active
    if (showPinnedOnly) {
      locationsWithCrowd = locationsWithCrowd.filter(loc => isPinned(loc.id));
    }
    
    // Sort: pinned first, then by crowd level (low first)
    locationsWithCrowd.sort((a, b) => {
      const aPinned = isPinned(a.id);
      const bPinned = isPinned(b.id);
      
      // Pinned items come first
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Then sort by crowd level
      const order = { low: 0, medium: 1, high: 2, unknown: 3 };
      return order[a.crowdData.level] - order[b.crowdData.level];
    });
    
    return locationsWithCrowd;
  }, [getLocationsWithCrowd, crowdData, showPinnedOnly, isPinned]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // WebSocket automatically updates, just simulate refresh
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleFilterToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(filterScale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
      Animated.spring(filterScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
    ]).start();
    setShowPinnedOnly(!showPinnedOnly);
  };

  const handleViewModeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('MapView');
  };

  // No need for animated style, we'll use Animated.View directly

  const renderLocation = ({ item, index }) => (
    <AnimatedLocationCard
      location={item}
      index={index}
      onPress={() => navigation.navigate('LocationDetail', { location: item })}
    />
  );

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
        
        {/* Filter and View Toggle */}
        <View style={styles.filterContainer}>
          <Animated.View style={{ transform: [{ scale: filterScale }] }}>
            <TouchableOpacity
              style={[styles.filterButton, showPinnedOnly && styles.filterButtonActive]}
              onPress={handleFilterToggle}
            >
              <Text style={[styles.filterText, showPinnedOnly && styles.filterTextActive]}>
                {showPinnedOnly ? '📌 Pinned Only' : '📌 Show All'}
              </Text>
              {pinnedLocations.length > 0 && (
                <View style={styles.pinCount}>
                  <Text style={styles.pinCountText}>{pinnedLocations.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleViewModeToggle}
          >
            <Text style={styles.mapButtonText}>🗺️ Map</Text>
          </TouchableOpacity>
        </View>
        
        {/* Mock Data Indicator */}
        {USE_MOCK_DATA && (
          <View style={styles.mockIndicator}>
            <Text style={styles.mockText}>🔧 TEST MODE: Using Mock Data</Text>
          </View>
        )}
        
        {/* WebSocket Connection Status */}
        <View style={styles.connectionStatus}>
          {isConnected ? (
            <PulseIndicator color="#4CAF50" size={10} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: '#F44336' }]} />
          )}
          <Text style={styles.statusText}>
            {isConnected ? '🟢 Live' : error ? '🔴 Disconnected' : '🟡 Connecting...'}
          </Text>
          {!isConnected && reconnectAttempts > 0 && (
            <Text style={styles.reconnectText}>
              Reconnecting... ({reconnectAttempts}/5)
            </Text>
          )}
        </View>

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
            colors={['#fff']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyText}>No locations available</Text>
            <Text style={styles.emptySubtext}>
              {showPinnedOnly ? 'Pin some locations to see them here!' : 'Pull down to refresh'}
            </Text>
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
  header: {
    padding: 16,
    paddingTop: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 12,
  },
  filterContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
  },
  mapButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  mapButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: '#FFC107',
  },
  filterText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  filterTextActive: {
    color: '#FFC107',
  },
  pinCount: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  pinCountText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mockIndicator: {
    backgroundColor: '#FF9800',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  mockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  reconnectText: {
    color: '#FF9800',
    fontSize: 10,
    marginLeft: 8,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#b0b0b0',
    fontSize: 14,
    textAlign: 'center',
  },
});
