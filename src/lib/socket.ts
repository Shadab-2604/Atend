import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL || typeof window !== "undefined" ? window.location.origin : "http://localhost:3000", {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to server:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected from server");
    });

    socket.on("connect_error", () => {
      // Gracefully silence websocket errors when running in serverless Vercel environment
    });
  }

  return socket;
}
