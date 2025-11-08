export const fetchCrowdData = async (locationId) => {
  try {
    const response = await fetch(`${BASE_URL}/locations/${locationId}/crowd`);
    if (!response.ok) {
      throw new Error('Failed to fetch crowd data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching crowd data:', error);
    return {
      count: 0,
      level: 'unknown',
      lastUpdated: new Date(),
    };
  }
};

export const fetchAllLocations = async () => {
  try {
    const response = await fetch(`${BASE_URL}/locations`);
    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};