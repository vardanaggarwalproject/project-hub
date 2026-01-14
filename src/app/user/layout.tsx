import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { UserMainContent } from "@/components/user-main-content";
import type { UserRole } from "@/types";

/**
 * Layout component for user-facing pages
 * Handles authentication, role-based routing, and sidebar configuration
 */
export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    if (session.user.role === "admin") {
        redirect("/admin/dashboard");
    }

    const userRole = session.user.role as UserRole;

    let mainItems = [
        { name: "Dashboard", href: "/user/dashboard", icon: "LayoutDashboard" },
        { name: "My Projects", href: "/user/projects", icon: "FolderOpen" },
        { name: "My Tasks", href: "/user/tasks", icon: "ClipboardList" },
    ];

    let managementItems = [
        { name: "Code Links", href: "/user/links", icon: "LinkIcon" },
        { name: "Project Chat", href: "/user/chat", icon: "MessageSquare" },
    ];
    
    let sectionLabel = "Work";

    // Customize based on specific user roles (tester, designer, etc.)
    if (userRole === "tester") {
         mainItems = [
            { name: "Dashboard", href: "/user/dashboard", icon: "LayoutDashboard" },
            { name: "My Projects", href: "/user/projects", icon: "FolderOpen" },
            { name: "Test Queue", href: "/user/tasks", icon: "ClipboardList" },
        ];
        managementItems = [
            { name: "Bugs & Issues", href: "/user/bugs", icon: "ShieldCheck" },
            { name: "Project Chat", href: "/user/chat", icon: "MessageSquare" },
        ];
        sectionLabel = "Testing";
    } else if (userRole === "designer") {
        mainItems = [
            { name: "Dashboard", href: "/user/dashboard", icon: "LayoutDashboard" },
            { name: "My Projects", href: "/user/projects", icon: "FolderOpen" },
            { name: "Design Tasks", href: "/user/tasks", icon: "ClipboardList" },
        ];
        managementItems = [
            { name: "Assets Library", href: "/user/assets", icon: "FileCode2" },
            { name: "Feedback", href: "/user/memos", icon: "FileText" },
            { name: "Project Chat", href: "/user/chat", icon: "MessageSquare" },
        ];
        sectionLabel = "Design";
    }

    const settingsItems = [
        { name: "Settings", href: "/user/settings", icon: "Settings" },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
            <Sidebar 
                mainItems={mainItems}
                managementItems={managementItems}
                settingsItems={settingsItems}
                sectionLabel={sectionLabel}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0">
                <Header 
                    userName={session.user.name || ""} 
                    userRole={session.user.role || "developer"} 
                    searchPlaceholder="Search keywords, tasks..." 
                />
                
                <UserMainContent>
                    {children}
                </UserMainContent>
            </main>
        </div>
    );
}
