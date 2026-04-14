# Real-time Features with Socket.IO

> **Last Updated:** 2026-02-02
> **Library:** Socket.IO 4.x
> **Server:** Custom Node.js + Next.js

---

## Table of Contents

1. [Overview](#overview)
2. [Server Setup](#server-setup)
3. [Client Setup](#client-setup)
4. [Room Architecture](#room-architecture)
5. [Events Reference](#events-reference)
6. [Chat Implementation](#chat-implementation)
7. [Notifications](#notifications)
8. [Best Practices](#best-practices)

---

## Overview

Project Hub uses **Socket.IO** for real-time bi-directional communication between clients and server.

### Use Cases

- **Real-time chat** - Project-based messaging
- **Live notifications** - In-app notification delivery
- **Typing indicators** - Show who's typing (planned)
- **Task updates** - Live task board updates (planned)
- **Presence** - Online/offline status (planned)

### Why Socket.IO?

✅ **Bi-directional** - Server can push to clients
✅ **Automatic reconnection** - Handles network issues
✅ **Room support** - Easy broadcasting to groups
✅ **Fallback** - Works even if WebSocket blocked
✅ **Battle-tested** - Production-ready library

---

## Server Setup

### Custom Server Configuration

Project Hub uses a **custom Node.js server** to integrate Socket.IO with Next.js.

Location: `server.js` (root directory)

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, parsedUrl, res);
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user room
    socket.on('join-user-room', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join project chat room
    socket.on('join-chat-room', (projectId) => {
      socket.join(`group:${projectId}`);
      console.log(`Socket ${socket.id} joined group:${projectId}`);
    });

    // Leave chat room
    socket.on('leave-chat-room', (projectId) => {
      socket.leave(`group:${projectId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      const { projectId, senderId, content } = data;

      // Save to database
      const message = await saveMessage({ projectId, senderId, content });

      // Broadcast to room
      io.to(`group:${projectId}`).emit('new-message', message);
    });

    // Typing indicator
    socket.on('typing', ({ projectId, userId, userName }) => {
      socket.to(`group:${projectId}`).emit('user-typing', {
        userId,
        userName,
      });
    });

    // Stop typing
    socket.on('stop-typing', ({ projectId, userId }) => {
      socket.to(`group:${projectId}`).emit('user-stopped-typing', {
        userId,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

### Environment Variables

```bash
# .env
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
```

### Start Command

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

---

## Client Setup

### Socket.IO Client Configuration

Location: `src/lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket!.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

### Using Socket in Components

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export function ChatComponent({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState([]);
  const socket = getSocket();

  useEffect(() => {
    // Join room
    socket.emit('join-chat-room', projectId);

    // Listen for new messages
    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Cleanup
    return () => {
      socket.emit('leave-chat-room', projectId);
      socket.off('new-message');
    };
  }, [projectId, socket]);

  const sendMessage = (content: string) => {
    socket.emit('send-message', {
      projectId,
      senderId: currentUser.id,
      content,
    });
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
}
```

---

## Room Architecture

### Room Types

Socket.IO rooms organize clients into groups for targeted broadcasting.

#### 1. User Rooms

**Pattern:** `user:${userId}`

**Purpose:** Private notifications for specific user

**Example:**
```typescript
// Server
io.to(`user:${userId}`).emit('notification', {
  title: 'New Message',
  message: 'You have a new chat message',
});

// Client
socket.emit('join-user-room', currentUser.id);
socket.on('notification', (data) => {
  showNotification(data);
});
```

#### 2. Chat Group Rooms

**Pattern:** `group:${projectId}`

**Purpose:** Project-based chat broadcasting

**Example:**
```typescript
// Server
io.to(`group:${projectId}`).emit('new-message', message);

// Client
socket.emit('join-chat-room', projectId);
socket.on('new-message', (message) => {
  addMessageToChat(message);
});
```

#### 3. Task Rooms (Planned)

**Pattern:** `task:${taskId}`

**Purpose:** Real-time task updates

```typescript
// Future implementation
io.to(`task:${taskId}`).emit('task-updated', taskData);
```

### Room Management

```typescript
// Join multiple rooms
socket.emit('join-user-room', userId);
socket.emit('join-chat-room', projectId1);
socket.emit('join-chat-room', projectId2);

// Leave room
socket.emit('leave-chat-room', projectId);

// Server: Get all sockets in a room
const socketsInRoom = await io.in(`group:${projectId}`).fetchSockets();
console.log(`${socketsInRoom.length} users in chat`);
```

---

## Events Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-user-room` | `userId: string` | Join personal notification room |
| `join-chat-room` | `projectId: string` | Join project chat room |
| `leave-chat-room` | `projectId: string` | Leave project chat room |
| `send-message` | `{ projectId, senderId, content }` | Send chat message |
| `typing` | `{ projectId, userId, userName }` | User is typing |
| `stop-typing` | `{ projectId, userId }` | User stopped typing |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new-message` | `Message` | New chat message received |
| `notification` | `Notification` | In-app notification |
| `user-typing` | `{ userId, userName }` | Someone is typing |
| `user-stopped-typing` | `{ userId }` | Someone stopped typing |
| `task-updated` | `Task` | Task changed (planned) |
| `user-joined` | `User` | User joined chat (planned) |
| `user-left` | `User` | User left chat (planned) |

### Connection Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | - | Socket connected |
| `disconnect` | `reason: string` | Socket disconnected |
| `connect_error` | `Error` | Connection failed |
| `reconnect` | `attempt: number` | Reconnected after disconnect |

---

## Chat Implementation

### Complete Chat Flow

#### 1. Client Sends Message

```tsx
// src/components/chat/chat-window.tsx
const sendMessage = async (content: string) => {
  // Optimistic update
  const tempMessage = {
    id: 'temp-' + Date.now(),
    content,
    senderId: currentUser.id,
    sender: currentUser,
    createdAt: new Date().toISOString(),
  };
  setMessages([...messages, tempMessage]);

  try {
    // Save to database via API
    const response = await apiClient.post('/api/chat', {
      projectId,
      content,
    });

    // Replace temp message with real one
    setMessages((prev) =>
      prev.map((m) => (m.id === tempMessage.id ? response.data : m))
    );

    // Socket.IO will broadcast to others
  } catch (error) {
    // Rollback on error
    setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    toast.error('Failed to send message');
  }
};
```

#### 2. Server Handles Message

```javascript
// server.js
socket.on('send-message', async (data) => {
  const { projectId, senderId, content } = data;

  try {
    // Save to database
    const message = await saveMessageToDb({
      projectId,
      senderId,
      content,
    });

    // Broadcast to all users in chat room (including sender)
    io.to(`group:${projectId}`).emit('new-message', message);

    // Send notification to offline users
    await sendChatNotifications(projectId, message);
  } catch (error) {
    socket.emit('error', { message: 'Failed to send message' });
  }
});
```

#### 3. Other Clients Receive Message

```tsx
useEffect(() => {
  socket.on('new-message', (message) => {
    // Only add if not already in list (avoid duplicates)
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });

    // Play notification sound
    if (message.senderId !== currentUser.id) {
      playNotificationSound();
    }

    // Update unread count
    if (document.hidden) {
      incrementUnreadCount(projectId);
    }
  });

  return () => {
    socket.off('new-message');
  };
}, []);
```

### Typing Indicators

```tsx
// src/components/chat/message-input.tsx
const [isTyping, setIsTyping] = useState(false);
const typingTimeout = useRef<NodeJS.Timeout | null>(null);

const handleTyping = () => {
  if (!isTyping) {
    setIsTyping(true);
    socket.emit('typing', {
      projectId,
      userId: currentUser.id,
      userName: currentUser.name,
    });
  }

  // Clear existing timeout
  if (typingTimeout.current) {
    clearTimeout(typingTimeout.current);
  }

  // Stop typing after 3 seconds of inactivity
  typingTimeout.current = setTimeout(() => {
    setIsTyping(false);
    socket.emit('stop-typing', {
      projectId,
      userId: currentUser.id,
    });
  }, 3000);
};

// Display typing indicator
socket.on('user-typing', ({ userName }) => {
  setTypingUsers((prev) => [...prev, userName]);
});

socket.on('user-stopped-typing', ({ userId }) => {
  setTypingUsers((prev) => prev.filter((u) => u.id !== userId));
});
```

---

## Notifications

### Real-time Notification Delivery

```typescript
// server.js (or separate notification service)
async function sendNotificationToUser(userId: string, notification: any) {
  // Save to database
  await db.insert(appNotifications).values({
    userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
  });

  // Send via Socket.IO
  io.to(`user:${userId}`).emit('notification', notification);
}

// Client
socket.on('notification', (notification) => {
  // Show toast
  toast.info(notification.title, {
    description: notification.message,
  });

  // Update notification badge
  incrementNotificationCount();

  // Play sound
  playNotificationSound();
});
```

---

## Best Practices

### 1. Authentication

Validate user identity on socket connection:

```javascript
// server.js
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const user = await verifyToken(token);
    socket.userId = user.id;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

### 2. Error Handling

```typescript
// Client
socket.on('error', (error) => {
  console.error('Socket error:', error);
  toast.error(error.message);
});

// Server
try {
  // ... operation
} catch (error) {
  socket.emit('error', { message: 'Operation failed' });
}
```

### 3. Reconnection Logic

```typescript
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);

  // Re-join rooms
  socket.emit('join-user-room', currentUser.id);
  activeChats.forEach((projectId) => {
    socket.emit('join-chat-room', projectId);
  });

  // Sync missed messages
  syncMissedMessages();
});
```

### 4. Memory Management

```typescript
// Clean up listeners
useEffect(() => {
  const handler = (data) => {
    // ...
  };

  socket.on('new-message', handler);

  return () => {
    socket.off('new-message', handler);
  };
}, []);
```

### 5. Rate Limiting

```javascript
// server.js
const rateLimiter = new Map();

socket.on('send-message', (data) => {
  const userId = socket.userId;
  const now = Date.now();
  const userLimit = rateLimiter.get(userId) || [];

  // Allow 10 messages per minute
  const recentMessages = userLimit.filter((time) => now - time < 60000);

  if (recentMessages.length >= 10) {
    socket.emit('error', { message: 'Rate limit exceeded' });
    return;
  }

  rateLimiter.set(userId, [...recentMessages, now]);

  // Process message
});
```

### 6. Graceful Shutdown

```javascript
// server.js
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');

  // Close Socket.IO
  io.close(() => {
    console.log('Socket.IO closed');
  });

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

---

## Troubleshooting

### Connection Issues

**Symptom:** Socket not connecting

**Solutions:**
1. Check server is running with custom `server.js`
2. Verify `NEXT_PUBLIC_APP_URL` in `.env`
3. Check CORS configuration
4. Try different transport (polling vs websocket)

```typescript
// Force polling
const socket = io({
  transports: ['polling'],
});
```

### Missing Messages

**Symptom:** Some messages not received

**Solutions:**
1. Ensure room was joined before emission
2. Check for duplicate listeners
3. Verify message saved to DB
4. Implement missed message sync on reconnect

### High Latency

**Symptom:** Delayed message delivery

**Solutions:**
1. Use WebSocket transport (not polling)
2. Reduce payload size
3. Implement message batching
4. Check server resources

---

## Future Enhancements

### Planned Features

- [ ] **Presence system** - Online/offline status
- [ ] **Read receipts** - Message read indicators
- [ ] **File sharing** - Real-time file uploads
- [ ] **Video calls** - WebRTC integration
- [ ] **Screen sharing** - Collaboration feature
- [ ] **Message reactions** - Emoji reactions
- [ ] **Message threading** - Reply to messages

---

## Related Documentation

- [Chat System](../features/chat-system.md)
- [Notification System](../features/notifications.md)
- [API Routes](../api/routes-reference.md)

---

**Last Updated:** 2026-02-02
**Socket.IO Version:** 4.x
