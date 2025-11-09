import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCrowdData } from '../contexts/WebSocketContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LocationDetailScreen({ route, navigation }) {
  const { location } = route.params;
  const { getCrowdData, isConnected } = useCrowdData();
  const { isPinned, togglePin } = useFavorites();
  
  // Get real-time crowd data from WebSocket
  const crowdData = getCrowdData(location.id);
  const pinned = isPinned(location.id);

  // Animation values using React Native Animated API
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const previousCount = useRef(crowdData.count);

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate crowd count changes
  useEffect(() => {
    if (crowdData.count !== previousCount.current) {
      Animated.sequence([
        Animated.spring(badgeScale, {
          toValue: 1.3,
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
      previousCount.current = crowdData.count;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [crowdData.count]);

  const handlePinPress = () => {
    Animated.sequence([
      Animated.spring(pinScale, {
        toValue: 1.2,
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

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const crowdColor = getCrowdLevelColor(crowdData.level);
  const crowdText = getCrowdLevelText(crowdData.level);

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: imageOpacity,
              transform: [{ scale: imageScale }],
            },
          ]}
        >
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
          <View style={styles.imageOverlay}>
            <View style={styles.overlayRow}>
              <Text style={styles.locationName} numberOfLines={2}>
                {location.name}
              </Text>
              <AnimatedTouchableOpacity
                style={[
                  styles.pinButton,
                  pinned && styles.pinButtonActive,
                  { transform: [{ scale: pinScale }] },
                ]}
                onPress={handlePinPress}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={pinned ? 'pin' : 'pin-outline'}
                  size={18}
                  color={pinned ? '#0f3460' : '#ffffff'}
                />
              </AnimatedTouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}><Ionicons name="people" color="white" size={18} />  Crowd Level</Text>
            <View style={styles.crowdRow}>
              <View style={styles.crowdInfoBlock}>
                <View style={styles.crowdInfo}>
                  <Text style={styles.crowdCount}>
                    {crowdData.count} people detected
                  </Text>
                  {crowdData.occupancyPercent !== null && (
                    <Text style={styles.occupancyPercent}>
                      {crowdData.occupancyPercent.toFixed(1)}% occupied
                    </Text>
                  )}
                </View>
              </View>
              <Animated.View
                style={[
                  styles.crowdBadge,
                  { backgroundColor: crowdColor },
                  { transform: [{ scale: badgeScale }] },
                ]}
              >
                <Text style={styles.crowdText}>{crowdText}</Text>
              </Animated.View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}><Ionicons name="information-circle" color="white" size={18} /> Description</Text>
            <Text style={styles.description}>{location.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}><Ionicons name="time" size={18} color="white" /> Last Updated</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(crowdData.lastUpdated)}
              </Text>
              <Text style={styles.dateText}>
                {crowdData.lastUpdated.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Crowd levels are updated in real-time using YOLO object detection
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    marginBottom: 15,
  },
  placeholderIconText: {
    fontSize: 64,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  overlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  pinButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  pinButtonActive: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  pinSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pinSectionActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: '#FFC107',
  },
  pinSectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pinSectionText: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  pinSectionTextActive: {
    color: '#FFC107',
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 5,
  },
  crowdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  crowdInfoBlock: {
    flex: 1,
  },
  crowdLevelText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  crowdBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  crowdText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  crowdInfo: {
    flex: 1,
  },
  crowdCount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  occupancyPercent: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 8,
  },
  crowdSubtext: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  description: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#b0b0b0',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connectionText: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});
