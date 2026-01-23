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
                        
                        return merged;
                    });
                }
            }
        } catch (err) {
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
            
            // Only increment if we are NOT currently looking at this project
            // and it's not our own message
            if (data.projectId && 
                data.senderId !== session.user.id && 
                data.projectId !== activeProjectIdRef.current) {
                
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.projectId]: (prev[data.projectId] || 0) + 1
                }));
            } else {
            }
        };

        const onRead = (data: any) => {
            if (data.userId === session.user.id && data.projectId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.projectId]: 0
                }));
            }
        };

        const onAssigned = (data: any) => {
            if (data.userId === session.user.id) {
                refreshUnread();
            }
        };

        const onRemoved = (data: any) => {
            if (data.userId === session.user.id) {
                refreshUnread();
            }
        };

        socket.on("message", onMessage);
        socket.on("messages-read", onRead);
        socket.on("user-assigned-to-project", onAssigned);
        socket.on("user-removed-from-project", onRemoved);

        // Register user for private notifications
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
            socket.emit("register-user", session.user.id);
            // CRITICAL: Refresh on connect to catch any offline messages
            refreshUnread();
        };

        const onReconnect = () => {
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
        return {
            unreadCounts: {},
            totalUnread: 0,
            refreshUnread: async () => {},
            clearUnread: () => {},
            setActiveProjectId: () => {}
        };
    }
    return context;
};
