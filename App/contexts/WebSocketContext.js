import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { createMockWebSocket } from '../services/mockWebSocket';
import { USE_MOCK_DATA } from '../config/websocket';
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
  // Note: useWebSocket hook is always called (React rules), but it won't connect if USE_MOCK_DATA is true
  const realWebSocket = useWebSocket();
  const mockWSRef = useRef(null);

  // Handle mock WebSocket
  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Only create mock WebSocket if it doesn't exist
      if (!mockWSRef.current) {
        mockWSRef.current = createMockWebSocket(
          (data) => {
            // Handle incoming messages (can be array or single object)
            const messages = Array.isArray(data) ? data : [data];
            
            messages.forEach(message => {
              const locationId = getLocationIdByName(message.location_name);
              if (locationId) {
                setCrowdData(prev => ({
                  ...prev,
                  [locationId]: {
                    count: message.people_detected,
                    level: calculateCrowdLevel(message.occupancy_percent),
                    occupancyPercent: message.occupancy_percent,
                    lastUpdated: new Date(message.timestamp),
                    locationName: message.location_name,
                  },
                }));
              }
            });
          },
          () => {
            setIsConnected(true);
            setError(null);
          },
          (err) => {
            setError(err);
            setIsConnected(false);
          },
          () => {
            setIsConnected(false);
          }
        );
      }

      return () => {
        if (mockWSRef.current) {
          mockWSRef.current.disconnect();
          mockWSRef.current = null;
        }
      };
    }
  }, []); // Empty dependency array - only run once

  // Handle real WebSocket
  useEffect(() => {
    if (!USE_MOCK_DATA) {
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
                lastUpdated: new Date(msg.timestamp),
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
    }
  }, [USE_MOCK_DATA]); // Only depend on USE_MOCK_DATA

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

