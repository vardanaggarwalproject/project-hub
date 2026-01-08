
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import { MessageSquareDashed } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";
import { useUnreadCounts } from "./unread-count-provider";

interface ChatGroup {
    id: string;
    name: string;
    projectId: string;
    developerCount: number;
}

export function AdminChatView() {
    const { data: session } = authClient.useSession();
    const [chats, setChats] = useState<ChatGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { unreadCounts, clearUnread } = useUnreadCounts();

    const chatsRef = useRef<ChatGroup[]>([]);
    const selectedGroupIdRef = useRef<string | null>(null);
    const lastReadCallRef = useRef<Record<string, number>>({});

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    useEffect(() => {
        selectedGroupIdRef.current = selectedGroupId;
    }, [selectedGroupId]);

    const selectedGroup = chats.find(c => c.id === selectedGroupId);

    // Optimized: Fetch chats
    const fetchData = useCallback(async () => {
        try {
            const chatsRes = await fetch("/api/chat-groups").then(r => r.json());
            if (Array.isArray(chatsRes)) setChats(chatsRes);
        } catch (err) {
            console.error("Fetch chats failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Clear unread for initially selected group
    useEffect(() => {
        if (!isLoading && selectedGroupId) {
            const chat = chats.find(c => c.id === selectedGroupId);
            if (chat) {
                clearUnread(chat.projectId);
                handleMarkRead(chat.projectId);
            }
        }
    }, [isLoading, selectedGroupId, chats, clearUnread]);

    // Socket listeners
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !session?.user) return;

        const onConnect = () => {
            if (chatsRef.current.length > 0) {
                const projectIds = chatsRef.current.map(c => c.projectId);
                socket.emit("join-rooms", projectIds);
            }
        };

        socket.on("connect", onConnect);
        socket.on("user-assigned-to-project", fetchData);
        socket.on("user-removed-from-project", fetchData);

        if (socket.connected) onConnect();

        return () => {
            socket.off("connect", onConnect);
            socket.off("user-assigned-to-project", fetchData);
            socket.off("user-removed-from-project", fetchData);
        };
    }, [fetchData, session?.user?.id]);

    // Re-join rooms when chats change
    useEffect(() => {
        const socket = getSocket();
        if (socket && socket.connected && chats.length > 0) {
            const projectIds = chats.map(c => c.projectId);
            socket.emit("join-rooms", projectIds);
        }
    }, [chats]);

    const handleMarkRead = (projectId: string) => {
        if (!session?.user) return;
        const now = Date.now();
        const lastCall = lastReadCallRef.current[projectId] || 0;
        if (now - lastCall < 2000) return; // Debounce 2s

        lastReadCallRef.current[projectId] = now;
        fetch(`/api/chat/${projectId}/read`, { method: "POST" })
            .then(res => {
                if (res.ok) {
                    getSocket()?.emit("mark-read", { projectId, userId: session.user.id });
                }
            })
            .catch(() => { });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full min-h-[600px] bg-white rounded-xl border border-slate-200 shadow-sm">
                <Spinner className="h-8 w-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-white border border-slate-200 shadow-sm overflow-hidden">
            <ChatSidebar
                groups={chats}
                selectedGroupId={selectedGroupId}
                onSelectGroup={(id: string) => {
                    setSelectedGroupId(id);
                    const chat = chats.find(c => c.id === id);
                    if (chat) {
                        clearUnread(chat.projectId);
                        handleMarkRead(chat.projectId);
                    }
                }}
                unreadCounts={unreadCounts}
            />

            <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
                {selectedGroup ? (
                    <ChatWindow
                        key={selectedGroup.projectId}
                        groupId={selectedGroup.id}
                        groupName={selectedGroup.name}
                        projectId={selectedGroup.projectId}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageSquareDashed className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-700">Select a group</h3>
                            <p className="text-sm max-w-xs mx-auto mt-1">Choose a project group from the sidebar to view the conversation.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
