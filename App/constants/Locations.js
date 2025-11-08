// Study space locations at UB
export const LOCATIONS = [
  {
    id: 'flint',
    name: 'Flint Hall',
    description: 'Study area in Flint Hall',
    coordinates: {
      latitude: 43.0014,
      longitude: -78.7890,
    },
  },
  {
    id: 'ow',
    name: 'O\'Brian Hall',
    description: 'Study space in O\'Brian Hall',
    coordinates: {
      latitude: 43.0018,
      longitude: -78.7895,
    },
  },
  {
    id: 'su',
    name: 'Student Union',
    description: 'Main study area in Student Union',
    // image: require('../assets/locations/su.jpg'), // Uncomment when images are added
    coordinates: {
      latitude: 43.0020,
      longitude: -78.7898,
    },
  },
  {
    id: 'paula',
    name: 'Paula Plaza',
    description: 'Outdoor study space at Paula Plaza',
    // image: require('../assets/locations/paula.jpg'), // Uncomment when images are added
    coordinates: {
      latitude: 43.0016,
      longitude: -78.7892,
    },
  },
  {
    id: 'tims',
    name: 'Tim Hortons Study Area',
    description: 'Study space near Tim Hortons',
    // image: require('../assets/locations/tims.jpg'), // Uncomment when images are added
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7888,
    },
  },
];

// Mock crowd data - this will be replaced with real-time YOLO detection data
export const getCrowdLevel = (locationId) => {
  // This will be replaced with API call to our server
  const mockData = {
    flint: { count: 4, level: 'low', lastUpdated: new Date() },
    ow: { count: 16, level: 'medium', lastUpdated: new Date() },
    su: { count: 8, level: 'low', lastUpdated: new Date() },
    paula: { count: 2, level: 'low', lastUpdated: new Date() },
    tims: { count: 12, level: 'medium', lastUpdated: new Date() },
  };
  
  return mockData[locationId] || { count: 0, level: 'unknown', lastUpdated: new Date() };
};

export const getCrowdLevelColor = (level) => {
  switch (level) {
    case 'low':
      return '#4CAF50'; // Green
    case 'medium':
      return '#FF9800'; // Orange
    case 'high':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Gray
  }
};

export const getCrowdLevelText = (level) => {
  switch (level) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    default:
      return 'Unknown';
  }
};
