
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { 
    LayoutDashboard, 
    FolderOpen, 
    ClipboardList,
    LinkIcon,
    MessageSquare,
    Settings,
    ShieldCheck,
    FileText,
    FileCode2,
    Search,
    Bell
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

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

    const userRole = session.user.role;

    let mainItems = [
        { name: "Dashboard", href: "/user/dashboard", icon: "LayoutDashboard" },
        { name: "My Projects", href: "/user/projects", icon: "FolderOpen" },
        { name: "My Tasks", href: "/user/tasks", icon: "ClipboardList" },
    ];

    let managementItems = [
        { name: "EOD Reports", href: "/user/eods", icon: "ClipboardList" },
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
            { name: "Test Reports", href: "/user/eods", icon: "FileText" },
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
        <div className="flex min-h-screen bg-[#f8fafc]">
            <Sidebar 
                mainItems={mainItems}
                managementItems={managementItems}
                settingsItems={settingsItems}
                sectionLabel={sectionLabel}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <Header 
                    userName={session.user.name} 
                    userRole={session.user.role} 
                    searchPlaceholder="Search keywords, tasks..." 
                />
                
                <div className="flex-1 p-8 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
