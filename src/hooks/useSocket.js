import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || "http://localhost:3001";


/**
 * @deprecated Use useWebSocket instead for the new unified websocket architecture
 * This hook is kept for backward compatibility but will be removed in future versions
 */
const useSocket = (eventHandlers = {}) => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    // Register event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketRef.current.on(event, handler);
    });

    return () => {
      // Cleanup event handlers and disconnect
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socketRef.current.off(event, handler);
      });
      socketRef.current.disconnect();
    };
  }, [eventHandlers]);

  return socketRef.current;
};

export default useSocket;
