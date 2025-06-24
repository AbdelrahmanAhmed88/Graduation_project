import React, { createContext, useEffect, useRef, useState } from "react";

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ Connected to WebSocket server");
      socket.send("Screen connected");
      setSocketReady(true);
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    socket.onclose = (event) => {
      console.warn(`🔌 WebSocket closed: ${event.code}`, event.reason || "");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current, socketRef, socketReady }}>
      {children}
    </WebSocketContext.Provider>
  );
};
