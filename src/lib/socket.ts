import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const isVercel = window.location.hostname.includes("vercel.app");
  if (isVercel && !SERVER_URL) {
    return null;
  }

  if (!socket) {
    const targetUrl = SERVER_URL || window.location.origin;
    socket = io(targetUrl, {
      autoConnect: true,
      reconnection: false,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to server:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected from server");
    });

    socket.on("connect_error", () => {
      if (socket) {
        socket.disconnect();
      }
    });
  }

  return socket;
}
