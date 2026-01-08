
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
    Bell
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { AdminMainContent } from "@/components/admin-main-content";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default async function AdminLayout({
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

    if (session.user.role !== "admin") {
        redirect("/user/dashboard");
    }

    const mainItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
        { name: "Clients", href: "/admin/clients", icon: "Users" },
        { name: "Projects", href: "/admin/projects", icon: "FolderOpen" },
        { name: "Developers", href: "/admin/developers", icon: "UserSquare2" },
    ];

    const managementItems = [
        { name: "Roles & Access", href: "/admin/users", icon: "ShieldCheck" },
        { name: "Memos", href: "/admin/memos", icon: "FileText" },
        { name: "EOD Reports", href: "/admin/eods", icon: "ClipboardList" },
        { name: "Project Chat", href: "/admin/chat", icon: "MessageSquare" },
        { name: "Links", href: "/admin/links", icon: "LinkIcon" },
        { name: "Assets", href: "/admin/assets", icon: "FileCode2" },
    ];

    const settingsItems = [
        { name: "Settings", href: "/admin/settings", icon: "Settings" },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
            <Sidebar 
                mainItems={mainItems}
                managementItems={managementItems}
                settingsItems={settingsItems}
                sectionLabel="Management"
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0">
                <Header 
                    userName={session.user.name} 
                    userRole={session.user.role} 
                    searchPlaceholder="Search keywords, projects..." 
                />
                
                <AdminMainContent>
                    {children}
                </AdminMainContent>
            </main>
        </div>
    );
}
