"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Link as LinkIcon,
    Search,
    ExternalLink,
    FolderKanban,
    ArrowLeft,
    Users,
    Calendar,
    Building2,
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

import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

export default function UserProjectDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const projectId = params.id as string;
    const defaultTab = searchParams.get("tab") || "overview";
    const router = useRouter();

    const { data: session, isPending } = authClient.useSession();
    const [project, setProject] = useState<Project | null>(null);
    const [links, setLinks] = useState<SharedLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const socket = getSocket();
        
        const onProjectDeleted = (data: { projectId: string }) => {
            if (data.projectId === projectId) {
                if ((session?.user as any)?.role !== "admin") {
                    toast.error("Project is deleted by admin and you are no longer member of this");
                    // Redirect if currently viewing this project
                    setTimeout(() => {
                        router.push("/user/projects");
                    }, 2000);
                }
            }
        };

        if (socket && projectId) {
            socket.on("project-deleted", onProjectDeleted);
            return () => {
                socket.off("project-deleted", onProjectDeleted);
            };
        }
    }, [projectId, router, session]);

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
                        updatedAt: new Date(projectData.updatedAt),
                        progress: projectData.progress || 0
                    });
                } else if (projectRes.status === 404) {
                   setProject(null);
                }

                // Fetch project links
                const linksRes = await fetch(`/api/links?projectId=${projectId}`);
                if (linksRes.ok) {
                    const linksData = await linksRes.json();
                    setLinks(linksData.map((l: any) => ({
                        ...l,
                        createdAt: new Date(l.createdAt)
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch project data", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session && projectId) {
            fetchProjectData();
        } else if (!isPending && !session) {
            // Session loaded but user is not authenticated
            setIsLoading(false);
        }
    }, [session, projectId, isPending]);

    const filteredLinks = links.filter(link =>
        link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (link.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    if (isPending || isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/user/projects">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Projects
                        </Link>
                    </Button>
                </div>
                <Card className="p-20">
                    <div className="text-center space-y-4">
                        <h3 className="text-xl font-bold text-[#0f172a]">Project Not Found</h3>
                        <p className="text-muted-foreground">The project you're looking for doesn't exist or you don't have access to it.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm" className="h-9">
                        <Link href="/user/projects">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] uppercase">{project.name}</h2>
                        <p className="text-muted-foreground text-sm mt-1">Project Details & Resources</p>
                    </div>
                </div>
                <Badge className={cn(
                    "border-none px-3 py-1.5 font-bold text-xs uppercase shadow-none",
                    project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        project.status === "completed" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                )}>
                    <div className={cn(
                        "h-2 w-2 rounded-full mr-2",
                        project.status === "active" ? "bg-emerald-500" :
                            project.status === "completed" ? "bg-blue-500" : "bg-slate-500"
                    )} />
                    {project.status}
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="bg-white p-1 border h-auto">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <FolderKanban className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="links" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Links
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Project Info Card */}
                        <Card className="border-none shadow-md bg-white">
                            <CardHeader className="border-b bg-slate-50/30 pb-4">
                                <h3 className="text-lg font-bold text-[#0f172a] uppercase tracking-tight">Project Information</h3>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</p>
                                        <p className="text-sm font-semibold text-[#0f172a] mt-1">{project.clientName || "Direct Client"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Updated</p>
                                        <p className="text-sm font-semibold text-[#0f172a] mt-1">
                                            {new Date(project.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                {project.description && (
                                    <div className="pt-4 border-t">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Progress Card */}
                        <Card className="border-none shadow-md bg-white">
                            <CardHeader className="border-b bg-slate-50/30 pb-4">
                                <h3 className="text-lg font-bold text-[#0f172a] uppercase tracking-tight">Progress</h3>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Completion</span>
                                        <span className="text-2xl font-black text-blue-600">{project.progress}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Team Members */}
                    {project.team && project.team.length > 0 && (
                        <Card className="border-none shadow-md bg-white">
                            <CardHeader className="border-b bg-slate-50/30 pb-4">
                                <h3 className="text-lg font-bold text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Team Members
                                </h3>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {project.team.map((member) => (
                                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#0f172a]">{member.name}</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Links Tab */}
                <TabsContent value="links" className="space-y-6">
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader className="border-b bg-slate-50/30 px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#0f172a] uppercase tracking-tight">Project Links</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Resources and files for this project</p>
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
                                                        {link.description || "No description provided for this resource."}
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
                                        <h4 className="text-base font-black text-[#0f172a] uppercase tracking-tight">No Links Found</h4>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {searchQuery ? "No links match your search." : "No links have been added to this project yet."}
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
