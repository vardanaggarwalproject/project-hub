
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import { MessageSquareDashed } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";
import { useUnreadCounts } from "./unread-count-provider";
import { toast } from "sonner";

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
    const { unreadCounts, clearUnread } = useUnreadCounts();

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

    // Clear unread for initially selected project
    useEffect(() => {
        if (!isLoading && selectedProjectId) {
            clearUnread(selectedProjectId);
            handleMarkRead(selectedProjectId);
        }
    }, [isLoading, selectedProjectId, clearUnread]);

    const onProjectDeleted = useCallback((data: { projectId: string }) => {
         console.log("🗑️ Chat View: Project deleted:", data.projectId);
         
         // Remove from list
         setChats(prev => prev.filter(c => c.projectId !== data.projectId));

         // If current, deselect/redirect
         if (selectedProjectId === data.projectId) {
             setSelectedProjectId(null);
         }
         
         if ((session?.user as any)?.role !== "admin") {
             toast.error("Project is deleted by admin and you are no longer member of this");
             setTimeout(() => {
                 window.location.reload();
             }, 2000);
         }
    }, [selectedProjectId, session]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !session?.user) return;

        const onConnect = () => {
            if (chatsRef.current.length > 0) {
                const projectIds = chatsRef.current.map(c => c.projectId);
                socket.emit("join-rooms", projectIds);
            }
        };

        const onProjectCreated = (data: { projectId: string; assignedUserIds: string[] }) => {
            if (data.assignedUserIds && session?.user?.id && data.assignedUserIds.includes(session.user.id)) {
                 console.log("🆕 Chat View: New project created and assigned:", data.projectId);
                 fetchData();
                 toast.success("New project chat available!");
            }
        };

        socket.on("connect", onConnect);
        socket.on("user-assigned-to-project", fetchData);
        socket.on("user-removed-from-project", fetchData);
        socket.on("project-created", onProjectCreated);
        socket.on("project-deleted", onProjectDeleted);

        if (socket.connected) onConnect();

        return () => {
            socket.off("connect", onConnect);
            socket.off("user-assigned-to-project", fetchData);
            socket.off("user-removed-from-project", fetchData);
            socket.off("project-created", onProjectCreated);
            socket.off("project-deleted", onProjectDeleted);
        };
    }, [fetchData, session?.user?.id, chats.length, selectedProjectId, onProjectDeleted]);



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

    const handleSelectChat = (groupId: string) => {
        const chat = chats.find(c => c.id === groupId);
        if (chat) {
            setSelectedProjectId(chat.projectId);
            clearUnread(chat.projectId);
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
        <div className="flex h-full w-full bg-white border border-slate-200 shadow-sm overflow-hidden min-h-0">
            <ChatSidebar
                groups={chats}
                selectedGroupId={selectedChat?.id || null}
                onSelectGroup={handleSelectChat}
                unreadCounts={unreadCounts}
            />

            <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0 min-h-0">
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
