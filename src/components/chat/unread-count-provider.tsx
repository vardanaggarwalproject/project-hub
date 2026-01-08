"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";

interface UnreadCountContextType {
    unreadCounts: Record<string, number>;
    totalUnread: number;
    refreshUnread: () => Promise<void>;
    clearUnread: (projectId: string) => void;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = authClient.useSession();
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [totalUnread, setTotalUnread] = useState(0);
    const chatsRef = useRef<string[]>([]);
    const lastRefreshRef = useRef<number>(0);

    const refreshUnread = useCallback(async () => {
        if (!session?.user) return;
        const now = Date.now();
        if (now - lastRefreshRef.current < 1000) return; // Debounce 1s
        lastRefreshRef.current = now;

        try {
            const res = await fetch("/api/chat/unread-counts");
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data === "object" && !Array.isArray(data)) {
                    setUnreadCounts(prev => {
                        // Merge logic: keep local increments if they aren't reflected in server yet?
                        // Actually, server is usually ahead or behind. 
                        // For now, full overwrite to stay in sync with DB source of truth.
                        return data;
                    });
                }
            }
        } catch (err) {
            console.error("Failed to refresh unread counts:", err);
        }
    }, [session?.user]);

    const clearUnread = useCallback((projectId: string) => {
        setUnreadCounts(prev => {
            if (prev[projectId] === 0) return prev;
            return { ...prev, [projectId]: 0 };
        });
    }, []);

    useEffect(() => {
        if (session?.user) {
            refreshUnread();
        }
    }, [session?.user, refreshUnread]);

    useEffect(() => {
        const total = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);
        setTotalUnread(total);
    }, [unreadCounts]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !session?.user) return;

        const onMessage = (data: any) => {
            if (data.projectId && data.senderId !== session.user.id) {
                console.log("📨 [Socket] Global increment for:", data.projectId);
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.projectId]: (prev[data.projectId] || 0) + 1
                }));
            }
        };

        const onRead = (data: any) => {
            if (data.userId === session.user.id && data.projectId) {
                console.log("👁️ [Socket] Global clear for:", data.projectId);
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.projectId]: 0
                }));
            }
        };

        const onAssigned = (data: any) => {
            if (data.userId === session.user.id) {
                refreshUnread();
                if (data.projectId) {
                    socket.emit("join-room", data.projectId);
                }
            }
        };

        socket.on("message", onMessage);
        socket.on("messages-read", onRead);
        socket.on("user-assigned-to-project", onAssigned);

        return () => {
            socket.off("message", onMessage);
            socket.off("messages-read", onRead);
            socket.off("user-assigned-to-project", onAssigned);
        };
    }, [session?.user, refreshUnread]);

    // Join rooms for all projects
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !session?.user) return;

        const fetchAndJoin = async () => {
            try {
                // Fetch groups to know which rooms to join
                const res = await fetch("/api/chat-groups");
                if (res.ok) {
                    const chats = await res.json();
                    if (Array.isArray(chats)) {
                        const projectIds = chats.map(c => c.projectId);
                        
                        // Only join if projectIds has changed or on initial connect
                        socket.emit("join-rooms", projectIds);
                        console.log(`🔊 [UnreadCount] Joined ${projectIds.length} rooms`);
                        chatsRef.current = projectIds;
                    }
                }
            } catch (err) {
                console.error("Failed to join rooms:", err);
            }
        };

        if (socket.connected) {
            fetchAndJoin();
        }

        const onConnect = () => {
            fetchAndJoin();
            refreshUnread();
        };

        socket.on("connect", onConnect);
        return () => {
            socket.off("connect", onConnect);
        };
    }, [session?.user]);

    return (
        <UnreadCountContext.Provider value={{ unreadCounts, totalUnread, refreshUnread, clearUnread }}>
            {children}
        </UnreadCountContext.Provider>
    );
}

export const useUnreadCounts = () => {
    const context = useContext(UnreadCountContext);
    if (context === undefined) {
        throw new Error("useUnreadCounts must be used within an UnreadCountProvider");
    }
    return context;
};
