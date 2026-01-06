
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("join-room", (projectId) => {
      socket.join(projectId);
      console.log(`📥 Socket ${socket.id} joined room ${projectId}`);
    });

    socket.on("send-message", (data) => {
      console.log(`📤 Broadcasting message to room ${data.projectId}:`, data.content);
      // Broadcast to everyone in the room
      io.to(data.projectId).emit("message", data);
    });

    // New events for assignment management
    socket.on("assignment-added", (data) => {
      io.emit("user-assigned-to-project", {
        projectId: data.projectId,
        userId: data.userId,
        userName: data.userName,
        action: "added"
      });
      
      io.to(data.projectId).emit("team-member-added", {
        userId: data.userId,
        userName: data.userName
      });
    });

    socket.on("assignment-removed", (data) => {
      io.emit("user-removed-from-project", {
        projectId: data.projectId,
        userId: data.userId,
        userName: data.userName,
        action: "removed"
      });
      
      io.to(data.projectId).emit("team-member-removed", {
        userId: data.userId,
        userName: data.userName
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server running on path: /api/socket`);
    });
});
