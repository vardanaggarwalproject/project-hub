"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Calendar, 
    Clock, 
    Users, 
    CheckCircle2, 
    ArrowLeft, 
    MoreVertical,
    MessageSquare,
    FileText,
    ClipboardList,
    FileCode2,
    LinkIcon,
    History,
    Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";

interface ProjectDetails {
    id: string;
    name: string;
    status: string;
    clientName: string;
    totalTime: string;
    completedTime: string;
    updatedAt: string;
    description?: string;
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = authClient.useSession();
    const userRole = (session?.user as any)?.role;
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/projects/${id}`)
            .then(res => res.json())
            .then(data => {
                setProject(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [id]);

    const canManageProjects = hasPermission(userRole, "CAN_MANAGE_PROJECTS");

    if (isLoading) return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
    if (!project) return <div className="p-8 text-center text-muted-foreground">Project not found</div>;

    const progress = project.completedTime && project.totalTime 
        ? Math.round((parseInt(project.completedTime) / parseInt(project.totalTime)) * 100) 
        : 45; // Mocking if 0

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">{project.name}</h2>
                    <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest leading-none mt-1">{project.clientName}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                        <Link href={`/dashboard/chat/${id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Project Chat
                        </Link>
                    </Button>
                    {canManageProjects && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Edit Project</Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Project Overview</CardTitle>
                            <CardDescription>Detailed summary and current progress of the project.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                                    <Badge className={cn(
                                        "mt-1 font-bold shadow-none border-none",
                                        project.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                    )}>
                                        {project.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Work</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span className="font-bold text-[#0f172a]">{project.totalTime || "0"} Hours</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Last Activity</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span className="font-bold text-[#0f172a]">{new Date(project.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <p className="text-sm font-bold text-[#0f172a]">Overall Completion</p>
                                    <span className="text-sm font-bold text-blue-600">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-slate-100" />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-bold text-[#0f172a]">Description</p>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {project.description || "No project description provided. This project focuses on delivering high-quality results for the client while maintaining strict adherence to timelines and requirements."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="memos" className="w-full">
                        <TabsList className="bg-slate-100/50 p-1 h-12 w-full justify-start gap-2 border-none">
                            <TabsTrigger value="memos" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold text-xs uppercase h-10 px-4">
                                <FileText className="h-3.5 w-3.5 mr-2" />
                                Memos
                            </TabsTrigger>
                            <TabsTrigger value="eods" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold text-xs uppercase h-10 px-4">
                                <ClipboardList className="h-3.5 w-3.5 mr-2" />
                                EODs
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold text-xs uppercase h-10 px-4">
                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                Chat
                            </TabsTrigger>
                            <TabsTrigger value="assets" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold text-xs uppercase h-10 px-4">
                                <FileCode2 className="h-3.5 w-3.5 mr-2" />
                                Assets
                            </TabsTrigger>
                            <TabsTrigger value="links" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold text-xs uppercase h-10 px-4">
                                <LinkIcon className="h-3.5 w-3.5 mr-2" />
                                Links
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-4">
                            <TabsContent value="memos" className="space-y-4">
                                <Card className="border-none shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                                    No memos recorded for this project yet.
                                </Card>
                            </TabsContent>
                            <TabsContent value="eods">
                                <Card className="border-none shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                                    No EOD reports found.
                                </Card>
                            </TabsContent>
                            <TabsContent value="chat">
                                <Card className="border-none shadow-sm min-h-[300px] p-0 overflow-hidden">
                                     <div className="p-8 text-center space-y-4">
                                        <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                                        <p className="text-muted-foreground text-sm">Access the live discussion for this project.</p>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/chat/${id}`}>Open Chat Room</Link>
                                        </Button>
                                     </div>
                                </Card>
                            </TabsContent>
                            <TabsContent value="assets">
                                <Card className="border-none shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                                    No project assets uploaded yet.
                                </Card>
                            </TabsContent>
                            <TabsContent value="links">
                                <Card className="border-none shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                                    No external links associated.
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Team Members</CardTitle>
                            <CardDescription>Assigned collaborators</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-5">
                                {[
                                    { name: "Alex Johnson", role: "Team Lead", color: "bg-blue-100 text-blue-700" },
                                    { name: "Sarah Smith", role: "Frontend Dev", color: "bg-emerald-100 text-emerald-700" },
                                    { name: "Mike Ross", role: "Designer", color: "bg-purple-100 text-purple-700" },
                                ].map((member, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm", member.color)}>
                                            {member.name.split(" ").map(n => n[0]).join("")}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#0f172a]">{member.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                                {canManageProjects && (
                                    <Button variant="outline" className="w-full text-xs font-bold border-dashed mt-2 py-5 border-slate-200 hover:bg-slate-50">
                                        <Plus className="h-3.5 w-3.5 mr-2" />
                                        Assign New Member
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-4 w-4 text-slate-400" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 py-0 pb-6">
                            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:bg-slate-100">
                                {[
                                    { text: "EOD Report submitted", time: "2 hours ago", sender: "Sarah Smith" },
                                    { text: "New asset uploaded: design-v1.zip", time: "5 hours ago", sender: "Mike Ross" },
                                    { text: "Project status changed to Active", time: "Yesterday", sender: "Alex Johnson" },
                                ].map((activity, i) => (
                                    <div key={i} className="relative flex items-start gap-4">
                                        <div className="relative flex h-6 w-6 items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-[#0f172a]">{activity.text}</p>
                                            <p className="text-[10px] text-muted-foreground">{activity.sender} • {activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
