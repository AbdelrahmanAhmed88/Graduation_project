import React, { createContext, useContext, useEffect, useRef } from "react";

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send("Screen connected");
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // console.log(msg);
        if (!msg.type || !msg.message) return;
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = (event) => {
      console.warn(`WebSocket closed: ${event.code}`, event.reason || "");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socketRef}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
