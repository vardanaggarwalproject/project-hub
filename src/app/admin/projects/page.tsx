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
import { Search, Eye, MoreHorizontal, FolderKanban, Plus, ChevronLeft, ChevronRight, Edit3, MessageSquare } from "lucide-react";
import { useUnreadCounts } from "@/components/chat/unread-count-provider";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from "@/components/ui/tooltip";

interface Project {
    id: string;
    name: string;
    status: string;
    clientName: string | null;
    updatedAt: string;
    progress?: number;
    team?: Array<{
        id: string;
        name: string;
        image: string | null;
        role: string;
    }>;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminProjectsPage() {
    const { data: session } = authClient.useSession();
    const { unreadCounts } = useUnreadCounts();
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

        fetch(`/api/projects?${params.toString()}`, { cache: "no-store" })
            .then((res) => res.json())
            .then((resData) => {
                // Use actual progress from DB, default to 0 if not set
                const dataWithProgress = resData.data.map((p: any) => ({ 
                    ...p, 
                    progress: p.progress ?? 0
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-full sm:w-80 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <div className="border-b-2 border-slate-200">
                    <div className="grid grid-cols-6 gap-4 p-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                </div>
                <div className="p-0">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="grid grid-cols-6 gap-4 p-6 border-b border-slate-100 items-center">
                            <Skeleton className="h-4 w-8" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-2 w-20" />
                                </div>
                            </div>
                            <div className="flex -space-x-3">
                                {[...Array(3)].map((_, j) => (
                                    <Skeleton key={j} className="h-9 w-9 rounded-full border-2 border-white" />
                                ))}
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-2 w-24 rounded-full" />
                                <Skeleton className="h-2 w-8" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );

    return (
        <TooltipProvider>
            <div className="space-y-6">
            {/* Page Header with Search and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Projects</h2>
                    <p className="text-muted-foreground mt-1">Monitor and manage all active organization projects</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search projects..." 
                            className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <Select 
                        value={statusFilter} 
                        onValueChange={(val) => {
                            setStatusFilter(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                        </SelectContent>
                    </Select>
                    {canManageProjects && (
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-md whitespace-nowrap">
                            <Link href="/admin/projects/new">
                                <Plus className="mr-2 h-4 w-4" />
                                New Project
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-50 hover:to-slate-100/50 border-b-2 border-slate-200">
                                    <TableHead className="w-[80px] font-bold text-slate-700 uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Project Information</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Assigned Team</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Status</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Progress</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider text-center">Project Chat</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length > 0 ? (
                                    projects.map((project, index) => (
                                        <TableRow key={project.id} className="group transition-all hover:bg-blue-50/30 border-b border-slate-100">
                                            <TableCell className="pl-6 font-semibold text-slate-500">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm">
                                                        <FolderKanban className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#0f172a] group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{project.name}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{project.clientName || "Direct Client"}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex -space-x-3 overflow-hidden">
                                                    {project.team && project.team.length > 0 ? (
                                                        project.team.slice(0, 4).map((member) => (
                                                            <Tooltip key={member.id}>
                                                                <TooltipTrigger asChild>
                                                                    <Avatar className="h-9 w-9 border-1 border-white shadow-sm ring-[0.5px] ring-slate-100 hover:z-20 hover:scale-110 transition-all duration-200 cursor-pointer">
                                                                        <AvatarImage src={member.image || ""} alt={member.name} />
                                                                        <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                                            {member.name.split(' ').map(n => n[0]).join('')}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="bg-slate-900 border-slate-800 p-2 shadow-xl">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <p className="text-xs font-bold text-white">{member.name}</p>
                                                                        <p className="text-[10px] text-slate-400 capitalize">{member.role}</p>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">No team assigned</span>
                                                    )}
                                                    {project.team && project.team.length > 4 && (
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-[11px] font-bold text-slate-600 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                            +{project.team.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none px-3 py-1 font-bold text-[10px] uppercase shadow-sm",
                                                    project.status === "active" ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700" :
                                                    project.status === "completed" ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700" :
                                                    "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700"
                                                )}>
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full mr-1.5",
                                                        project.status === "active" ? "bg-emerald-500 animate-pulse" :
                                                        project.status === "completed" ? "bg-blue-500" : "bg-slate-500"
                                                    )} />
                                                    {project.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div 
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-500",
                                                                (project.progress || 0) >= 75 ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                                                                (project.progress || 0) >= 50 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                                                                (project.progress || 0) >= 25 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                                                                "bg-gradient-to-r from-red-400 to-pink-500"
                                                            )}
                                                            style={{ width: `${project.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 min-w-[35px] text-right">{project.progress || 0}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/admin/chat`} onClick={() => {
                                                    // This is a bit tricky since admin/chat uses group select.
                                                    // For now, let's just link to admin/chat.
                                                }} className="inline-flex items-center justify-center">
                                                    <div className="relative p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer group/chat">
                                                        <MessageSquare className="h-5 w-5" />
                                                        {(unreadCounts[project.id] ?? 0) > 0 && (
                                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                                                                {unreadCounts[project.id] > 9 ? "9+" : unreadCounts[project.id]}
                                                            </span>
                                                        )}
                                                        <span className="sr-only">Project Chat</span>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 shadow-xl border-slate-200 p-1">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1.5">Options</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/projects/${project.id}`} className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm">View Details</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {canManageProjects && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/projects/${project.id}/edit`} className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                                                        <Edit3 className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    <span className="font-semibold text-sm">Edit Project</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                            {isLoading ? "Fetching organization projects..." : "No projects found matching your criteria."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gradient-to-r from-slate-50/50 to-slate-100/30">
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> projects
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-9 px-3 border-slate-200 hover:bg-white font-bold"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Prev
                                </Button>
                                <div className="text-sm font-bold text-[#0f172a] px-3">
                                    Page {page} of {meta.totalPages}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="h-9 px-3 border-slate-200 hover:bg-white font-bold"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </TooltipProvider>
    );
}
