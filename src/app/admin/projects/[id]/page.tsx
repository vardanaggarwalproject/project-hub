"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Link as LinkIcon,
    Search,
    ExternalLink,
    FolderKanban,
    ArrowLeft,
    Users,
    Calendar,
    Edit3,
    Building2,
    PieChart
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name: string;
    status: string;
    clientName: string | null;
    description: string | null;
    updatedAt: Date;
    progress?: number;
    team?: Array<{
        id: string;
        name: string;
        image: string | null;
        role: string;
    }>;
}

interface SharedLink {
    id: string;
    name: string;
    url: string;
    description: string | null;
    projectId: string;
    createdAt: Date;
}

export default function AdminProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { data: session } = authClient.useSession();
    const [project, setProject] = useState<Project | null>(null);
    const [links, setLinks] = useState<SharedLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProjectData = async () => {
            setIsLoading(true);
            try {
                // Fetch project details
                const projectRes = await fetch(`/api/projects/${projectId}`);
                if (projectRes.ok) {
                    const projectData = await projectRes.json();
                    setProject({
                        ...projectData,
                        progress: projectData.progress || Math.floor(Math.random() * 100)
                    });
                }

                // Fetch project links
                const linksRes = await fetch(`/api/links?projectId=${projectId}`);
                if (linksRes.ok) {
                    const linksData = await linksRes.json();
                    setLinks(linksData);
                }
            } catch (error) {
                console.error("Failed to fetch project data", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session && projectId) {
            fetchProjectData();
        }
    }, [session, projectId]);

    const filteredLinks = links.filter(link =>
        link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (link.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="space-y-6">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/projects">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                    </Link>
                </Button>
                <div className="text-center py-20 bg-slate-50 rounded-xl">
                    <h3 className="text-xl font-bold text-[#0f172a]">Project Not Found</h3>
                    <p className="text-muted-foreground mt-2">The requested project could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full">
                        <Link href="/admin/projects">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] uppercase">{project.name}</h2>
                            <Badge className={cn(
                                "border-none px-2.5 py-0.5 font-bold text-[10px] uppercase shadow-none",
                                project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                                    project.status === "completed" ? "bg-blue-100 text-blue-700" :
                                        "bg-slate-100 text-slate-700"
                            )}>
                                {project.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">Project Overview & Management</p>
                    </div>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Link href={`/admin/projects/${projectId}/edit`}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Project
                    </Link>
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white p-1 border h-auto w-full sm:w-auto overflow-x-auto justify-start">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <PieChart className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="links" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Links & Resources
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Project Info Card */}
                        <Card className="border-none shadow-md bg-app-card">
                            <CardHeader className="border-b bg-app-subtle pb-4">
                                <h3 className="text-base font-bold text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    Details
                                </h3>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
                                        <div className="font-semibold text-slate-700 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                            {project.clientName || "Direct Client"}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Updated</p>
                                        <div className="font-semibold text-slate-700 flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Progress</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-black text-slate-700">{project.progress}%</span>
                                    </div>
                                </div>

                                {project.description && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {project.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Team Card */}
                        <Card className="border-none shadow-md bg-app-card flex flex-col">
                             <CardHeader className="border-b bg-app-subtle pb-4 flex flex-row items-center justify-between">
                                <h3 className="text-base font-bold text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    Team
                                </h3>
                                <Badge variant="outline" className="font-mono text-xs">{project.team?.length || 0} Members</Badge>
                            </CardHeader>
                            <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col">
                                {project.team && project.team.length > 0 ? (
                                    <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-100">
                                        {project.team.map((member) => (
                                            <div key={member.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                                                <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm shadow-sm">
                                                    {member.image ? (
                                                        <img src={member.image} alt={member.name} className="h-full w-full rounded-full object-cover" />
                                                    ) : (
                                                        member.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#0f172a]">{member.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{member.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                            <Users className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">No team members assigned</p>
                                        <Button variant="link" size="sm" asChild className="text-blue-600 h-auto p-0 mt-1">
                                            <Link href={`/admin/projects/${projectId}/edit`}>Add Members</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Links Tab */}
                <TabsContent value="links" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border-none shadow-md bg-app-card">
                        <CardHeader className="border-b bg-app-subtle px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#0f172a] uppercase tracking-tight">Project Resources</h3>
                                    <p className="text-xs text-muted-foreground mt-1">External links and documentation</p>
                                </div>
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search links..."
                                        className="pl-10 bg-white border-slate-200"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredLinks.length > 0 ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 p-6 gap-4">
                                    {filteredLinks.map((link) => (
                                        <Card key={link.id} className="group border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white ring-1 ring-slate-100 hover:ring-blue-100">
                                            <div className="p-5 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                                        <LinkIcon className="h-4 w-4" />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600" asChild>
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight line-clamp-1">{link.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest line-clamp-1">{new URL(link.url).hostname}</p>
                                                </div>
                                                <div className="min-h-[32px]">
                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                        {link.description || "No description provided."}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                        <LinkIcon className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <div className="max-w-xs space-y-2">
                                        <h4 className="text-base font-black text-[#0f172a] uppercase tracking-tight">No Resources Found</h4>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {searchQuery ? "No links match your search." : "This project has no shared links yet."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
