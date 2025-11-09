import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCrowdData } from '../contexts/WebSocketContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';
import { LOCATIONS } from '../constants/Locations';

const { width, height } = Dimensions.get('window');

export default function MapViewScreen({ navigation }) {
  const { getLocationsWithCrowd } = useCrowdData();
  const { isPinned } = useFavorites();
  const { colors, isDark } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapType, setMapType] = useState('standard');
  
  const locations = useMemo(() => getLocationsWithCrowd(), [getLocationsWithCrowd]);
  
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(100)).current;

  // Calculate center of all locations
  const initialRegion = useMemo(() => {
    const lats = LOCATIONS.map(loc => loc.coordinates.latitude);
    const lngs = LOCATIONS.map(loc => loc.coordinates.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5,
      longitudeDelta: (maxLng - minLng) * 1.5,
    };
  }, []);

  const handleMarkerPress = (location) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLocation(location);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }),
    ]).start();
  };

  const handleCardClose = () => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedLocation(null);
    });
  };

  const handleCardPress = () => {
    if (selectedLocation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('LocationDetail', { location: selectedLocation });
    }
  };

  // No need for animated style, we'll use Animated.View directly

  const getMarkerColor = (level) => {
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      unknown: '#9E9E9E',
    };
    return colors[level] || colors.unknown;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {locations.map((location) => {
          const color = getMarkerColor(location.crowdData.level);
          const pinned = isPinned(location.id);
          
          return (
            <Marker
              key={location.id}
              coordinate={location.coordinates}
              onPress={() => handleMarkerPress(location)}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.markerPin, { backgroundColor: color, borderColor: colors.background }]}>
                  <Text style={[styles.markerText, { color: colors.textInverse }]}>
                    {location.crowdData.count}
                  </Text>
                </View>
                {pinned && (
                  <View style={styles.pinIndicator}>
                    <Text style={styles.pinIndicatorText}>⭐</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.mapControlBackground }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMapType(mapType === 'standard' ? 'satellite' : 'standard');
          }}
        >
          <Text style={styles.controlButtonText}>
            {mapType === 'standard' ? '🛰️' : '🗺️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.mapLegendBackground }]}>
        <Text style={[styles.legendTitle, { color: colors.text }]}>Crowd Level</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>High</Text>
        </View>
      </View>

      {/* Selected Location Card */}
      {selectedLocation && (
        <Animated.View
          style={[
            styles.locationCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              isDark ? 'rgba(26, 26, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              isDark ? 'rgba(22, 33, 62, 0.98)' : 'rgba(245, 245, 247, 0.98)',
            ]}
            style={styles.cardGradient}
          >
            <TouchableOpacity
              onPress={handleCardPress}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {isPinned(selectedLocation.id) && (
                    <Text style={styles.cardPinnedBadge}>⭐</Text>
                  )}
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{selectedLocation.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCardClose}
                  style={[styles.closeButton, { backgroundColor: colors.buttonBackground }]}
                >
                  <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.cardBadge,
                      { backgroundColor: getCrowdLevelColor(selectedLocation.crowdData.level) },
                    ]}
                  >
                    <Text style={styles.cardBadgeText}>
                      {getCrowdLevelText(selectedLocation.crowdData.level)}
                    </Text>
                  </View>
                  <Text style={[styles.cardCount, { color: colors.text }]}>
                    {selectedLocation.crowdData.count} people
                  </Text>
                </View>
                {selectedLocation.crowdData.occupancyPercent !== null && (
                  <Text style={[styles.cardOccupancy, { color: colors.textSecondary }]}>
                    {selectedLocation.crowdData.occupancyPercent.toFixed(1)}% occupied
                  </Text>
                )}
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {selectedLocation.description}
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 24,
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    padding: 12,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  markerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pinIndicator: {
    marginTop: 2,
  },
  pinIndicatorText: {
    fontSize: 12,
  },
  locationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardPinnedBadge: {
    fontSize: 18,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardOccupancy: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

