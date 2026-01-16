"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
    Users, 
    FolderKanban, 
    Users2, 
    ClipboardCheck, 
    MessageSquare, 
    FolderPlus, 
    UserPlus2,
    ArrowUpRight,
    TrendingUp,
    Search,
    FileText,
    Link as LinkIcon,
    FileCode2,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Project {
    id: string;
    name: string;
    clientName: string | null;
    status: string;
    team?: any[];
    totalTime?: string | null;
    completedTime?: string | null;
}

interface Stats {
    totalClients: number;
    activeProjects: number;
    teamMembers: number;
    eodsToday: string;
}

export default function AdminDashboardPage() {
    const { data: session, isPending: isSessionLoading } = authClient.useSession();
    const [stats, setStats] = useState<Stats>({
        totalClients: 0,
        activeProjects: 0,
        teamMembers: 0,
        eodsToday: "0/0"
    });
    const [recentProjects, setRecentProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!session) return;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const [projectsRes, clientsRes, usersRes] = await Promise.all([
                    fetch("/api/projects?limit=5"),
                    fetch("/api/clients"),
                    fetch("/api/users?limit=100")
                ]);

                const projectsData = await projectsRes.json();
                const clientsData = await clientsRes.json();
                const usersData = await usersRes.json();

                setStats({
                    totalClients: clientsData.data?.length || 0,
                    activeProjects: projectsData.data?.filter((p: any) => p.status === "active").length || 0,
                    teamMembers: usersData.data?.length || 0,
                    eodsToday: "28/32"
                });

                setRecentProjects(projectsData.data || []);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [session]);

    if (isSessionLoading || isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-80" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-10 w-64 rounded-xl" />
                </div>

                {/* KPI Cards Skeleton */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="border-none shadow-app bg-app-card">
                            <CardContent className="p-6">
                                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="border-none shadow-app bg-app-card">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <Skeleton className="h-11 w-11 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const kpiCards = [
        {
            title: "Total Clients",
            value: stats.totalClients,
            subtitle: "Active partnerships",
            trend: "+12% vs last week",
            icon: Users,
            gradient: "from-blue-500 via-blue-600 to-indigo-600",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600"
        },
        {
            title: "Active Projects",
            value: stats.activeProjects,
            subtitle: "Currently in progress",
            trend: "+8% vs last week",
            icon: FolderKanban,
            gradient: "from-orange-500 via-orange-600 to-red-600",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600"
        },
        {
            title: "Team Members",
            value: stats.teamMembers,
            subtitle: "Developers assigned",
            trend: "+5% vs last week",
            icon: Users2,
            gradient: "from-purple-500 via-purple-600 to-pink-600",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600"
        },
        {
            title: "EODs Today",
            value: stats.eodsToday,
            subtitle: "Submission rate",
            trend: "87.5% completed",
            icon: ClipboardCheck,
            gradient: "from-emerald-500 via-teal-600 to-cyan-600",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600"
        }
    ];

    const quickActions = [
        {
            title: "Project Chat",
            subtitle: "Team communication",
            icon: MessageSquare,
            href: "/dashboard/chat",
            bgColor: "bg-emerald-50",
            iconColor: "text-emerald-600"
        },
        {
            title: "New Project",
            subtitle: "Create a new project",
            icon: FolderPlus,
            href: "/dashboard/projects",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600"
        },
        {
            title: "Assign Developer",
            subtitle: "Add team member",
            icon: UserPlus2,
            href: "/dashboard/developers",
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600"
        },
        {
            title: "Add Client",
            subtitle: "Register new client",
            icon: UserPlus2,
            href: "/dashboard/clients",
            bgColor: "bg-pink-50",
            iconColor: "text-pink-600"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-app-heading">
                        Good morning, {session?.user.name}!
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">Here's your organization overview</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 w-full md:w-64 bg-app-input border-app rounded-xl h-10 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-app hover:shadow-xl transition-all duration-300 overflow-hidden group bg-app-card">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("p-3 rounded-xl", kpi.iconBg, "dark:bg-opacity-20 dark:bg-gray-700")}>
                                    <kpi.icon className={cn("h-6 w-6", kpi.iconColor, "dark:opacity-80")} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-3xl font-black text-app-heading">{kpi.value}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{kpi.title}</div>
                                <div className="text-xs text-muted-foreground">{kpi.subtitle}</div>
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp className="h-3 w-3" />
                                    {kpi.trend}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-app-heading mb-4">Quick Actions</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href}>
                            <Card className="border-none shadow-app hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group bg-app-card">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-transform", action.bgColor, "dark:bg-opacity-20 dark:bg-gray-700")}>
                                            <action.icon className={cn("h-5 w-5", action.iconColor, "dark:opacity-80")} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-app-heading group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{action.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Projects */}
            <Card className="border-none shadow-app bg-app-card">
                <CardHeader className="border-b border-app bg-app-subtle px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base md:text-lg font-black uppercase tracking-tight text-app-heading">Recent Projects</CardTitle>
                        <Button variant="link" className="text-blue-600 dark:text-blue-400 font-bold text-xs md:text-sm self-start sm:self-auto" asChild>
                            <Link href="/dashboard/projects">
                                View All <ArrowRight className="ml-2 h-3 md:h-4 w-3 md:w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <div className="rounded-md border border-app">
                        <Table>
                            <TableHeader className="bg-app-table-header">
                                <TableRow className="border-app">
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Project Name</TableHead>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Client</TableHead>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Developers</TableHead>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentProjects.slice(0, 5).map((project) => (
                                    <TableRow key={project.id} className="bg-app-table-row-hover transition-colors group border-app">
                                        <TableCell className="px-6 py-4">
                                            <Link href={`/admin/projects/${project.id}`} className="font-bold text-sm text-app-heading hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-0.5">{project.clientName || "No client"}</p>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <span className="text-sm text-app-body">{project.clientName || "—"}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <span className="text-sm font-bold text-app-body">{project.team?.length || 0} developers</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge className={cn(
                                                "font-bold text-xs uppercase",
                                                project.status === "active" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                                                project.status === "completed" && "bg-blue-100 text-blue-700 border-blue-200",
                                                project.status === "on-hold" && "bg-amber-100 text-amber-700 border-amber-200"
                                            )}>
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {(() => {
                                                    const total = parseFloat(project.totalTime || "0");
                                                    const completed = parseFloat(project.completedTime || "0");
                                                    const progress = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;
                                                    return (
                                                        <>
                                                            <Progress value={progress} className="h-2 w-24" />
                                                            <span className="text-xs font-black text-slate-500">{progress}%</span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
