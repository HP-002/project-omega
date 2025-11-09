// Study space locations at UB
export const LOCATIONS = [
  {
    id: 'flint',
    name: 'Flint Loop',
    description: 'The Flint Loop seating area offers a calm, open-air space ideal for studying or relaxing between classes. With plenty of benches and tables, it\'s a popular spot to catch up on readings, collaborate on group projects, or enjoy a quiet moment outdoors. Its proximity to the shuttle stop also makes it a convenient study corner for students transitioning between North and South Campus.',
    image: require('../assets/locations/flint-loop.jpg'),
    coordinates: {
      latitude: 43.0014,
      longitude: -78.7890,
    },
  },
  {
    id: 'ow',
    name: 'One World',
    description: 'This bright and spacious place features long communal tables, counter seating, and open work areas where students gather to study, relax, eat, or meet friends between classes. With its large windows and steady foot traffic, it\'s one of UB\'s most active indoor zones.',
    image: require('../assets/locations/one-world.jpg'),
    coordinates: {
      latitude: 43.0018,
      longitude: -78.7895,
    },
  },
  {
    id: 'su',
    name: 'Student Union',
    description: 'The Student Union serves as the central hub for student life, activity, and collaboration. This building offers a welcoming and relaxing social heart of campus, providing services, lounge spaces, and shared areas for building community.',
    image: require('../assets/locations/student-union.jpg'),
    coordinates: {
      latitude: 43.0020,
      longitude: -78.7898,
    },
  },
  {
    id: 'su_full',
    name: 'Student Union (Full)',
    description: 'The Student Union serves as the central hub for student life, activity, and collaboration. This building offers a welcoming and relaxing social heart of campus, providing services, lounge spaces, and shared areas for building community.',
    image: require('../assets/locations/student-union.jpg'),
    coordinates: {
      latitude: 43.0020,
      longitude: -78.7898,
    },
  },
  {
    id: 'paula',
    name: 'Paula Plaza',
    description: 'Paula T. Agrusa Plaza is a thoughtfully designed outdoor space located between the Alfiero Center and Park Hall, adjacent to the School of Management. The plaza features a variety of seating options and offers a refreshing spot to enjoy the outdoors. It is perfect for studying, socializing, relaxing, or meeting friends on pleasant weather days.',
    image: require('../assets/locations/paula-plaza.jpg'),
    coordinates: {
      latitude: 43.0016,
      longitude: -78.7892,
    },
  },
  {
    id: 'tims',
    name: 'Tim Hortons',
    description: 'Located inside the Student Union, Tim Hortons is one of the busiest and most popular spots on campus. Students often stop by for coffee, snacks, or quick meetups between classes, making it a frequent gathering point throughout the day.',
    image: require('../assets/locations/tim-hortons.jpg'),
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7888,
    },
  },
];

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
    'student union 3': 'su_full',
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
