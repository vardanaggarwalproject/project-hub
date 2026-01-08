"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatGroup {
    id: string;
    name: string;
    projectId: string;
    developerCount: number;
}

interface ChatSidebarProps {
    groups: ChatGroup[];
    selectedGroupId: string | null;
    onSelectGroup: (groupId: string) => void;
    unreadCounts?: Record<string, number>;
}

export function ChatSidebar({ groups, selectedGroupId, onSelectGroup, unreadCounts }: ChatSidebarProps) {
    const [search, setSearch] = useState("");

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full border-r border-slate-200 bg-white w-80 shrink-0">
            <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-lg mb-4 text-slate-800">Messages</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chats..."
                        className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col p-2 gap-1">
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => onSelectGroup(group.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                                    "hover:bg-slate-50",
                                    selectedGroupId === group.id ? "bg-blue-50/60 ring-1 ring-blue-100" : "bg-transparent"
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-colors",
                                    selectedGroupId === group.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                )}>
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className={cn(
                                            "font-bold truncate text-sm",
                                            selectedGroupId === group.id ? "text-blue-900" : "text-slate-700"
                                        )}>
                                            {group.name}
                                        </p>
                                        {(unreadCounts?.[group.projectId] ?? 0) > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white animate-in zoom-in">
                                                {unreadCounts![group.projectId] > 9 ? "9+" : unreadCounts![group.projectId]}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-400 truncate">
                                        {group.developerCount} Developers
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-slate-400">No chats found</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
