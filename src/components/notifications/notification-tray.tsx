"use client";

import { useEffect, useState } from "react";
import { 
    Bell, 
    Check, 
    Clock, 
    ExternalLink, 
    BellOff, 
    Inbox,
    Loader2,
    Circle
} from "lucide-react";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    url: string | null;
    isRead: boolean;
    createdAt: Date | string;
}

export function NotificationTray({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?limit=20");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const socket = getSocket();
        if (!socket) return;

        // Listen for real-time notifications
        socket.on("notification", (payload: any) => {
            // Add new notification to the top
            const newNotif: Notification = {
                id: crypto.randomUUID(), // Local ID until refresh if not provided by socket
                type: payload.type,
                title: payload.title,
                body: payload.body,
                url: payload.url || null,
                isRead: false,
                createdAt: new Date(),
                ...payload
            };
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.off("notification");
        };
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                body: JSON.stringify({ notificationId: id }),
            });
            if (res.ok) {
                setNotifications(prev => 
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                body: JSON.stringify({ markAll: true }),
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.isRead) markAsRead(notif.id);
        if (notif.url) {
            router.push(notif.url);
            setIsOpen(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                    {children}
                    {unreadCount > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-2xl border-app bg-app-card z-50" align="end" sideOffset={5}>
                <div className="flex items-center justify-between p-4 border-b border-app">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-app-heading">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] font-bold">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <p className="text-xs text-muted-foreground">Loading alerts...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 gap-3 p-6 text-center">
                            <div className="p-4 bg-muted/20 rounded-full">
                                <Inbox className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-app-heading">All caught up!</p>
                                <p className="text-xs text-muted-foreground mt-1">No recent notifications to show.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-app">
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.id}
                                    className={cn(
                                        "p-4 transition-colors hover:bg-muted/30 cursor-pointer relative group",
                                        !notif.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
                                    )}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            {!notif.isRead ? (
                                                <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
                                            ) : (
                                                <div className="h-2 w-2" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn(
                                                "text-sm leading-tight",
                                                !notif.isRead ? "font-bold text-app-heading" : "text-app-body"
                                            )}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notif.body}
                                            </p>
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                </div>
                                                {notif.url && (
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t border-app bg-muted/10">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs font-medium text-muted-foreground hover:text-app-heading"
                        onClick={() => {
                            const user = session?.user as any;
                            const target = user?.role === "admin" ? "/admin/settings" : "/user/settings";
                            router.push(target);
                            setIsOpen(false);
                        }}
                    >
                        Notification Settings
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
