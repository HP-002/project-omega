// WebSocket configuration
// Update this URL to match your FastAPI backend WebSocket endpoint

// Set to true to use mock data for testing (when backend isn't ready)
export const USE_MOCK_DATA = false; // Change to false when backend is ready

// CHANGE THIS TO TRUE WHEN BACKEND IS READY!!!

// For local development (use your computer's IP address)
// const WS_URL = 'ws://192.168.1.XXX:8000/ws';

// For production or if backend is on same network
// const WS_URL = 'ws://your-server-ip:8000/ws';

// Replace localhost with your computer's IP address
export const WS_URL = "ws://192.168.1.171:8000/client/ws/connect";

// Alternative: If using a specific endpoint for crowd data
// export const WS_URL = 'ws://localhost:8000/ws/crowd-data';

// Helper function to get WebSocket URL based on environment
export const getWebSocketUrl = () => {
  // You can add environment-based logic here
  // For example, use different URLs for dev/prod
  return WS_URL;
};
