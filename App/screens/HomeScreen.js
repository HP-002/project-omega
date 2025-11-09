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
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
        <View style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Ionicons name="location-sharp" style={styles.icon} />
            <Text style={styles.title}>Find Your Study Space</Text>
          </View>
          <View style={styles.statusIcon}>
            {isConnected ? (
              <Ionicons name="cloud-done" size={20} color="#6BEA8E" />
            ) : (
              <Ionicons name="cloud-offline" size={20} color="#FF6B6B" />
            )}
          </View>
        </View>
        <Text style={styles.subtitle}>
          Real-time crowd levels at UB locations
        </Text>

        <View style={styles.actionsRow}>
          {pinnedLocations.length > 0 && (
            <Animated.View style={{ transform: [{ scale: filterScale }] }}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.pinnedButton,
                  showPinnedOnly && styles.actionButtonActive,
                ]}
                onPress={handleFilterToggle}
              >
                <MaterialCommunityIcons
                  name="pin"
                  size={16}
                  color={showPinnedOnly ? '#0f3460' : 'white'}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    showPinnedOnly && styles.actionButtonTextActive,
                  ]}
                >
                  Pinned
                </Text>
                <View style={styles.badge}>
                  <Text
                    style={[
                      styles.badgeText,
                      showPinnedOnly && styles.badgeTextActive,
                    ]}
                  >
                    {pinnedLocations.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={handleViewModeToggle}
          >
            <Ionicons name="map" size={16} color="#0f3460" />
            <Text style={[styles.actionButtonText, styles.mapButtonText]}>Map</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
    color: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 0,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    marginTop: 8,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pinnedButton: {
    maxWidth: 130,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  mapButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'transparent',
  },
  mapButtonText: {
    color: '#0f3460',
  },
  actionButtonTextActive: {
    color: '#0f3460',
  },
  badge: {
    marginLeft: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: '#0f3460',
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
