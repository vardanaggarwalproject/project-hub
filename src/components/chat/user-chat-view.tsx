
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import { MessageSquareDashed } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";

interface ChatGroup {
    id: string;
    name: string;
    projectId: string;
    developerCount: number;
}

interface UserChatViewProps {
    initialProjectId?: string;
}

export function UserChatView({ initialProjectId }: UserChatViewProps) {
    const { data: session } = authClient.useSession();
    const [chats, setChats] = useState<ChatGroup[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    
    const chatsRef = useRef<ChatGroup[]>([]);
    const selectedProjectIdRef = useRef<string | null>(null);
    const lastReadCallRef = useRef<Record<string, number>>({});

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    useEffect(() => {
        selectedProjectIdRef.current = selectedProjectId;
    }, [selectedProjectId]);

    const fetchData = useCallback(async () => {
        try {
            const [chatsRes, unreadRes] = await Promise.all([
                fetch("/api/chat-groups").then(r => r.json()),
                fetch("/api/chat/unread-counts").then(r => r.json())
            ]);

            if (Array.isArray(chatsRes)) setChats(chatsRes);
            if (unreadRes && typeof unreadRes === "object" && !Array.isArray(unreadRes)) {
                setUnreadCounts(unreadRes);
            }
        } catch (err) {
            console.error("Fetch data failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !session?.user) return;

        const onMessage = (data: any) => {
            const currentSelectedProjectId = selectedProjectIdRef.current;
            if (data.projectId && data.projectId !== currentSelectedProjectId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.projectId]: (prev[data.projectId] || 0) + 1
                }));
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

        const onConnect = () => {
            if (chatsRef.current.length > 0) {
                const projectIds = chatsRef.current.map(c => c.projectId);
                socket.emit("join-rooms", projectIds);
            }
        };

        socket.on("message", onMessage);
        socket.on("messages-read", onRead);
        socket.on("connect", onConnect);
        socket.on("user-assigned-to-project", fetchData);
        socket.on("user-removed-from-project", fetchData);

        if (socket.connected) onConnect();

        return () => {
            socket.off("message", onMessage);
            socket.off("messages-read", onRead);
            socket.off("connect", onConnect);
            socket.off("user-assigned-to-project", fetchData);
            socket.off("user-removed-from-project", fetchData);
        };
    }, [fetchData, session?.user?.id]);

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
            .catch(() => {});
    };

    const handleSelectChat = (groupId: string) => {
        const chat = chats.find(c => c.id === groupId);
        if (chat) {
            setSelectedProjectId(chat.projectId);
            setUnreadCounts(prev => ({
                ...prev,
                [chat.projectId]: 0
            }));
            handleMarkRead(chat.projectId);
        }
    };

    const selectedChat = chats.find(c => c.projectId === selectedProjectId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full min-h-[600px] bg-white rounded-xl border border-slate-200 shadow-sm">
                <Spinner className="h-8 w-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-white border border-slate-200 shadow-sm overflow-hidden rounded-xl">
            <ChatSidebar 
                groups={chats} 
                selectedGroupId={selectedChat?.id || null} 
                onSelectGroup={handleSelectChat}
                unreadCounts={unreadCounts}
            />

            <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
                {selectedChat ? (
                    <ChatWindow 
                        key={selectedChat.projectId}
                        groupId={selectedChat.id} 
                        groupName={selectedChat.name}
                        projectId={selectedChat.projectId}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageSquareDashed className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-700">Select a project</h3>
                            <p className="text-sm max-w-xs mx-auto mt-1">Choose a project from the sidebar to view the conversation.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
