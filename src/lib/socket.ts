
"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = () => {
  if (typeof window === "undefined") return null as unknown as Socket;

  if (!socket) {
    const isDevelopment = process.env.NODE_ENV === "development";
    // Use the current origin in browser, fall back to localhost in dev if needed
    const socketUrl = isDevelopment ? "http://localhost:3000" : window.location.origin;

    console.log("🔌 Initializing socket connection to:", socketUrl);

    socket = io(socketUrl, {
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
    });
  }
  return socket;
};
