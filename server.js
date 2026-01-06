
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-room", (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined room ${projectId}`);
    });

    socket.on("send-message", (data) => {
      // Broadcast to everyone in the room
      io.to(data.projectId).emit("message", data);
    });

    // New events for assignment management
    socket.on("assignment-added", (data) => {
      // data: { projectId, userId, userName }
      // Notify the specific user they've been added
      io.emit("user-assigned-to-project", {
        projectId: data.projectId,
        userId: data.userId,
        userName: data.userName,
        action: "added"
      });
      
      // Also notify the project room
      io.to(data.projectId).emit("team-member-added", {
        userId: data.userId,
        userName: data.userName
      });
    });

    socket.on("assignment-removed", (data) => {
      // data: { projectId, userId, userName }
      // Notify the specific user they've been removed
      io.emit("user-removed-from-project", {
        projectId: data.projectId,
        userId: data.userId,
        userName: data.userName,
        action: "removed"
      });
      
      // Also notify the project room
      io.to(data.projectId).emit("team-member-removed", {
        userId: data.userId,
        userName: data.userName
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
