"use client";

import { useEffect, useState, useCallback } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Eye, MoreHorizontal, FolderKanban, Plus, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";

interface Project {
    id: string;
    name: string;
    status: string;
    clientName: string | null;
    updatedAt: string;
    progress?: number;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ProjectsPage() {
    const { data: session } = authClient.useSession();
    const userRole = (session?.user as any)?.role;

    const [projects, setProjects] = useState<Project[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchProjects = useCallback(() => {
        setIsLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.append("search", search);
        if (statusFilter !== "all") params.append("status", statusFilter);

        fetch(`/api/projects?${params.toString()}`)
            .then((res) => res.json())
            .then((resData) => {
                // Mocking progress for demonstration
                const dataWithProgress = resData.data.map((p: any) => ({ 
                    ...p, 
                    progress: Math.floor(Math.random() * 100) 
                }));
                setProjects(dataWithProgress);
                setMeta(resData.meta);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, [page, search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProjects();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchProjects]);

    const canManageProjects = hasPermission(userRole, "CAN_MANAGE_PROJECTS");

    if (isLoading && projects.length === 0) return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Projects</h2>
                    <p className="text-muted-foreground">Monitor and manage all active organization projects</p>
                </div>
                {canManageProjects && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Link href="/dashboard/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                )}
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b py-4 px-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search projects..." 
                                className="pl-10 bg-slate-50 border-none focus-visible:ring-1"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select 
                                value={statusFilter} 
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[150px] bg-slate-50 border-none">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="on-hold">On Hold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="w-[80px] font-bold text-muted-foreground uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Project Information</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Status</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Progress</TableHead>
                                    <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length > 0 ? (
                                    projects.map((project, index) => (
                                        <TableRow key={project.id} className="group transition-colors hover:bg-slate-50/50">
                                            <TableCell className="pl-6 font-medium text-slate-500">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                        <FolderKanban className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#0f172a]">{project.name}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase tracking-tight">{project.clientName || "Direct Client"}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none px-2.5 py-0.5 font-bold text-[10px] uppercase shadow-none",
                                                    project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                                                    project.status === "completed" ? "bg-blue-100 text-blue-700" :
                                                    "bg-slate-100 text-slate-700"
                                                )}>
                                                    {project.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <Progress value={project.progress} className="h-1.5 w-24 bg-slate-100" />
                                                    <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-100">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Options</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/projects/${project.id}`} className="cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                                                <span>View Details</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {canManageProjects && (
                                                            <DropdownMenuItem className="text-slate-600 cursor-pointer">
                                                                <Edit3 className="mr-2 h-4 w-4" />
                                                                <span>Edit Project</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            {isLoading ? "Loading projects..." : "No projects found."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> projects
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-xs font-bold text-[#0f172a] px-2">
                                    Page {page} of {meta.totalPages}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
