
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

    // 1. Private User Room (for notifications, unread counts, etc.)
    socket.on("register-user", (userId) => {
      if (!userId) return;
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      console.log(`👤 User ${userId} registered to private room: ${userRoom}`);
      console.log(`📋 Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
    });

    // 2. On-Demand Group Joins
    socket.on("join-group", (projectId) => {
      if (!projectId) return;
      const groupRoom = `group:${projectId}`;
      socket.join(groupRoom);
      console.log(`📥 Socket ${socket.id} joined group: ${groupRoom}`);
      console.log(`📋 Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
      
      // Log all sockets in this room
      io.in(groupRoom).fetchSockets().then(sockets => {
        console.log(`👥 Total sockets in ${groupRoom}: ${sockets.length}`);
      });
    });

    socket.on("leave-group", (projectId) => {
      if (!projectId) return;
      const groupRoom = `group:${projectId}`;
      socket.leave(groupRoom);
      console.log(`📤 Socket ${socket.id} left group: ${groupRoom}`);
      console.log(`📋 Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
    });

    // 3. Optimized Message Broadcasting
    socket.on("send-message", (data) => {
      const { projectId, content, senderId } = data;
      if (!projectId) return;

      const groupRoom = `group:${projectId}`;
      console.log(`📤 Broadcasting message to group ${groupRoom}`);

      // Broadcast to everyone currently in the active chat room
      io.to(groupRoom).emit("message", data);

      // Note: Unread counts for users NOT in the room are handled by the API 
      // or can be triggered here. For now, we'll emit a global signal 
      // to user rooms if the architecture requires server-side pushes.
    });

    // 4. Team & Assignment Events (Targeted)
    socket.on("assignment-added", (data) => {
      // Notify the specific user via their private room
      io.to(`user:${data.userId}`).emit("user-assigned-to-project", {
        ...data,
        action: "added"
      });
      
      // Notify the project group
      io.to(`group:${data.projectId}`).emit("team-member-added", {
        userId: data.userId,
        userName: data.userName
      });
    });

    socket.on("assignment-removed", (data) => {
      io.to(`user:${data.userId}`).emit("user-removed-from-project", {
        ...data,
        action: "removed"
      });
      
      io.to(`group:${data.projectId}`).emit("team-member-removed", {
        userId: data.userId,
        userName: data.userName
      });
    });

    // 5. Read Status Synchronization
    socket.on("mark-read", (data) => {
      const { projectId, userId } = data;
      const groupRoom = `group:${projectId}`;
      console.log(`👁️ Read status sync for ${groupRoom} by ${userId}`);
      io.to(groupRoom).emit("messages-read", data);
    });

    // Task Comments Events
    socket.on("task:join", (taskId, callback) => {
      console.log(`🔔 Received task:join event for taskId: ${taskId}`);
      if (!taskId) {
        console.error("❌ task:join called with empty taskId");
        return;
      }
      const taskRoom = `task:${taskId}`;
      socket.join(taskRoom);
      console.log(`📝 Socket ${socket.id} joined task: ${taskRoom}`);
      console.log(`📋 Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));

      // Send acknowledgment back to client
      if (callback) callback({ success: true, room: taskRoom });
    });

    socket.on("task:leave", (taskId) => {
      if (!taskId) return;
      const taskRoom = `task:${taskId}`;
      socket.leave(taskRoom);
      console.log(`📝 Socket ${socket.id} left task: ${taskRoom}`);
    });

    // 6. Global System Events (Broadcast to all)
    socket.on("project-deleted", (data) => {
      console.log(`🗑️ Project deleted: ${data.projectId}`);
      io.emit("project-deleted", { projectId: data.projectId });
    });

    socket.on("project-created", (data) => {
      console.log(`🆕 Project created: ${data.projectId}`);
      io.emit("project-created", data);
    });

    socket.on("disconnect", () => {
      // Cleanup handled by Socket.IO automatically
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
