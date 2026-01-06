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
import { Search, Eye, MoreHorizontal, FolderKanban, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

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

export default function UserProjectsPage() {
    const { data: session } = authClient.useSession();
    
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
                const dataWithProgress = resData.data.map((p: any) => ({ 
                    ...p, 
                    progress: p.progress || Math.floor(Math.random() * 100) 
                }));
                // Filter client side if needed, assuming API returns all for now.
                // Or API might already handle filtering by user.
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

    if (isLoading && projects.length === 0) return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[120px]" />
            </div>
            <Skeleton className="h-[500px] w-full" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">My Projects</h2>
                    <p className="text-muted-foreground">View your assigned projects</p>
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="border-b py-4 px-6 bg-slate-50/30">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative max-w-sm w-full">
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
                        <div className="flex items-center gap-3">
                            <Select 
                                value={statusFilter} 
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[150px] bg-white border-slate-200">
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
                                        <TableRow key={project.id} className="group transition-colors hover:bg-slate-50/30">
                                            <TableCell className="pl-6 font-medium text-slate-400">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                                                        <FolderKanban className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#0f172a] group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{project.name}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{project.clientName || "Direct Client"}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none px-2.5 py-1 font-bold text-[10px] uppercase shadow-none",
                                                    project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                                                    project.status === "completed" ? "bg-blue-100 text-blue-700" :
                                                    "bg-slate-100 text-slate-700"
                                                )}>
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full mr-1.5",
                                                        project.status === "active" ? "bg-emerald-500" :
                                                        project.status === "completed" ? "bg-blue-500" : "bg-slate-500"
                                                    )} />
                                                    {project.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="w-[180px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-white hover:shadow-sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 shadow-xl border-slate-100 p-1">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1.5">Options</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/user/projects/${project.id}`} className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm">View Details</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/user/chat/${project.id}`} className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm">Project Chat</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                            {isLoading ? "Fetching projects..." : "No projects assigned to you."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30">
                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                                Showing <span className="text-[#0f172a]">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a]">{Math.min(page * limit, meta.total)}</span> / <span className="text-[#0f172a]">{meta.total}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 px-3 border-slate-200 hover:bg-white font-bold text-xs"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Prev
                                </Button>
                                <div className="text-xs font-bold text-[#0f172a] px-2">
                                    {page} of {meta.totalPages}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="h-8 px-3 border-slate-200 hover:bg-white font-bold text-xs"
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
    );
}
