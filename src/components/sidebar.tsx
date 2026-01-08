
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { useUnreadCounts } from "@/components/chat/unread-count-provider";
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
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-slate-400")} />
                    {item.name}
                </div>
                {isProjectChat && totalUnread > 0 && !active && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                        {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <aside className="w-64 border-r bg-white hidden md:flex flex-col sticky top-0 h-screen">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">P</div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">ProjectHub</h1>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-6">
                <div>
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main</p>
                    <nav className="space-y-1">
                        {mainItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                {managementItems.length > 0 && (
                    <div>
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{sectionLabel}</p>
                        <nav className="space-y-1">
                            {managementItems.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </nav>
                    </div>
                )}

                {settingsItems.length > 0 && (
                    <div>
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Settings</p>
                        <nav className="space-y-1">
                            {settingsItems.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-slate-50/50">
                <LogoutButton showText className="w-full justify-start gap-2 text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-100 font-medium border-transparent transition-all" />
            </div>
        </aside>
    );
}
