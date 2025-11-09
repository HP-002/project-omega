import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { createMockWebSocket } from '../services/mockWebSocket';
import { LOCATIONS, getLocationIdByName, calculateCrowdLevel } from '../constants/Locations';

const WebSocketContext = createContext(null);

export const useCrowdData = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useCrowdData must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [crowdData, setCrowdData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Use real WebSocket or mock based on config
  // Note: useWebSocket hook is always called (React rules)
  const realWebSocket = useWebSocket();

  // Handle real WebSocket
  useEffect(() => {
      const unsubscribe = realWebSocket.onMessage((message) => {
        // Handle incoming messages (can be array or single object)
        const messages = Array.isArray(message) ? message : [message];
        
        messages.forEach(msg => {
          const locationId = getLocationIdByName(msg.location_name);
          if (locationId) {
            setCrowdData(prev => ({
              ...prev,
              [locationId]: {
                count: msg.people_detected,
                level: calculateCrowdLevel(msg.occupancy_percent),
                occupancyPercent: msg.occupancy_percent,
                lastUpdated: new Date(),
                locationName: msg.location_name,
              },
            }));
          }
        });
      });

      // Update connection state from real WebSocket
      const updateConnectionState = () => {
        setIsConnected(realWebSocket.isConnected);
        setError(realWebSocket.error);
        setReconnectAttempts(realWebSocket.reconnectAttempts);
      };

      // Initial state
      updateConnectionState();

      // Set up interval to check connection state (since realWebSocket object changes)
      const interval = setInterval(updateConnectionState, 1000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
  }, []);

  const getCrowdData = useCallback((locationId) => {
    return crowdData[locationId] || {
      count: 0,
      level: 'unknown',
      occupancyPercent: null,
      lastUpdated: new Date(),
      locationName: null,
    };
  }, [crowdData]);

  const getLocationsWithCrowd = useCallback(() => {
    return LOCATIONS.map(location => ({
      ...location,
      crowdData: getCrowdData(location.id),
    }));
  }, [getCrowdData]);

  const value = {
    crowdData,
    isConnected,
    error,
    reconnectAttempts,
    getCrowdData,
    getLocationsWithCrowd,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

