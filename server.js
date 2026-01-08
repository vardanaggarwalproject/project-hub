
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
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

  // Attach io to global object for API routes to access
  global.io = io;

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("join-room", (projectId) => {
      socket.join(projectId);
      console.log(`📥 Socket ${socket.id} joined room ${projectId}`);
    });

    socket.on("join-rooms", (projectIds) => {
      if (Array.isArray(projectIds)) {
        projectIds.forEach(id => socket.join(id));
        console.log(`📥 Socket ${socket.id} joined multiple rooms:`, projectIds);
      }
    });

    socket.on("leave-room", (projectId) => {
      socket.leave(projectId);
      console.log(`📤 Socket ${socket.id} left room ${projectId}`);
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

    socket.on("mark-read", (data) => {
      console.log(`👁️ Broadcasting read status for room ${data.projectId} by user ${data.userId}`);
      io.to(data.projectId).emit("messages-read", data);
    });

    socket.on("project-deleted", (data) => {
      console.log(`🗑️ Project deleted: ${data.projectId}`);
      // Broadcast to ALL clients so they can remove it from lists/redirect
      io.emit("project-deleted", { projectId: data.projectId });
    });

    socket.on("project-created", (data) => {
      console.log(`🆕 SERVER RECEIVED project-created: ${data.projectId}. Broadcasting to all clients...`);
      // Broadcast to ALL clients so assigned users can be notified
      io.emit("project-created", data);
    });

    socket.on("disconnect", () => {
      // console.log("❌ Client disconnected:", socket.id);
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
