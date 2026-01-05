
import { auth } from "@/lib/auth"; // Server-side session check
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
    LogOut 
} from "lucide-react";

export default async function DashboardLayout({
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

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
        { name: "Clients", href: "/dashboard/clients", icon: Users },
        { name: "Reports", href: "/dashboard/eods", icon: FileText },
    ];

    if (session.user.role === "admin") {
        navItems.push({ name: "User Management", href: "/dashboard/admin/users", icon: Users });
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card hidden md:block relative">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight">ProjectHub</h1>
                </div>
                <nav className="space-y-1 px-3">
                    {navItems.map((item) => (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors",
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                 <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                            {session.user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b flex items-center px-6 md:hidden">
                     <h1 className="text-xl font-bold">ProjectHub</h1>
                </header>
                <div className="flex-1 p-6 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
