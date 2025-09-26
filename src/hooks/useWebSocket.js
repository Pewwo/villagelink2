// src/hooks/useWebSocket.js
import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3001';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export function useWebSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [newData, setNewData] = useState(null);
  const [error, setError] = useState(null);
  const clientIdRef = useRef(`client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Initialize client connection (Step 1: Web Client -> API)
  const initialize = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientIdRef.current
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Client initialized:', result);
      setIsInitialized(true);
      return result;

    } catch (err) {
      console.error('Error initializing client:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Connect to socket server (Step 2: API -> Socket Server)
  useEffect(() => {
    if (!isInitialized) return;

    const s = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
    setSocket(s);

    s.on('connect', () => {
      console.log('Connected to socket server', s.id);
      setIsConnected(true);

      // Register client with socket server (Step 3: Create Listeners)
      s.emit('register', clientIdRef.current);
      console.log('Client registered with socket server');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // Handle new data events (Step 8: Web Client -> new data)
    s.on('newData', (data) => {
      console.log('Received new data:', data);
      setNewData(data);
    });

    // Handle refresh data events
    s.on('refreshData', (data) => {
      console.log('Received refresh data:', data);
      setNewData(data);
    });

    // Handle table data events
    s.on('tableData', (data) => {
      console.log('Received table data:', data);
      setNewData({ table: 'initial', data });
    });

    return () => {
      s.disconnect();
    };
  }, [isInitialized]);

  // Emit newData event (Step 4: API -> Emit "newData")
  const emitNewData = useCallback((table, data) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected, cannot emit newData');
      return false;
    }

    socket.emit('newData', { table, data, timestamp: new Date() });
    console.log('Emitted newData event:', { table, data });
    return true;
  }, [socket, isConnected]);

  // Fetch all data from API (Step 6: API -> fetch all new data)
  const fetchAllData = useCallback(async (table) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/fetchAllData?table=${encodeURIComponent(table)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Fetched all data:', result);
      return result;

    } catch (err) {
      console.error('Error fetching all data:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Clear new data
  const clearNewData = useCallback(() => {
    setNewData(null);
  }, []);

  return {
    socket,
    isConnected,
    isInitialized,
    newData,
    error,
    clientId: clientIdRef.current,
    initialize,
    emitNewData,
    fetchAllData,
    clearNewData
  };
}
