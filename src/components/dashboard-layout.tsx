
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { hasPermission } from "@/lib/permissions";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = session.user.role;

    // Role-specific sidebar configuration
    const getRoleBasedSidebar = () => {
        if (userRole === "admin") {
            return {
                mainItems: [
                    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
                    { name: "Clients", href: "/dashboard/clients", icon: Users },
                    { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
                    { name: "Developers", href: "/dashboard/developers", icon: UserSquare2 },
                ],
                managementItems: [
                    { name: "Roles & Access", href: "/dashboard/admin/users", icon: ShieldCheck },
                    { name: "Memos", href: "/dashboard/memos", icon: FileText },
                    { name: "EOD Reports", href: "/dashboard/eods", icon: ClipboardList },
                    { name: "Project Chat", href: "/dashboard/chat", icon: MessageSquare },
                    { name: "Links", href: "/dashboard/links", icon: LinkIcon },
                    { name: "Assets", href: "/dashboard/assets", icon: FileCode2 },
                ],
                sectionLabel: "Management"
            };
        }

        if (userRole === "developer") {
            return {
                mainItems: [
                    { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
                    { name: "My Projects", href: "/dashboard/projects", icon: FolderOpen },
                    { name: "My Tasks", href: "/dashboard/tasks", icon: ClipboardList },
                ],
                managementItems: [
                    { name: "EOD Reports", href: "/dashboard/eods", icon: ClipboardList },
                    { name: "Code Links", href: "/dashboard/links", icon: LinkIcon },
                    { name: "Project Chat", href: "/dashboard/chat", icon: MessageSquare },
                ],
                sectionLabel: "Work"
            };
        }

        if (userRole === "tester") {
            return {
                mainItems: [
                    { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
                    { name: "My Projects", href: "/dashboard/projects", icon: FolderOpen },
                    { name: "Test Queue", href: "/dashboard/tasks", icon: ClipboardList },
                ],
                managementItems: [
                    { name: "Bugs & Issues", href: "/dashboard/bugs", icon: ShieldCheck },
                    { name: "Test Reports", href: "/dashboard/eods", icon: FileText },
                    { name: "Project Chat", href: "/dashboard/chat", icon: MessageSquare },
                ],
                sectionLabel: "Testing"
            };
        }

        if (userRole === "designer") {
            return {
                mainItems: [
                    { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
                    { name: "My Projects", href: "/dashboard/projects", icon: FolderOpen },
                    { name: "Design Tasks", href: "/dashboard/tasks", icon: ClipboardList },
                ],
                managementItems: [
                    { name: "Assets Library", href: "/dashboard/assets", icon: FileCode2 },
                    { name: "Feedback", href: "/dashboard/memos", icon: FileText },
                    { name: "Project Chat", href: "/dashboard/chat", icon: MessageSquare },
                ],
                sectionLabel: "Design"
            };
        }

        // Default fallback
        return {
            mainItems: [
                { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
                { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
            ],
            managementItems: [],
            sectionLabel: "Management"
        };
    };

    const { mainItems, managementItems, sectionLabel } = getRoleBasedSidebar();

    const settingsItems = [
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-white hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                         <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-white font-bold">P</div>
                         <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">ProjectHub</h1>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-3 space-y-6">
                    <div>
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Main</p>
                        <nav className="space-y-1">
                            {mainItems.map((item) => (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {managementItems.length > 0 && (
                        <div>
                            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{sectionLabel}</p>
                            <nav className="space-y-1">
                                {managementItems.map((item) => (
                                    <Link 
                                        key={item.href} 
                                        href={item.href}
                                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    )}

                    <div>
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Settings</p>
                        <nav className="space-y-1">
                            {settingsItems.map((item) => (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                 <div className="p-4 border-t">
                    <LogoutButton showText className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b bg-white px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex-1 max-w-md relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search..." 
                            className="pl-10 bg-slate-50 border-none focus-visible:ring-1"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3 pl-4 border-l">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold leading-none">{session.user.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">{session.user.role}</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                {session.user.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 p-8 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
