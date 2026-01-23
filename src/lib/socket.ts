
"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = () => {
  if (typeof window === "undefined") return null as unknown as Socket;

  if (!socket) {
    // Use environment variable or current origin, fall back to localhost
    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");


    socket = io(socketUrl, {
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });



    socket.on("connect_error", (error) => {
    });
  }
  return socket;
};
