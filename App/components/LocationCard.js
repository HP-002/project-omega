import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';

export default function LocationCard({ location, onPress }) {
  const crowdColor = getCrowdLevelColor(location.crowdData.level);
  const crowdText = getCrowdLevelText(location.crowdData.level);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
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
        <View style={[styles.crowdBadge, { backgroundColor: crowdColor }]}>
          <Text style={styles.crowdBadgeText}>{crowdText}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{location.name}</Text>
          <View style={[styles.indicator, { backgroundColor: crowdColor }]} />
        </View>
        <Text style={styles.description}>{location.description}</Text>
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerIcon}>👥</Text>
            <Text style={styles.count}>
              {location.crowdData.count} people
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  crowdBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  crowdBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  count: {
    fontSize: 14,
    color: '#e0e0e0',
    fontWeight: '500',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  arrow: {
    fontSize: 18,
    color: '#e0e0e0',
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
    fontSize: 48,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

