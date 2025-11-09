// Mock WebSocket service for testing without backend
// Simulates the exact JSON format your FastAPI backend will send

import { getLocationIdByName } from '../constants/Locations';

// Mock data that simulates your FastAPI backend response
const MOCK_DATA = [
  {
    location_name: "Flint Hall",
    timestamp: new Date().toISOString(),
    people_detected: 4,
    occupancy_percent: 25.5
  },
  {
    location_name: "O'Brian Hall",
    timestamp: new Date().toISOString(),
    people_detected: 16,
    occupancy_percent: 65.0
  },
  {
    location_name: "Student Union",
    timestamp: new Date().toISOString(),
    people_detected: 8,
    occupancy_percent: 40.0
  },
  {
    location_name: "Paula Plaza",
    timestamp: new Date().toISOString(),
    people_detected: 2,
    occupancy_percent: 10.0
  },
  {
    location_name: "Tim Hortons Study Area",
    timestamp: new Date().toISOString(),
    people_detected: 12,
    occupancy_percent: 55.0
  }
];

// Simulate data changes over time
const generateMockData = () => {
  return MOCK_DATA.map(location => {
    // Add some random variation to make it feel real
    const variation = (Math.random() - 0.5) * 4; // ±2 people variation
    const newCount = Math.max(0, Math.round(location.people_detected + variation));

    // Recalculate occupancy based on new count (assuming ~16 max capacity for demo)
    const maxCapacity = 20; // Adjust based on your actual capacity
    const newOccupancy = Math.min(100, Math.max(0, (newCount / maxCapacity) * 100));

    return {
      ...location,
      people_detected: newCount,
      occupancy_percent: parseFloat(newOccupancy.toFixed(1)),
      timestamp: new Date().toISOString(),
    };
  });
};

/**
 * Mock WebSocket service that simulates real WebSocket behavior
 * Use this to test your UI without needing the actual backend
 */
export const createMockWebSocket = (onMessage, onOpen, onError, onClose) => {
  let intervalId = null;
  let isConnected = false;
  let messageCount = 0;

  const connect = () => {
    console.log('🔧 [MOCK] WebSocket connecting...');

    // Simulate connection delay
    setTimeout(() => {
      isConnected = true;
      console.log('🔧 [MOCK] WebSocket connected');
      if (onOpen) onOpen();

      // Send initial data
      const initialData = generateMockData();
      if (onMessage) onMessage(initialData);
      messageCount++;

      // Simulate periodic updates (every 3 seconds)
      intervalId = setInterval(() => {
        if (isConnected) {
          const updatedData = generateMockData();
          if (onMessage) onMessage(updatedData);
          messageCount++;
          console.log(`🔧 [MOCK] Sent update #${messageCount}`);
        }
      }, 3000);
    }, 500);
  };

  const disconnect = () => {
    console.log('🔧 [MOCK] WebSocket disconnecting...');
    isConnected = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (onClose) onClose({ code: 1000, reason: 'Normal closure' });
  };

  const sendMessage = (message) => {
    console.log('🔧 [MOCK] Message sent:', message);
    return true;
  };

  // Auto-connect on initialization
  connect();

  return {
    isConnected: () => isConnected,
    connect,
    disconnect,
    sendMessage,
  };
};

// Export mock data for direct testing
export { MOCK_DATA, generateMockData };

