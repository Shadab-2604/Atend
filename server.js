const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Attach io instance globally for API route handlers to emit events
  global.io = io;

  io.on("connection", (socket) => {
    console.log("[WebSocket] Client connected:", socket.id);

    socket.on("join", ({ userId, role }) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[WebSocket] ${socket.id} joined room user:${userId}`);
      }
      if (role === "admin") {
        socket.join("admin");
        console.log(`[WebSocket] ${socket.id} joined room admin`);
      }
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log("\x1b[1m\x1b[36m%s\x1b[0m", "============================================================");
    console.log("\x1b[1m\x1b[36m%s\x1b[0m", `   🚀 AttendFlow Server running with WebSockets on http://localhost:${port}`);
    console.log("\x1b[1m\x1b[36m%s\x1b[0m", "============================================================\n");
  });
});
