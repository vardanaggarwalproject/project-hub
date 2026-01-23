/**
 * Socket Notification Channel
 * 
 * Sends real-time notifications via Socket.IO.
 * Uses the existing global Socket.IO instance from server.js.
 * This is for in-app notifications that appear immediately.
 */

import { NotificationChannel, NotificationPayload, NotificationTarget } from '../types';

export const socketChannel: NotificationChannel = {
    name: 'socket',

    async send(targets: NotificationTarget[], payload: NotificationPayload): Promise<void> {
        // Access the global Socket.IO instance set by server.js
        const io = (global as { io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } } }).io;

        if (!io) {
            return;
        }

        // Send to each user's private room
        for (const target of targets) {
            const userRoom = `user:${target.userId}`;
            io.to(userRoom).emit('notification', {
                ...payload,
                receivedAt: new Date().toISOString(),
            });
        }

    },
};
