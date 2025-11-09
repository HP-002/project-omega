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
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

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
                  <FontAwesome5 name="surprise" size={24} color="white" />
                </View>
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

        </View>

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              {pinned && <MaterialCommunityIcons name="pin" size={15} color="white" />}
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
              <Ionicons name="people" color="white" style={styles.footerIcon} />
              <Text style={styles.count}>
                {location.crowdData.count} people
              </Text>
              {location.crowdData.occupancyPercent !== null && (
                <Text style={styles.occupancy}>
                  •  {location.crowdData.occupancyPercent.toFixed(0)}% full
                </Text>
              )}
            </View>
            <Ionicons name="arrow-forward" style={styles.arrow} />
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
    borderRadius: 32,
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
    height: 150,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
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
    fontSize: 12,
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
  content: {
    padding: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: '#e0e0e0',
    marginBottom: 2,
    paddingLeft: 0,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingHorizontal: 2,
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
    fontSize: 15,
    color: '#b0b0b0',
    marginLeft: 8,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  arrow: {
    fontSize: 16,
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

