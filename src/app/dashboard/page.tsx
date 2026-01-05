import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
    Users, 
    FolderKanban, 
    Users2, 
    ClipboardCheck, 
    MessageSquare, 
    FolderPlus, 
    UserPlus, 
    UserPlus2,
    ArrowUpRight,
    Search,
    TrendingUp,
    PlusCircle,
    Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const user = session?.user;

    const kpis = [
        { 
            title: "Total Clients", 
            value: "24", 
            description: "Active partnerships", 
            trend: "+12% vs last week", 
            icon: Users,
            gradient: "from-blue-500 via-blue-600 to-indigo-600",
            iconBg: "bg-white/20",
            shadowColor: "shadow-blue-500/20"
        },
        { 
            title: "Active Projects", 
            value: "18", 
            description: "Currently in progress", 
            trend: "+8% vs last week", 
            icon: FolderKanban,
            gradient: "from-orange-400 via-orange-500 to-red-500",
            iconBg: "bg-white/20",
            shadowColor: "shadow-orange-500/20"
        },
        { 
            title: "Team Members", 
            value: "32", 
            description: "Developers assigned", 
            trend: "+5% vs last week", 
            icon: Users2,
            gradient: "from-purple-500 via-purple-600 to-pink-600",
            iconBg: "bg-white/20",
            shadowColor: "shadow-purple-500/20"
        },
        { 
            title: "EODs Today", 
            value: "28/32", 
            description: "Submission rate", 
            trend: "87.5% completed", 
            icon: ClipboardCheck,
            gradient: "from-emerald-500 via-teal-500 to-cyan-600",
            iconBg: "bg-white/20",
            shadowColor: "shadow-emerald-500/20"
        },
    ];

    const quickActions = [
        { 
            title: "Project Chat", 
            description: "Team communication", 
            icon: MessageSquare, 
            gradient: "from-emerald-50 to-teal-50",
            iconGradient: "from-emerald-500 to-teal-600",
            href: "/dashboard/chat"
        },
        { 
            title: "New Project", 
            description: "Create a new project", 
            icon: FolderPlus, 
            gradient: "from-blue-50 to-indigo-50",
            iconGradient: "from-blue-500 to-indigo-600",
            href: "/dashboard/projects/new"
        },
        { 
            title: "Assign Developer", 
            description: "Add team member", 
            icon: UserPlus2, 
            gradient: "from-purple-50 to-pink-50",
            iconGradient: "from-purple-500 to-pink-600",
            href: "/dashboard/developers"
        },
        { 
            title: "Add Client", 
            description: "Register new client", 
            icon: PlusCircle, 
            gradient: "from-orange-50 to-amber-50",
            iconGradient: "from-orange-500 to-amber-600",
            href: "/dashboard/clients/new"
        },
    ];

    const recentProjects = [
        { 
            name: "E-Commerce Platform", 
            client: "TechCorp Inc.", 
            developers: "5 developers", 
            status: "Active", 
            progress: 75,
            statusColor: "bg-emerald-100 text-emerald-700"
        },
        { 
            name: "Mobile Banking App", 
            client: "FinanceHub", 
            developers: "3 developers", 
            status: "Active", 
            progress: 60,
            statusColor: "bg-emerald-100 text-emerald-700"
        },
        { 
            name: "CRM Dashboard", 
            client: "SalesPro", 
            developers: "4 developers", 
            status: "Pending", 
            progress: 30,
            statusColor: "bg-orange-100 text-orange-700"
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
                        Good morning, {user?.name?.split(' ')[0]}!
                        <Sparkles className="h-6 w-6 text-amber-500" />
                    </h2>
                    <p className="text-muted-foreground mt-1">Here's your organization overview</p>
                </div>
            </div>

            {/* KPI Row - Enhanced with Gradients */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi, i) => (
                    <Card 
                        key={i} 
                        className={cn(
                            "group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                            kpi.shadowColor,
                            `bg-gradient-to-br ${kpi.gradient} text-white`
                        )}
                    >
                        {/* Animated gradient border effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-90">
                                {kpi.title}
                            </CardTitle>
                            <div className={cn("p-2.5 rounded-xl backdrop-blur-sm", kpi.iconBg)}>
                                <kpi.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold mb-1">{kpi.value}</div>
                            <p className="text-xs mt-3 opacity-90 font-medium">{kpi.description}</p>
                            <div className="flex items-center gap-1 mt-2 text-[11px] font-bold opacity-90">
                                {i !== 3 && <TrendingUp className="h-3 w-3" />}
                                {kpi.trend}
                            </div>
                        </CardContent>
                        
                        {/* Decorative elements */}
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                    </Card>
                ))}
            </div>

            {/* Quick Actions - Enhanced */}
            <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                    Quick Actions
                    <div className="h-1 flex-1 max-w-20 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href}>
                            <Card className="group cursor-pointer border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                                {/* Gradient background */}
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br opacity-100 group-hover:opacity-90 transition-opacity",
                                    action.gradient
                                )} />
                                
                                <CardContent className="p-5 flex items-center gap-4 relative z-10">
                                    <div className={cn(
                                        "p-3 rounded-xl bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-300",
                                        action.iconGradient
                                    )}>
                                        <action.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-[#0f172a] group-hover:text-slate-900 transition-colors">
                                            {action.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Projects Table - Enhanced */}
            <Card className="border-none shadow-lg overflow-hidden">
                {/* Gradient header */}
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-br from-slate-50 to-white">
                    <CardTitle className="text-lg font-bold text-[#0f172a]">Recent Projects</CardTitle>
                    <Button variant="link" className="text-blue-600 text-xs font-bold hover:gap-2 gap-1 transition-all group" asChild>
                        <Link href="/dashboard/projects">
                            View All 
                            <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50/50">
                                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Project Name</th>
                                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Client</th>
                                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Developers</th>
                                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
                                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {recentProjects.map((project, i) => (
                                    <tr key={i} className="border-b transition-all hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent group">
                                        <td className="p-6 align-middle">
                                            <div className="font-bold text-[#0f172a] group-hover:text-blue-600 transition-colors">{project.name}</div>
                                        </td>
                                        <td className="p-6 align-middle text-slate-600 font-medium">{project.client}</td>
                                        <td className="p-6 align-middle text-slate-600 font-medium">{project.developers}</td>
                                        <td className="p-6 align-middle">
                                            <Badge className={cn("border-none px-3 py-1 text-xs font-bold shadow-sm", project.statusColor)}>
                                                {project.status}
                                            </Badge>
                                        </td>
                                        <td className="p-6 align-middle w-[200px]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500" 
                                                        style={{ width: `${project.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 min-w-[3ch]">{project.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y">
                        {recentProjects.map((project, i) => (
                            <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#0f172a] text-sm">{project.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{project.client}</p>
                                    </div>
                                    <Badge className={cn("border-none px-2 py-0.5 text-[10px] font-bold", project.statusColor)}>
                                        {project.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                                    <span>{project.developers}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" 
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
