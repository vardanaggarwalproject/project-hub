"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import { Loader2, MessageSquareDashed } from "lucide-react";

interface ChatGroup {
    id: string;
    name: string;
    projectId: string;
    developerCount: number;
}

export function AdminChatView() {
    const [chats, setChats] = useState<ChatGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChats = () => {
             fetch("/api/chat-groups")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setChats(data);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
        };

        fetchChats();

        // Listen for realtime updates
        let socketInstance: any;
        (async () => {
             const { getSocket } = await import("@/lib/socket");
             socketInstance = getSocket();
            
             // If a user is assigned to a project, refresh the list
             // This event name 'user-assigned-to-project' comes from server.js
             socketInstance.on("user-assigned-to-project", () => {
                 fetchChats();
             });
             
             socketInstance.on("user-removed-from-project", () => {
                 fetchChats();
             });
             
             // Also if a project is created? We might need more events.
             // But for now, focusing on assignment as requested.
        })();

        return () => {
            if(socketInstance) {
                socketInstance.off("user-assigned-to-project");
                socketInstance.off("user-removed-from-project");
            }
        };
    }, []);

    const selectedGroup = chats.find(c => c.id === selectedGroupId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[900px] w-full bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-slate-500">Loading chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-white  border border-slate-200 shadow-sm overflow-hidden">
            {/* Sidebar - Fixed width */}
            <ChatSidebar 
                groups={chats} 
                selectedGroupId={selectedGroupId} 
                onSelectGroup={setSelectedGroupId} 
            />

            {/* Main Content - Flex Grow */}
            <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
                {selectedGroup ? (
                    <ChatWindow 
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
                            <p className="text-sm max-w-xs mx-auto mt-1">Choose a project group from the sidebar to start monitoring the conversation.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
