// Study space locations at UB
// Images are loaded conditionally - if they don't exist, placeholders will be shown
export const LOCATIONS = [
  {
    id: 'flint',
    name: 'Flint Loop',
    description: 'Study area in Flint Loop',
    image: null, // Will be set when image file is added
    coordinates: {
      latitude: 43.0014,
      longitude: -78.7890,
    },
  },
  {
    id: 'ow',
    name: 'One World',
    description: 'Study space in One World',
    image: null, // Add require('../assets/locations/obrian.jpg') when image is added
    coordinates: {
      latitude: 43.0018,
      longitude: -78.7895,
    },
  },
  {
    id: 'su',
    name: 'Student Union',
    description: 'Main study area in Student Union',
    image: null, // Will be set when image file is added
    coordinates: {
      latitude: 43.0020,
      longitude: -78.7898,
    },
  },
  {
    id: 'paula',
    name: 'Paula Plaza',
    description: 'Outdoor study space at Paula Plaza',
    image: null, // Add require('../assets/locations/paula-plaza.jpg') when image is added
    coordinates: {
      latitude: 43.0016,
      longitude: -78.7892,
    },
  },
  {
    id: 'tims',
    name: 'Tim Hortons',
    description: 'Tim Hortons',
    image: null, // Add require('../assets/locations/tim-hortons.jpg') when image is added
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7888,
    },
  },
];

// Helper function to load images - uncomment and update when images are added
export const loadLocationImages = () => {
  // Load images as they become available
  // Student Union image is available
  try {
    LOCATIONS[2].image = require('../assets/locations/student-union.jpg');
  } catch (e) {
    // Image not found, keep as null
  }
  
  // Uncomment these lines when you add the other image files:
  /*
  LOCATIONS[0].image = require('../assets/locations/flint.jpg');
  LOCATIONS[1].image = require('../assets/locations/obrian.jpg');
  LOCATIONS[3].image = require('../assets/locations/paula-plaza.jpg');
  LOCATIONS[4].image = require('../assets/locations/tim-hortons.jpg');
  */
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

// Map location names to IDs (case-insensitive)
export const getLocationIdByName = (locationName) => {
  const nameMap = {
    'flint loop': 'flint',
    'flint': 'flint',
    'one world': 'ow',
    'ow': 'ow',
    'student union 1': 'su',
    'student union 2': 'su',
    'student union 3': 'su',
    'su': 'su',
    'paula plaza': 'paula',
    'paula': 'paula',
    'tim hortons': 'tims',
    'tims': 'tims',
  };

  const normalizedName = locationName?.toLowerCase().trim();
  return nameMap[normalizedName] || null;
};

// Calculate crowd level from occupancy percentage
export const calculateCrowdLevel = (occupancyPercent) => {
  if (occupancyPercent === null || occupancyPercent === undefined) {
    return 'unknown';
  }

  if (occupancyPercent < 33) {
    return 'low';
  } else if (occupancyPercent < 67) {
    return 'medium';
  } else {
    return 'high';
  }
};
