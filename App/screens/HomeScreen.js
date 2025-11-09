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
import { useTheme } from '../contexts/ThemeContext';
import { USE_MOCK_DATA } from '../config/websocket';
import { getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';
// Use Expo Go compatible versions (React Native Animated API)
import AnimatedLocationCard from '../components/AnimatedLocationCardExpoGo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function HomeScreen({ navigation }) {
  const { isConnected, getLocationsWithCrowd, crowdData, error, reconnectAttempts } = useCrowdData();
  const { pinnedLocations, isPinned } = useFavorites();
  const { colors, toggleTheme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const filterScale = useRef(new Animated.Value(1)).current;
  const themeToggleScale = useRef(new Animated.Value(1)).current;

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

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(themeToggleScale, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
      Animated.spring(themeToggleScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
    ]).start();
    toggleTheme();
  };

  const renderLocation = ({ item, index }) => (
    <AnimatedLocationCard
      location={item}
      index={index}
      onPress={() => navigation.navigate('LocationDetail', { location: item })}
    />
  );

  const dynamicStyles = {
    icon: { color: colors.text },
    title: { color: colors.text },
    subtitle: { color: colors.textSecondary },
    statusIcon: { backgroundColor: colors.statusBackground },
    actionButton: {
      backgroundColor: colors.buttonBackground,
      borderColor: colors.buttonBorder,
    },
    actionButtonActive: {
      backgroundColor: colors.buttonBackgroundActive,
      borderColor: colors.buttonBackgroundActive,
    },
    actionButtonText: { color: colors.buttonText },
    actionButtonTextActive: { color: colors.buttonTextActive },
    mapButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.85)' : colors.buttonBackgroundActive,
      borderColor: 'transparent',
    },
    mapButtonText: { color: isDark ? '#0f3460' : colors.buttonTextActive },
    badge: { backgroundColor: colors.badgeBackground },
    badgeText: { color: colors.buttonText },
    badgeTextActive: { color: colors.buttonTextActive },
    emptyText: { color: colors.text },
    emptySubtext: { color: colors.textTertiary },
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Ionicons name="location-sharp" style={[styles.icon, dynamicStyles.icon]} />
            <Text style={[styles.title, dynamicStyles.title]}>Find Your Study Space</Text>
          </View>
          <View style={[styles.topRowRight]}>
            <Animated.View style={{ transform: [{ scale: themeToggleScale }] }}>
              <TouchableOpacity
                style={[styles.themeToggle, { backgroundColor: colors.statusBackground }]}
                onPress={handleThemeToggle}
              >
                <Ionicons
                  name={isDark ? 'sunny' : 'moon'}
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
            </Animated.View>
            <View style={[styles.statusIcon, dynamicStyles.statusIcon]}>
              {isConnected ? (
                <Ionicons name="cloud-done" size={20} color="#6BEA8E" />
              ) : (
                <Ionicons name="cloud-offline" size={20} color="#FF6B6B" />
              )}
            </View>
          </View>
        </View>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Real-time crowd levels at UB locations
        </Text>

        <View style={styles.actionsRow}>
          <Animated.View style={{ transform: [{ scale: filterScale }] }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.pinnedButton,
                dynamicStyles.actionButton,
                showPinnedOnly && styles.actionButtonActive,
                showPinnedOnly && dynamicStyles.actionButtonActive,
              ]}
              onPress={handleFilterToggle}
            >
              <MaterialCommunityIcons
                name="pin"
                size={16}
                color={showPinnedOnly ? colors.buttonTextActive : colors.buttonText}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  dynamicStyles.actionButtonText,
                  showPinnedOnly && styles.actionButtonTextActive,
                  showPinnedOnly && dynamicStyles.actionButtonTextActive,
                ]}
              >
                Pinned
              </Text>
              <View style={[styles.badge, dynamicStyles.badge]}>
                <Text
                  style={[
                    styles.badgeText,
                    dynamicStyles.badgeText,
                    showPinnedOnly && styles.badgeTextActive,
                    showPinnedOnly && dynamicStyles.badgeTextActive,
                  ]}
                >
                  {pinnedLocations.length}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.mapButton,
              dynamicStyles.actionButton,
              dynamicStyles.mapButton,
            ]}
            onPress={handleViewModeToggle}
          >
            <Ionicons name="map" size={16} color={isDark ? '#0f3460' : colors.buttonTextActive} />
            <Text style={[styles.actionButtonText, dynamicStyles.mapButtonText]}>Map</Text>
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
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No locations available</Text>
            <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>
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
    flex: 1,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    width: 28,
    height: 28,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 0,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 18,
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
    borderWidth: 0.5,
  },
  pinnedButton: {
    maxWidth: 130,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonActive: {
    // Dynamic styles applied via dynamicStyles
  },
  mapButton: {
    // Dynamic styles applied via dynamicStyles
  },
  mapButtonText: {
    // Dynamic styles applied via dynamicStyles
  },
  actionButtonTextActive: {
    // Dynamic styles applied via dynamicStyles
  },
  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    // Dynamic styles applied via dynamicStyles
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
