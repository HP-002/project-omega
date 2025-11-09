import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoritesContext = createContext(null);
const FAVORITES_KEY = '@crowdsense_favorites';

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [pinnedLocations, setPinnedLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load pinned locations from storage on mount
  useEffect(() => {
    loadPinnedLocations();
  }, []);

  const loadPinnedLocations = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPinnedLocations(parsed);
      }
    } catch (error) {
      console.error('Error loading pinned locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePinnedLocations = async (locations) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving pinned locations:', error);
    }
  };

  const togglePin = useCallback(async (locationId) => {
    setPinnedLocations(prev => {
      const isPinned = prev.includes(locationId);
      const newPinned = isPinned
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId];
      
      savePinnedLocations(newPinned);
      return newPinned;
    });
  }, []);

  const isPinned = useCallback((locationId) => {
    return pinnedLocations.includes(locationId);
  }, [pinnedLocations]);

  const value = {
    pinnedLocations,
    togglePin,
    isPinned,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

