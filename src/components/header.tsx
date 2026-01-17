
"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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
        <header className="h-16 border-b border-app bg-app-card px-8 flex items-center justify-between sticky top-0 z-10 shadow-app">
            <div className="flex-1 max-w-md relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-icon" />
                <Input
                    placeholder={searchPlaceholder}
                    className="pl-10 bg-app-input border-app focus-ring-app dark:text-white placeholder-app"
                />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Button variant="ghost" size="icon" className="text-app-body hover:text-blue-600 hover-app-text hover:bg-blue-50 hover-app-bg">
                        <Bell className="h-5 w-5" />
                    </Button>
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-app-card animate-in zoom-in">
                            {totalUnread > 99 ? "99+" : totalUnread}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 pl-4 border-l border-app">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-app-heading leading-none">{userName}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase mt-1 tracking-wider">{userRole}</p>
                    </div>
                    
                    <HoverCard openDelay={0} closeDelay={200}>
                        <HoverCardTrigger asChild>
                            <div className="h-9 w-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-200 dark:shadow-none cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
                                {initials}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-60 shadow-xl border-app bg-app-card" align="end">
                            <div className="flex justify-between space-x-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-app-heading">{userName}</h4>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {userRole}
                                    </p>
                                    <div className="pt-2">
                                        <LogoutButton 
                                            showText 
                                            className="w-full justify-start h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                                        />
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                    {initials}
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </div>
        </header>
    );
}
