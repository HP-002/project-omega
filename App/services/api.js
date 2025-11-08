// API service for fetching crowd data from your server
// Replace BASE_URL with your actual server URL

const BASE_URL = 'http://localhost:3000/api'; // Update with your server URL

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
    // Return mock data as fallback
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

// Example API response format:
// {
//   locationId: "flint",
//   count: 4,
//   level: "low", // "low" | "medium" | "high"
//   lastUpdated: "2024-01-15T10:30:00Z"
// }

