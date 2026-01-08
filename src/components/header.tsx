
"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useUnreadCounts } from "@/components/chat/unread-count-provider";

interface HeaderProps {
    userName: string;
    userRole: string;
    searchPlaceholder?: string;
}

export function Header({ userName, userRole, searchPlaceholder = "Search..." }: HeaderProps) {
    const { totalUnread } = useUnreadCounts();
    const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    return (
        <header className="h-16 border-b bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex-1 max-w-md relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder={searchPlaceholder}
                    className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500"
                />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                        <Bell className="h-5 w-5" />
                    </Button>
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                            {totalUnread > 99 ? "99+" : totalUnread}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 leading-none">{userName}</p>
                        <p className="text-[10px] text-blue-600 font-extrabold uppercase mt-1 tracking-wider">{userRole}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-200">
                        {initials}
                    </div>
                </div>
            </div>
        </header>
    );
}
