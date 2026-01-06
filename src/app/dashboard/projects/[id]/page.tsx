
"use client";

import { useEffect, useState, use, useCallback } from "react";
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
    MessageSquare,
    FileText,
    ClipboardList,
    FileCode2,
    LinkIcon,
    History,
    Plus,
    ExternalLink,
    Download,
    Eye,
    ChevronRight,
    Search,
    Filter,
    Edit3
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectDetails {
    id: string;
    name: string;
    status: string;
    clientName: string;
    description: string | null;
    totalTime: string;
    completedTime: string;
    updatedAt: string;
    team: any[];
}

interface Task {
    id: string;
    name: string;
    status: string;
    deadline: string | null;
    estimatedTime: string | null;
    completedTime: string | null;
    assignees: any[];
}

interface Memo {
    id: string;
    memoContent: string;
    reportDate: string;
    user: any;
}

interface EOD {
    id: string;
    clientUpdate: string | null;
    actualUpdate: string;
    reportDate: string;
    user: any;
}

interface Asset {
    id: string;
    name: string;
    url: string;
    fileType: string;
    size: string;
    updatedAt: string;
    uploader: any;
}

interface LinkData {
    id: string;
    title: string;
    url: string;
    category: string | null;
    updatedAt: string;
    uploader: any;
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = authClient.useSession();
    const userRole = (session?.user as any)?.role;
    const router = useRouter();

    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [memos, setMemos] = useState<Memo[]>([]);
    const [eods, setEods] = useState<EOD[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [links, setLinks] = useState<LinkData[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [projRes, tasksRes, memosRes, eodsRes, assetsRes, linksRes] = await Promise.all([
                fetch(`/api/projects/${id}`),
                fetch(`/api/tasks?projectId=${id}`),
                fetch(`/api/memos?projectId=${id}`),
                fetch(`/api/eods?projectId=${id}`),
                fetch(`/api/assets?projectId=${id}`),
                fetch(`/api/links?projectId=${id}`)
            ]);

            const [proj, taskList, memoList, eodList, assetList, linkList] = await Promise.all([
                projRes.json(),
                tasksRes.json(),
                memosRes.json(),
                eodsRes.json(),
                assetsRes.json(),
                linksRes.json()
            ]);

            setProject(proj);
            setTasks(taskList);
            setMemos(memoList);
            setEods(eodList);
            setAssets(assetList);
            setLinks(linkList);
        } catch (error) {
            console.error("Failed to fetch project data", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const canManageProjects = hasPermission(userRole, "CAN_MANAGE_PROJECTS");

    if (isLoading) return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-[400px] lg:col-span-2" />
                <Skeleton className="h-[400px]" />
            </div>
        </div>
    );

    if (!project) return <div className="p-8 text-center text-muted-foreground">Project not found</div>;

    const progress = project.completedTime && project.totalTime 
        ? Math.round((parseInt(project.completedTime) / parseInt(project.totalTime)) * 100) 
        : 0;

    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'on-hold': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white shadow-sm border border-slate-100">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a]">{project.name}</h2>
                            <Badge className={cn("font-bold shadow-none border px-2.5 py-0.5", getStatusColor(project.status))}>
                                {project.status.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-blue-500" />
                            {project.clientName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider" asChild>
                        <Link href={`/dashboard/chat/${id}`}>
                            <MessageSquare className="mr-2 h-3.5 w-3.5 text-blue-500" />
                            Project Chat
                        </Link>
                    </Button>
                    {canManageProjects && (
                        <Button 
                            className="bg-[#0f172a] hover:bg-[#1e293b] font-bold text-xs uppercase tracking-wider border-b-2 border-slate-800"
                            onClick={() => router.push(`/dashboard/projects/${id}/edit`)}
                        >
                            <Edit3 className="mr-2 h-3.5 w-3.5" />
                            Edit Project
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Overview Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="border-none shadow-sm bg-white overflow-hidden group">
                            <div className="h-1 w-full bg-blue-500" />
                            <CardContent className="p-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Estimated Time</p>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-[#0f172a]">{project.totalTime || "0"}h</h3>
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-white overflow-hidden group">
                            <div className="h-1 w-full bg-indigo-500" />
                            <CardContent className="p-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Tasks Done</p>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-[#0f172a]">{tasks.filter(t => t.status === 'done').length}/{tasks.length}</h3>
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                        <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="border-none shadow-sm bg-white overflow-hidden group">
                            <div className="h-1 w-full bg-violet-500" />
                            <CardContent className="p-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Team Size</p>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-[#0f172a]">{project.team?.length || 0}</h3>
                                    <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                                        <Users className="h-5 w-5 text-violet-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 gap-8 mb-6 overflow-x-auto">
                            {[
                                { id: "overview", label: "Overview", icon: FolderKanban },
                                { id: "tasks", label: "Tasks", icon: ClipboardList, count: tasks.length },
                                { id: "memos", label: "Memos", icon: FileText, count: memos.length },
                                { id: "eods", label: "Reports", icon: History, count: eods.length },
                                { id: "files", label: "Files", icon: FileCode2, count: assets.length },
                                { id: "links", label: "Links", icon: LinkIcon, count: links.length }
                            ].map((tab) => (
                                <TabsTrigger 
                                    key={tab.id} 
                                    value={tab.id} 
                                    className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none px-0 py-4 font-bold text-sm bg-transparent shadow-none"
                                >
                                    <tab.icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                    {tab.count !== undefined && (
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500">
                                            {tab.count}
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="mt-2 min-h-[400px]">
                            <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                     <CardHeader className="bg-slate-50/30">
                                        <CardTitle className="text-lg font-bold">Project Progress</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-sm font-bold text-[#0f172a]">Overall Completion</p>
                                                    <p className="text-xs text-slate-500">Based on estimated vs completed hours</p>
                                                </div>
                                                <span className="text-2xl font-black text-blue-600 font-mono">{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-3 bg-slate-100 rounded-full overflow-hidden" />
                                        </div>

                                        <div className="pt-6 border-t border-slate-100">
                                            <p className="text-sm font-black text-[#0f172a] uppercase tracking-wider mb-4">Description</p>
                                            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-6 border border-slate-100 italic">
                                                {project.description || "Every project starts with a vision. This one is no different. We aim to deliver excellence through collaboration, innovation, and persistent effort."}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="bg-slate-50/30 flex flex-row items-center justify-between py-4">
                                        <CardTitle className="text-lg font-bold">Key Tasks</CardTitle>
                                        <Button variant="ghost" size="sm" className="font-bold text-blue-600" onClick={() => setActiveTab("tasks")}>
                                            View All
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {tasks.slice(0, 5).map((task) => (
                                                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                                            task.status === 'done' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                        )}>
                                                            {task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#0f172a]">{task.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">
                                                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-none border",
                                                        task.status === 'done' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                                                    )}>
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {tasks.length === 0 && (
                                                <div className="p-12 text-center text-slate-400 italic text-sm">No tasks created yet.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="tasks" className="focus-visible:outline-none">
                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                     <CardHeader className="bg-slate-50/30 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold">Task Roadmap</CardTitle>
                                            <CardDescription>All planned and completed activities</CardDescription>
                                        </div>
                                        {canManageProjects && (
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                <Plus className="h-4 w-4 mr-2" /> New Task
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/50 border-b">
                                                <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                                                    <th className="px-6 py-4">Task Name</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Deadline</th>
                                                    <th className="px-6 py-4 text-right">Assignees</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {tasks.map((task) => (
                                                    <tr key={task.id} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="px-6 py-5">
                                                            <p className="text-sm font-bold text-[#0f172a]">{task.name}</p>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <Badge className={cn(
                                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-none border",
                                                                task.status === 'done' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                                                            )}>
                                                                {task.status.replace('_', ' ')}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-slate-500 font-medium font-mono">
                                                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : '--'}
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex -space-x-2 overflow-hidden justify-end">
                                                                {task.assignees.map((u, i) => (
                                                                    <Avatar key={i} className="inline-block border-2 border-white ring-0 h-7 w-7">
                                                                        <AvatarFallback className="text-[10px] font-bold text-slate-500 bg-slate-100">{u.name[0]}</AvatarFallback>
                                                                    </Avatar>
                                                                ))}
                                                                {task.assignees.length === 0 && <span className="text-[10px] text-slate-300">Unassigned</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="memos" className="focus-visible:outline-none">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {memos.map((memo) => (
                                        <Card key={memo.id} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback className="text-[8px] font-bold">{memo.user.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <p className="text-[10px] font-bold text-slate-600">{memo.user.name}</p>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-slate-400">{new Date(memo.reportDate).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">"{memo.memoContent}"</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {memos.length === 0 && (
                                        <div className="col-span-full py-20 text-center space-y-4">
                                            <FileText className="h-12 w-12 text-slate-200 mx-auto" />
                                            <p className="text-slate-400 italic text-sm">No memos recorded for this project.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="eods" className="focus-visible:outline-none">
                                <div className="space-y-4">
                                    {eods.map((eod) => (
                                        <Card key={eod.id} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
                                            <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs font-bold">{eod.user.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#0f172a]">{eod.user.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">{new Date(eod.reportDate).toDateString()}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] bg-white">EOD REPORT</Badge>
                                            </CardHeader>
                                            <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Client Sync</h4>
                                                    <p className="text-sm text-slate-600 bg-blue-50/30 p-3 rounded-xl border border-blue-50/50 min-h-[60px]">
                                                        {eod.clientUpdate || "No client-facing update provided."}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Internal Update</h4>
                                                    <p className="text-sm text-slate-600 bg-indigo-50/30 p-3 rounded-xl border border-indigo-50/50 min-h-[60px]">
                                                        {eod.actualUpdate}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {eods.length === 0 && (
                                        <div className="py-20 text-center space-y-4">
                                            <ClipboardList className="h-12 w-12 text-slate-200 mx-auto" />
                                            <p className="text-slate-400 italic text-sm">No EOD reports found.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="files" className="focus-visible:outline-none">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {assets.map((asset) => (
                                        <Card key={asset.id} className="border-none shadow-sm bg-white overflow-hidden group">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                    <FileCode2 className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-[#0f172a] truncate">{asset.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black">{asset.fileType} • {asset.size ? `${(parseInt(asset.size)/1024).toFixed(1)} KB` : 'N/A'}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" asChild>
                                                    <a href={asset.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {assets.length === 0 && (
                                        <div className="col-span-full py-20 text-center space-y-4">
                                            <FileCode2 className="h-12 w-12 text-slate-200 mx-auto" />
                                            <p className="text-slate-400 italic text-sm">No assets uploaded.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="links" className="focus-visible:outline-none">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {links.map((link) => (
                                        <Card key={link.id} className="border-none shadow-sm bg-white overflow-hidden group">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                    <LinkIcon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-[#0f172a] truncate">{link.title}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black truncate">{link.category || 'Documentation'}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-blue-500" asChild>
                                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {links.length === 0 && (
                                        <div className="col-span-full py-20 text-center space-y-4">
                                            <LinkIcon className="h-12 w-12 text-slate-200 mx-auto" />
                                            <p className="text-slate-400 italic text-sm">No external links found.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Team Members */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/30 flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-lg font-bold">Team</CardTitle>
                            <Badge variant="secondary" className="bg-slate-100 text-[#0f172a] font-bold border-none">{project.team?.length || 0}</Badge>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {project.team?.map((member, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                            <AvatarImage src={member.image} />
                                            <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 font-bold text-xs">
                                                {member.name.split(" ").map(n => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#0f172a] group-hover:text-blue-600 transition-colors">{member.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
                                    </div>
                                ))}
                                {canManageProjects && (
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-xs font-bold border-dashed border-slate-200 py-6 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all rounded-xl mt-4"
                                        onClick={() => router.push(`/dashboard/projects/${id}/edit`)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Manage Team
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline / Activity - Mocked for now using data from project.updatedAt */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/30 py-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <History className="h-5 w-5 text-slate-400" />
                                Project Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:bg-slate-50">
                                <div className="relative flex items-start gap-4">
                                    <div className="relative flex h-6 w-6 items-center justify-center">
                                        <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#0f172a]">Project Updated</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1">{new Date(project.updatedAt).toLocaleDateString()} at {new Date(project.updatedAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="relative flex items-start gap-4">
                                    <div className="relative flex h-6 w-6 items-center justify-center">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#0f172a]">Latest EOD</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                                            {eods.length > 0 ? new Date(eods[0].reportDate).toDateString() : 'No entries yet'}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative flex items-start gap-4">
                                    <div className="relative flex h-6 w-6 items-center justify-center">
                                        <div className="h-3 w-3 rounded-full bg-slate-200 ring-4 ring-slate-50" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-400">Project Initialized</p>
                                        <p className="text-[10px] text-slate-300 font-mono mt-1">Foundational setup completed</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

const FolderKanban = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        <path d="M8 10v4"/>
        <path d="M12 10v2"/>
        <path d="M16 10v6"/>
    </svg>
)
