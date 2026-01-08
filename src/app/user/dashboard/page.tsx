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
    FolderKanban, 
    ClipboardCheck, 
    MessageSquare, 
    ArrowUpRight,
    TrendingUp,
    Search,
    Link as LinkIcon,
    FileCode2,
    ArrowRight,
    ClipboardList,
    Bug
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
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
    myProjects: number;
    pendingTasks: number;
    eodStreak: number;
    bugsAssigned: number;
}

export default function UserDashboardPage() {
    const { data: session, isPending: isSessionLoading } = authClient.useSession();
    const [stats, setStats] = useState<Stats>({
        myProjects: 0,
        pendingTasks: 0,
        eodStreak: 0,
        bugsAssigned: 0
    });
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const socket = getSocket();
        
        const onProjectDeleted = (data: { projectId: string }) => {
            setMyProjects(prev => prev.filter(p => p.id !== data.projectId));
            
            if ((session?.user as any)?.role !== "admin") {
                toast.error("Project is deleted by admin and you are no longer member of this");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        };

        const onProjectCreated = (data: { projectId: string; project: any; assignedUserIds: string[] }) => {
            if (data.assignedUserIds && session?.user?.id && data.assignedUserIds.includes(session.user.id)) {
                toast.success(`You have been assigned to new project: ${data.project.name}`);
                setTimeout(() => {
                   window.location.reload();
                }, 2000);
            }
        };

        if (socket) {
            socket.on("project-deleted", onProjectDeleted);
            socket.on("project-created", onProjectCreated);
            return () => {
                socket.off("project-deleted", onProjectDeleted);
                socket.off("project-created", onProjectCreated);
            };
        }
    }, [session]);

    useEffect(() => {
        if (!session) return;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // In a real app, these endpoints would be filtered by the current user
                const [projectsRes] = await Promise.all([
                    fetch("/api/projects", { cache: "no-store" }), 
                ]);

                const projectsData = await projectsRes.json();
                
                // Filter for demonstration (assuming API returns all)
                // In production, API should filter by session.user.id
                const userProjects = (projectsData.data || []).slice(0, 3); 

                setStats({
                    myProjects: userProjects.length,
                    pendingTasks: 12, // Mock data
                    eodStreak: 5, // Mock data
                    bugsAssigned: 3 // Mock data
                });

                setMyProjects(userProjects);
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
            <div className="p-8 space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid gap-6 sm:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            </div>
        );
    }

    const kpiCards = [
        {
            title: "My Projects",
            value: stats.myProjects,
            subtitle: "Active assignments",
            trend: "+1 new this week",
            icon: FolderKanban,
            gradient: "from-blue-500 via-blue-600 to-indigo-600",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600"
        },
        {
            title: "Pending Tasks",
            value: stats.pendingTasks,
            subtitle: "To be completed",
            trend: "Due this week",
            icon: ClipboardList,
            gradient: "from-orange-500 via-orange-600 to-red-600",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600"
        },
        {
            title: "EOD Streak",
            value: `${stats.eodStreak} Days`,
            subtitle: "Consistent reporting",
            trend: "Keep it up!",
            icon: ClipboardCheck,
            gradient: "from-emerald-500 via-teal-600 to-cyan-600",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600"
        },
        {
            title: "Bugs Assigned",
            value: stats.bugsAssigned,
            subtitle: "Requiring attention",
            trend: "-2 vs last week",
            icon: Bug,
            gradient: "from-purple-500 via-purple-600 to-pink-600",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600"
        }
    ];

    const quickActions = [
        {
            title: "Submit EOD",
            subtitle: "Daily report",
            icon: ClipboardCheck,
            href: "/user/eods/new",
            bgColor: "bg-emerald-50",
            iconColor: "text-emerald-600"
        },
        {
            title: "My Tasks",
            subtitle: "View assignments",
            icon: ClipboardList,
            href: "/user/tasks",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600"
        },
        {
            title: "Project Chat",
            subtitle: "Team discussion",
            icon: MessageSquare,
            href: "/user/chat",
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600"
        },
        {
            title: "Code Links",
            subtitle: "Repository links",
            icon: FileCode2,
            href: "/user/links",
            bgColor: "bg-pink-50",
            iconColor: "text-pink-600"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0f172a]">
                        Hello, {session?.user.name}!
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">Here's your personal overview</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search projects..." 
                            className="pl-9 w-full md:w-64 bg-white border-slate-200 rounded-xl h-10 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("p-3 rounded-xl", kpi.iconBg)}>
                                    <kpi.icon className={cn("h-6 w-6", kpi.iconColor)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-3xl font-black text-[#0f172a]">{kpi.value}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{kpi.title}</div>
                                <div className="text-xs text-muted-foreground">{kpi.subtitle}</div>
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
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
                <h3 className="text-lg font-black uppercase tracking-tight text-[#0f172a] mb-4">Quick Actions</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href}>
                            <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-transform", action.bgColor)}>
                                            <action.icon className={cn("h-5 w-5", action.iconColor)} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-[#0f172a] group-hover:text-blue-600 transition-colors">{action.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Assignemnts */}
            <Card className="border-none shadow-xl">
                <CardHeader className="border-b bg-slate-50/50 px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base md:text-lg font-black uppercase tracking-tight">My Recent Projects</CardTitle>
                        <Button variant="link" className="text-blue-600 font-bold text-xs md:text-sm self-start sm:self-auto" asChild>
                            <Link href="/user/projects">
                                View All <ArrowRight className="ml-2 h-3 md:h-4 w-3 md:w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Project Name</TableHead>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Client</TableHead>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                    <TableHead className="px-6 font-black uppercase tracking-wider text-muted-foreground">Your Tasks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myProjects.map((project) => (
                                    <TableRow key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="px-6 py-4">
                                            <Link href={`/user/projects/${project.id}`} className="font-bold text-sm text-[#0f172a] hover:text-blue-600 transition-colors">
                                                {project.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-0.5">{project.clientName || "Direct Client"}</p>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <span className="text-sm text-slate-600">{project.clientName || "—"}</span>
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
