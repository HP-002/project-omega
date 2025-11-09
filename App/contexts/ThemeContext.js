import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@crowdsense_theme';
const THEMES = {
  light: {
    mode: 'light',
    // Background colors
    background: '#f5f5f7',
    backgroundSecondary: '#ffffff',
    backgroundTertiary: '#f0f0f0',
    
    // Gradient colors
    gradientStart: '#f5f5f7',
    gradientMiddle: '#ffffff',
    gradientEnd: '#e8e8ea',
    
    // Text colors
    text: '#1a1a2e',
    textSecondary: '#4a4a5c',
    textTertiary: '#6a6a7a',
    textInverse: '#ffffff',
    
    // Card colors
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.1)',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Button colors
    buttonBackground: 'rgba(0, 0, 0, 0.05)',
    buttonBackgroundActive: '#1a1a2e',
    buttonText: '#1a1a2e',
    buttonTextActive: '#ffffff',
    buttonBorder: 'rgba(0, 0, 0, 0.1)',
    
    // Status colors
    statusBackground: 'rgba(0, 0, 0, 0.05)',
    badgeBackground: 'rgba(0, 0, 0, 0.05)',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.3)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
    
    // Placeholder colors
    placeholderBackground: '#e8e8ea',
    placeholderGradient: ['#e8e8ea', '#f0f0f0', '#f5f5f7'],
    
    // Map colors
    mapControlBackground: 'rgba(255, 255, 255, 0.95)',
    mapLegendBackground: 'rgba(255, 255, 255, 0.95)',
    
    // Header colors
    headerBackground: '#ffffff',
    headerText: '#1a1a2e',
  },
  dark: {
    mode: 'dark',
    // Background colors
    background: '#1a1a2e',
    backgroundSecondary: '#16213e',
    backgroundTertiary: '#0f3460',
    
    // Gradient colors
    gradientStart: '#1a1a2e',
    gradientMiddle: '#16213e',
    gradientEnd: '#0f3460',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#e0e0e0',
    textTertiary: '#b0b0b0',
    textInverse: '#1a1a2e',
    
    // Card colors
    cardBackground: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(255, 255, 255, 0.25)',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    // Button colors
    buttonBackground: 'rgba(255, 255, 255, 0.12)',
    buttonBackgroundActive: '#ffffff',
    buttonText: '#ffffff',
    buttonTextActive: '#0f3460',
    buttonBorder: 'rgba(255, 255, 255, 0.2)',
    
    // Status colors
    statusBackground: 'rgba(255, 255, 255, 0.12)',
    badgeBackground: 'rgba(255, 255, 255, 0.12)',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
    
    // Placeholder colors
    placeholderBackground: '#16213e',
    placeholderGradient: ['#16213e', '#0f3460', '#1a1a2e'],
    
    // Map colors
    mapControlBackground: 'rgba(26, 26, 46, 0.9)',
    mapLegendBackground: 'rgba(26, 26, 46, 0.9)',
    
    // Header colors
    headerBackground: '#1a1a2e',
    headerText: '#ffffff',
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // Default to dark
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setThemeMode = async (mode) => {
    if (mode !== 'light' && mode !== 'dark') return;
    setTheme(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = THEMES[theme];
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark,
        toggleTheme,
        setThemeMode,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


