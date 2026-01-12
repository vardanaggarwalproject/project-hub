
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import { MessageSquareDashed } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";
import { useUnreadCounts } from "./unread-count-provider";
import { ChatSkeleton } from "./chat-skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ChatGroup {
    id: string;
    name: string;
    projectId: string;
    developerCount: number;
}

interface UserChatViewProps {
    initialGroupId?: string | null;
    initialProjectId?: string | null;
}

export function UserChatView({ initialGroupId, initialProjectId }: UserChatViewProps) {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [chats, setChats] = useState<ChatGroup[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { unreadCounts, clearUnread, setActiveProjectId } = useUnreadCounts();

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

    // Set initial selection from URL or props after chats are loaded
    useEffect(() => {
        if (chats.length > 0 && !selectedProjectId) {
            if (initialGroupId) {
                const chat = chats.find(c => c.id === initialGroupId);
                if (chat) {
                    setSelectedProjectId(chat.projectId);
                }
            } else if (initialProjectId) {
                setSelectedProjectId(initialProjectId);
            }
        }
    }, [initialGroupId, initialProjectId, chats, selectedProjectId]);

    // Clear unread for initially selected project and set active project
    useEffect(() => {
        if (!isLoading && selectedProjectId) {
            setActiveProjectId(selectedProjectId);
            clearUnread(selectedProjectId);
            handleMarkRead(selectedProjectId);
        } else {
            setActiveProjectId(null);
        }
    }, [isLoading, selectedProjectId, clearUnread, setActiveProjectId]);

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

        const onProjectCreated = (data: { projectId: string; assignedUserIds: string[] }) => {
            if (data.assignedUserIds && session?.user?.id && data.assignedUserIds.includes(session.user.id)) {
                 console.log("🆕 Chat View: New project created and assigned:", data.projectId);
                 fetchData();
                 toast.success("New project chat available!");
            }
        };

        socket.on("user-assigned-to-project", fetchData);
        socket.on("user-removed-from-project", fetchData);
        socket.on("project-created", onProjectCreated);
        socket.on("project-deleted", onProjectDeleted);

        return () => {
            socket.off("user-assigned-to-project", fetchData);
            socket.off("user-removed-from-project", fetchData);
            socket.off("project-created", onProjectCreated);
            socket.off("project-deleted", onProjectDeleted);
        };
    }, [fetchData, session?.user?.id, onProjectDeleted]);

    // Role-based on-demand room joining
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !selectedProjectId) return;

        console.log(`🔌 Joining active chat room: group:${selectedProjectId}`);
        socket.emit("join-group", selectedProjectId);

        return () => {
            console.log(`🔌 Leaving chat room: group:${selectedProjectId}`);
            socket.emit("leave-group", selectedProjectId);
        };
    }, [selectedProjectId]);

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
            router.push(`/user/chat?groupId=${groupId}`, { scroll: false });
            setActiveProjectId(chat.projectId);
            clearUnread(chat.projectId);
            handleMarkRead(chat.projectId);
        }
    };

    const selectedChat = chats.find(c => c.projectId === selectedProjectId);

    if (isLoading) {
        return <ChatSkeleton />;
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
