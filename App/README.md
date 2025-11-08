# CrowdSense UB

A React Native mobile app built with Expo that helps students at the University at Buffalo find less crowded study spaces in real-time.

## Features

- 📍 View study spaces across UB campus
- 👥 Real-time crowd level indicators (Low/Medium/High)
- 🔄 Refresh to get latest crowd data
- 📱 Beautiful, modern UI with gradient backgrounds
- 🎯 Sorted by crowd level (least crowded first)

## Tech Stack

- **Expo** - React Native framework
- **React Navigation** - Navigation between screens
- **Expo Linear Gradient** - Beautiful gradient backgrounds
- **React Native** - Mobile app framework

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Navigate to the App directory:
```bash
cd App
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Run on your device:
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## Project Structure

```
App/
├── App.js                 # Main app entry point with navigation
├── screens/
│   ├── HomeScreen.js      # List of all study locations
│   └── LocationDetailScreen.js  # Detailed view of a location
├── components/
│   └── LocationCard.js    # Reusable card component for locations
├── constants/
│   └── Locations.js       # Location data and utility functions
└── assets/                # Images and other assets
```

## Integration with YOLO Detection

The app currently uses mock data. To integrate with your YOLO detection system:

1. Update `constants/Locations.js`:
   - Replace `getCrowdLevel()` function with an API call to your server
   - The API should return crowd count and level for each location

2. API Endpoint Expected Format:
```json
{
  "locationId": "flint",
  "count": 4,
  "level": "low",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

3. Update the `loadLocations()` and `loadCrowdData()` functions in the screens to fetch from your server endpoint.

## Adding Location Images

1. Add images to `assets/locations/` folder
2. Uncomment the image require statements in `constants/Locations.js`
3. Update image paths to match your file names

## Customization

- **Colors**: Modify gradient colors in `HomeScreen.js` and `LocationDetailScreen.js`
- **Locations**: Add/remove locations in `constants/Locations.js`
- **Crowd Thresholds**: Update `getCrowdLevel()` to adjust low/medium/high thresholds

## Next Steps

- [ ] Integrate with backend API for real-time data
- [ ] Add location images
- [ ] Implement push notifications for crowd alerts
- [ ] Add map view with location markers
- [ ] Add favorites/bookmarks feature
- [ ] Implement user authentication
- [ ] Add historical crowd data charts

## Team

Built for University at Buffalo Hackathon

## License

MIT

