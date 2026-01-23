
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import { MessageSquareDashed } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";
import { useUnreadCounts } from "./unread-count-provider";
import { ChatSkeleton } from "./chat-skeleton";
import { useRouter } from "next/navigation";

interface ChatGroup {
    id: string;
    name: string;
    projectId: string;
    developerCount: number;
}

interface AdminChatViewProps {
    initialGroupId?: string | null;
}

export function AdminChatView({ initialGroupId }: AdminChatViewProps) {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [chats, setChats] = useState<ChatGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId || null);
    const [isLoading, setIsLoading] = useState(true);
    const { unreadCounts, clearUnread, setActiveProjectId } = useUnreadCounts();

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
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Clear unread for initially selected group and set active project
    useEffect(() => {
        if (!isLoading && selectedGroupId) {
            const chat = chats.find(c => c.id === selectedGroupId);
            if (chat) {
                setActiveProjectId(chat.projectId);
                clearUnread(chat.projectId);
                handleMarkRead(chat.projectId);
            }
        } else {
            setActiveProjectId(null);
        }
    }, [isLoading, selectedGroupId, chats, clearUnread, setActiveProjectId]);

    // Socket listeners for metadata updates
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !session?.user) return;

        socket.on("user-assigned-to-project", fetchData);
        socket.on("user-removed-from-project", fetchData);

        return () => {
            socket.off("user-assigned-to-project", fetchData);
            socket.off("user-removed-from-project", fetchData);
        };
    }, [fetchData, session?.user?.id]);

    // Role-based on-demand room joining
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !selectedGroupId) return;

        const chat = chats.find(c => c.id === selectedGroupId);
        if (!chat) return;

        socket.emit("join-group", chat.projectId);

        return () => {
            socket.emit("leave-group", chat.projectId);
        };
    }, [selectedGroupId, chats]);

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
        return <ChatSkeleton />;
    }

    return (
        <div className="flex h-full w-full bg-white border border-slate-200 shadow-sm overflow-hidden min-h-0">
            <ChatSidebar
                groups={chats}
                selectedGroupId={selectedGroupId}
                onSelectGroup={(id: string) => {
                    setSelectedGroupId(id);
                    router.push(`/admin/chat?groupId=${id}`, { scroll: false });
                    const chat = chats.find(c => c.id === id);
                    if (chat) {
                        setActiveProjectId(chat.projectId);
                        clearUnread(chat.projectId);
                        handleMarkRead(chat.projectId);
                    }
                }}
                unreadCounts={unreadCounts}
            />

            <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0 min-h-0">
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
