import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCrowdLevel, getCrowdLevelColor, getCrowdLevelText } from '../constants/Locations';

export default function LocationDetailScreen({ route, navigation }) {
  const { location } = route.params;
  const [crowdData, setCrowdData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrowdData();
  }, []);

  const loadCrowdData = async () => {
    setLoading(true);
    // Simulate API call - replace with actual API endpoint
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = getCrowdLevel(location.id);
    setCrowdData(data);
    setLoading(false);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f3460" />
      </View>
    );
  }

  const crowdColor = getCrowdLevelColor(crowdData.level);
  const crowdText = getCrowdLevelText(crowdData.level);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
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
          <View style={styles.imageOverlay}>
            <Text style={styles.locationName}>{location.name}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Crowd Level</Text>
            <View style={styles.crowdIndicator}>
              <View
                style={[
                  styles.crowdBadge,
                  { backgroundColor: crowdColor },
                ]}
              >
                <Text style={styles.crowdText}>{crowdText}</Text>
              </View>
              <View style={styles.crowdInfo}>
                <Text style={styles.crowdCount}>
                  {crowdData.count} people detected
                </Text>
                <Text style={styles.crowdSubtext}>
                  via YOLO object detection
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Description</Text>
            <Text style={styles.description}>{location.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 Last Updated</Text>
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

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadCrowdData}
            activeOpacity={0.8}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Crowd levels are updated in real-time using YOLO object detection
            </Text>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
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
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
  },
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  crowdIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crowdBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  crowdText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  crowdInfo: {
    flex: 1,
    marginLeft: 12,
  },
  crowdCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  crowdSubtext: {
    color: '#b0b0b0',
    fontSize: 12,
  },
  description: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
  },
  timeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  refreshButton: {
    backgroundColor: '#0f3460',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 20,
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
    marginBottom: 16,
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
});

