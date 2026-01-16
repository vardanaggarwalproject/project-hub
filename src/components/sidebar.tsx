
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { useUnreadCounts } from "@/components/chat/unread-count-provider";
import { authClient } from "@/lib/auth-client";
import {
    LayoutDashboard,
    FolderOpen,
    Users,
    FileText,
    Settings,
    UserSquare2,
    ShieldCheck,
    ClipboardList,
    MessageSquare,
    LinkIcon,
    FileCode2,
    Search,
    Bell,
    LucideIcon
} from "lucide-react";

const IconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    FolderOpen,
    Users,
    FileText,
    Settings,
    UserSquare2,
    ShieldCheck,
    ClipboardList,
    MessageSquare,
    LinkIcon,
    FileCode2,
    Search,
    Bell
};

interface NavItem {
    name: string;
    href: string;
    icon: string; // Changed from LucideIcon to string
}

interface SidebarProps {
    mainItems: NavItem[];
    managementItems?: NavItem[];
    settingsItems?: NavItem[];
    sectionLabel?: string;
}

export function Sidebar({
    mainItems,
    managementItems = [],
    settingsItems = [],
    sectionLabel = "Management"
}: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = authClient.useSession();

    const isLinkActive = (href: string) => {
        if (href === "/admin/dashboard" || href === "/user/dashboard") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const NavLink = ({ item }: { item: NavItem }) => {
        const active = isLinkActive(item.href);
        const Icon = IconMap[item.icon] || LayoutDashboard;
        const { totalUnread } = useUnreadCounts();
        const isProjectChat = item.name === "Project Chat";

        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active
                        ? "bg-app-active text-app-active shadow-sm"
                        : "text-app-link hover-app-bg hover-app-text"
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", active ? "text-app-icon-active" : "text-app-icon")} />
                    {item.name}
                </div>
                {isProjectChat && totalUnread > 0 && !active && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 px-1 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                        {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <aside className="w-64 border-r border-app bg-app-sidebar hidden md:flex flex-col sticky top-0 h-screen">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 dark:bg-blue-500 rounded flex items-center justify-center text-white font-bold">P</div>
                    <h1 className="text-xl font-bold tracking-tight text-app-heading">ProjectHub</h1>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-6">
                <div>
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-app-muted mb-2">Main</p>
                    <nav className="space-y-1">
                        {mainItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                {managementItems.length > 0 && (
                    <div>
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-app-muted mb-2">{sectionLabel}</p>
                        <nav className="space-y-1">
                            {managementItems.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </nav>
                    </div>
                )}

                {settingsItems.length > 0 && (
                    <div>
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-app-muted mb-2">Settings</p>
                        <nav className="space-y-1">
                            {settingsItems.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-app bg-app-sidebar">
                <LogoutButton showText className="w-full justify-start gap-2 text-app-body hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-app-hover hover:border-red-100 dark:hover:border-transparent font-medium border-transparent transition-all" />
            </div>
        </aside>
    );
}
