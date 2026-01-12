"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";

interface UnreadCountContextType {
    unreadCounts: Record<string, number>;
    totalUnread: number;
    refreshUnread: () => Promise<void>;
    clearUnread: (projectId: string) => void;
    setActiveProjectId: (projectId: string | null) => void;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = authClient.useSession();
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [totalUnread, setTotalUnread] = useState(0);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const activeProjectIdRef = useRef<string | null>(null);
    const lastRefreshRef = useRef<number>(0);

    useEffect(() => {
        activeProjectIdRef.current = activeProjectId;
    }, [activeProjectId]);

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
                    console.log(`🔄 [UnreadCount] API returned counts:`, data);
                    
                    // CRITICAL FIX: Merge with existing counts
                    // API only returns projects user is assigned to
                    // But socket events can increment counts for ANY project
                    // So we need to preserve socket increments
                    setUnreadCounts(prev => {
                        const merged = { ...prev }; // Start with current state
                        
                        // Update with API data, but keep higher values
                        Object.keys(data).forEach(projectId => {
                            const apiCount = data[projectId] || 0;
                            const currentCount = prev[projectId] || 0;
                            // Take the maximum to preserve socket increments
                            merged[projectId] = Math.max(apiCount, currentCount);
                        });
                        
                        console.log(`🔄 [UnreadCount] Merged counts:`, merged);
                        return merged;
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
            console.log(`📨 [UnreadCount] Received message event:`, data);
            console.log(`📨 [UnreadCount] Active project: ${activeProjectIdRef.current}, Message project: ${data.projectId}`);
            
            // Only increment if we are NOT currently looking at this project
            // and it's not our own message
            if (data.projectId && 
                data.senderId !== session.user.id && 
                data.projectId !== activeProjectIdRef.current) {
                
                console.log(`📈 [UnreadCount] Incrementing unread for background project: ${data.projectId}`);
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.projectId]: (prev[data.projectId] || 0) + 1
                }));
            } else {
                console.log(`⏭️ [UnreadCount] Skipping increment - active project or own message`);
            }
        };

        const onRead = (data: any) => {
            console.log(`👁️ [UnreadCount] Received read event:`, data);
            if (data.userId === session.user.id && data.projectId) {
                console.log(`🔄 [UnreadCount] Clearing unread for: ${data.projectId}`);
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.projectId]: 0
                }));
            }
        };

        const onAssigned = (data: any) => {
            console.log(`👤 [UnreadCount] Received assignment event:`, data);
            if (data.userId === session.user.id) {
                console.log(`🔄 [UnreadCount] Refreshing unread counts due to assignment`);
                refreshUnread();
            }
        };

        const onRemoved = (data: any) => {
            console.log(`👤 [UnreadCount] Received removal event:`, data);
            if (data.userId === session.user.id) {
                console.log(`🔄 [UnreadCount] Refreshing unread counts due to removal`);
                refreshUnread();
            }
        };

        socket.on("message", onMessage);
        socket.on("messages-read", onRead);
        socket.on("user-assigned-to-project", onAssigned);
        socket.on("user-removed-from-project", onRemoved);

        // Register user for private notifications
        console.log(`👤 [UnreadCount] Registering user: ${session.user.id}`);
        socket.emit("register-user", session.user.id);

        return () => {
            socket.off("message", onMessage);
            socket.off("messages-read", onRead);
            socket.off("user-assigned-to-project", onAssigned);
            socket.off("user-removed-from-project", onRemoved);
        };
    }, [session?.user, refreshUnread]);

    // Handle initial connect and re-connect refreshes
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !session?.user) return;

        const onConnect = () => {
            console.log(`🔌 [UnreadCount] Socket connected, registering user and refreshing counts`);
            socket.emit("register-user", session.user.id);
            // CRITICAL: Refresh on connect to catch any offline messages
            refreshUnread();
        };

        const onReconnect = () => {
            console.log(`🔌 [UnreadCount] Socket reconnected, refreshing counts`);
            // User was offline, now back online - refresh to get missed messages
            refreshUnread();
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on("connect", onConnect);
        socket.on("reconnect", onReconnect);
        
        return () => {
            socket.off("connect", onConnect);
            socket.off("reconnect", onReconnect);
        };
    }, [session?.user, refreshUnread]);

    return (
        <UnreadCountContext.Provider value={{ 
            unreadCounts, 
            totalUnread, 
            refreshUnread, 
            clearUnread,
            setActiveProjectId
        }}>
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
