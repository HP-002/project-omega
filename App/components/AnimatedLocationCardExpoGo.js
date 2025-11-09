import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';
import { useFavorites } from '../contexts/FavoritesContext';

export default function AnimatedLocationCardExpoGo({ location, onPress, index = 0 }) {
  const { isPinned, togglePin } = useFavorites();
  const crowdColor = getCrowdLevelColor(location.crowdData.level);
  const crowdText = getCrowdLevelText(location.crowdData.level);
  const pinned = isPinned(location.id);

  // Animation values using React Native Animated API
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const pinScale = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const previousCount = useRef(location.crowdData.count);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }),
    ]).start();
  }, []);

  // Animate crowd count changes
  useEffect(() => {
    if (location.crowdData.count !== previousCount.current) {
      Animated.sequence([
        Animated.spring(badgeScale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
      ]).start();
      previousCount.current = location.crowdData.count;
    }
  }, [location.crowdData.count]);

  const handlePinPress = (e) => {
    e.stopPropagation();
    Animated.sequence([
      Animated.spring(pinScale, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
      Animated.spring(pinScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePin(location.id);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {location.image ? (
            <Image
              source={location.image}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <LinearGradient
                colors={['#16213e', '#0f3460', '#1a1a2e']}
                style={styles.placeholderGradient}
              >
                <View style={styles.placeholderIcon}>
                  <Text style={styles.placeholderIconText}>🏛️</Text>
                </View>
                <Text style={styles.placeholderText}>{location.name}</Text>
              </LinearGradient>
            </View>
          )}
          
          {/* Animated Crowd Badge */}
          <Animated.View
            style={[
              styles.crowdBadge,
              { backgroundColor: crowdColor },
              { transform: [{ scale: badgeScale }] },
            ]}
          >
            <Text style={styles.crowdBadgeText}>{crowdText}</Text>
          </Animated.View>

          {/* Animated Pin Button */}
          <Animated.View style={{ transform: [{ scale: pinScale }] }}>
            <TouchableOpacity
              style={styles.pinButton}
              onPress={handlePinPress}
              activeOpacity={0.8}
            >
              <Text style={styles.pinIcon}>{pinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              {pinned && <Text style={styles.pinnedBadge}>⭐</Text>}
              <Text style={styles.name}>{location.name}</Text>
            </View>
            <View
              style={[
                styles.indicator,
                { backgroundColor: crowdColor },
              ]}
            />
          </View>
          <Text style={styles.description}>{location.description}</Text>
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerIcon}>👥</Text>
              <Text style={styles.count}>
                {location.crowdData.count} people
              </Text>
              {location.crowdData.occupancyPercent !== null && (
                <Text style={styles.occupancy}>
                  • {location.crowdData.occupancyPercent.toFixed(0)}% full
                </Text>
              )}
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  crowdBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  crowdBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  pinButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinIcon: {
    fontSize: 20,
  },
  content: {
    padding: 18,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  count: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  occupancy: {
    fontSize: 13,
    color: '#b0b0b0',
    marginLeft: 8,
  },
  indicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  arrow: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '300',
  },
  placeholderImage: {
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    marginBottom: 12,
  },
  placeholderIconText: {
    fontSize: 52,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  pinnedBadge: {
    fontSize: 16,
    marginRight: 8,
  },
});

