# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
   ```bash
   cd App
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on your device:**
   - Install **Expo Go** app on your phone (iOS or Android)
   - Scan the QR code shown in the terminal
   - The app will load on your device!

## Adding Your Location Images

1. Copy your location images from `../Model/data/frames/` to `App/assets/locations/`
2. Rename them to match the location IDs:
   - `Flint_1_Frame.jpg` → `flint.jpg`
   - `OW_1_Frame.jpg` → `ow.jpg`
   - `SU_1_Frame.jpg` → `su.jpg`
   - `PaulaPlaza_1_Frame.jpg` → `paula.jpg`
   - `Tims_1_Frame.jpg` → `tims.jpg`

3. Uncomment the image require statements in `constants/Locations.js`

## Connecting to Your Backend

1. Update `services/api.js` with your server URL
2. Replace mock data functions in `constants/Locations.js` with API calls
3. Update `loadLocations()` in `HomeScreen.js` to use `fetchAllLocations()`
4. Update `loadCrowdData()` in `LocationDetailScreen.js` to use `fetchCrowdData()`

## Testing the App

The app currently uses mock data, so you can test it immediately without a backend. The mock data shows:
- **Flint Hall**: 4 people (Low)
- **O'Brian Hall**: 16 people (Medium)
- **Student Union**: 8 people (Low)
- **Paula Plaza**: 2 people (Low)
- **Tim Hortons**: 12 people (Medium)

## Troubleshooting

- **"Module not found"**: Run `npm install` again
- **"Expo not found"**: Install Expo CLI globally: `npm install -g expo-cli`
- **QR code not working**: Make sure your phone and computer are on the same WiFi network

