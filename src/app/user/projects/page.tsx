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
import { Search, Eye, FolderKanban, ChevronLeft, ChevronRight, MessageSquare, History, AlertCircle } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { getSocket } from "@/lib/socket";
import { useUnreadCounts } from "@/components/chat/unread-count-provider";
import { toast } from "sonner";
import { projectsApi } from "@/lib/api/client";
import { ProjectHistoryDialog } from "@/components/project/ProjectHistoryDialog";
import { ProjectDetailsModal } from "@/common/ProjectDetailsModal";
import type { Project } from "@/types/project";
import type { Session } from "@/types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { ClearFilterButton } from "@/components/ui/clear-filter-button";

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function UserProjectsPage() {
    const { data: sessionData, isPending } = authClient.useSession();
    const session = sessionData as Session | null;
    const { unreadCounts } = useUnreadCounts();

    const [projects, setProjects] = useState<Project[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    // Details modal states
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewProjectId, setViewProjectId] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [page, setPage] = useState(1);
    const limit = 10;


    const fetchProjects = useCallback(async () => {
        if (!session?.user?.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (search) params.append("search", search);
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (dateRange?.from) {
                params.append("fromDate", dateRange.from.toISOString());
            }
            if (dateRange?.to) {
                params.append("toDate", dateRange.to.toISOString());
            }

            const resData = await projectsApi.getAll(params);
            setProjects(resData.data || []);
            setMeta(resData.meta || null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch projects");
        } finally {
            setIsLoading(false);
        }
    }, [page, search, statusFilter, dateRange, session?.user?.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProjects();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchProjects]);

    useEffect(() => {
        const socket = getSocket();

        const onProjectDeleted = (data: { projectId: string }) => {
            console.log("🗑️ Project deleted event received for:", data.projectId);
            setProjects(prev => prev.filter(p => p.id !== data.projectId));

            if (session?.user?.role !== "admin") {
                toast.error("Project is deleted by admin and you are no longer member of this");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        };

        const onProjectCreated = (data: { projectId: string; project: Project; assignedUserIds: string[] }) => {
            if (data.assignedUserIds && session?.user?.id && data.assignedUserIds.includes(session.user.id)) {
                toast.success(`You have been assigned to new project: ${data.project.name}`);
                setTimeout(() => {
                   window.location.reload();
                }, 2000);
            }
        };

        socket.on("project-deleted", onProjectDeleted);
        socket.on("project-created", onProjectCreated);

        return () => {
            socket.off("project-deleted", onProjectDeleted);
            socket.off("project-created", onProjectCreated);
        };
    }, [projects.length, session]);

    const handleToggleActive = async (projectId: string, currentStatus: boolean) => {
        if (!session?.user?.id) return;

        // Validation against project status
        const project = projects.find(p => p.id === projectId);
        if (project && project.status !== 'active') {
             const capitalizedStatus = project.status.charAt(0).toUpperCase() + project.status.slice(1);
             toast.error(`Cannot activate project. Status is currently "${capitalizedStatus}".`);
             return;
        }

        try {
            const res = await fetch(`/api/projects/${projectId}/assignment/toggle-active`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session.user.id,
                    isActive: !currentStatus,
                }),
            });

            if (res.ok) {
                toast.success(!currentStatus ? "Project activated" : "Project deactivated");

                // Update local state
                setProjects(prev =>
                    prev.map(p =>
                        p.id === projectId
                            ? { ...p, isActive: !currentStatus }
                            : p
                    )
                );
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to update project status");
            }
        } catch (error) {
            console.error("Failed to toggle active status", error);
            toast.error("Failed to update project status");
        }
    };

    const handleViewProject = (projectId: string) => {
        setViewProjectId(projectId);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = (open: boolean) => {
        setIsDetailsModalOpen(open);
        if (!open) {
            setViewProjectId(null);
        }
    };

    if ((isPending || isLoading) && projects.length === 0) return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                 <div className="flex gap-3">
                    <Skeleton className="h-10 w-full sm:w-80 rounded-lg" />
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
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                            <div className="flex justify-end gap-2">
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-app-heading">My Projects</h2>
                         <p className="text-muted-foreground mt-1">View and manage your assigned projects</p>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-3">
                         <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects..."
                                className="pl-10 bg-app-input border-app focus-ring-app"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <DateRangePicker
                            value={dateRange}
                            onChange={(range) => {
                                setDateRange(range);
                                setPage(1);
                            }}
                            placeholder="Filter by date"
                            className="w-full sm:w-[240px]"
                        />

                        <Select
                            value={statusFilter}
                            onValueChange={(val) => {
                                setStatusFilter(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[150px] bg-app-input border-app">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                        <ClearFilterButton 
                            isActive={!!(search || statusFilter !== "all" || dateRange)}
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("all");
                                setDateRange(undefined);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <Card className="border-none shadow-app overflow-hidden bg-app-card border border-app">
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-app-table-header hover:bg-app-table-header border-b-2 border-app">
                                        <TableHead className="w-[80px] font-bold text-app-body uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                        <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider">Project Information</TableHead>
                                        <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider">Status</TableHead>
                                        <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider text-center">Actively Working</TableHead>
                                        <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider text-center">Project Chat</TableHead>
                                        <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider text-center">History</TableHead>
                                        <TableHead className="text-right font-bold text-app-body uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.length > 0 ? (
                                        projects.map((project, index) => (
                                            <TableRow key={project.id} className="group transition-all bg-app-table-row-hover border-b border-app-light">
                                                <TableCell className="pl-6 font-semibold text-app-body">{(page - 1) * limit + index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 text-blue-600 dark:text-blue-400 shadow-sm">
                                                            <FolderKanban className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-bold text-app-heading group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm tracking-tight">{project.name}</div>
                                                                {project.isMemoRequired && (
                                                                     <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-amber-50 text-amber-700 border-amber-300 text-[9px] px-1.5 py-0 h-4 cursor-help font-bold"
                                                                            >
                                                                                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                                                                140
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top" className="max-w-xs">
                                                                            <p className="text-xs font-medium">This project requires detailed memos (maximum 140 characters)</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{project.clientName || "Direct Client"}</div>
                                                        </div>
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
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center">
                                                        {project.status !== 'active' ? (
                                                             <Tooltip>
                                                                 <TooltipTrigger asChild>
                                                                     <div className="cursor-not-allowed opacity-50">
                                                                         <Switch
                                                                             checked={false}
                                                                             disabled={true}
                                                                             className="scale-90"
                                                                         />
                                                                     </div>
                                                                 </TooltipTrigger>
                                                                 <TooltipContent>
                                                                     <p>Cannot activate: Project is marked as {project.status} by Admin</p>
                                                                 </TooltipContent>
                                                             </Tooltip>
                                                        ) : (
                                                             <Switch
                                                                 checked={project.isActive || false}
                                                                 onCheckedChange={() => handleToggleActive(project.id, project.isActive || false)}
                                                                 className="scale-90"
                                                             />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Link href={`/user/chat/${project.id}`} className="inline-flex items-center justify-center">
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
                                                <TableCell className="text-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                onClick={() => {
                                                                    setSelectedProjectId(project.id);
                                                                    setIsHistoryOpen(true);
                                                                }}
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer group/history"
                                                            >
                                                                <History className="h-5 w-5" />
                                                                <span className="sr-only">Updates History</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View History</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                     <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                onClick={() => handleViewProject(project.id)}
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer group/view"
                                                            >
                                                                <Eye className="h-5 w-5" />
                                                                <span className="sr-only">View Details</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View Details</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                                                {isLoading ? "Fetching projects..." : "No projects assigned to you."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-app bg-app-subtle">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Showing <span className="text-app-heading font-bold">{(page - 1) * limit + 1}</span> to <span className="text-app-heading font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-app-heading font-bold">{meta.total}</span> projects
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="h-9 px-3 border-app hover:bg-app-card font-bold"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Prev
                                    </Button>
                                    <div className="text-sm font-bold text-app-heading px-3">
                                        Page {page} of {meta.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                        disabled={page === meta.totalPages}
                                        className="h-9 px-3 border-app hover:bg-app-card font-bold"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* History Dialog */}
                <ProjectHistoryDialog 
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    projectId={selectedProjectId || ""}
                    userId={session?.user?.id || ""}
                />

                {/* Project Details Modal */}
                <ProjectDetailsModal
                    open={isDetailsModalOpen}
                    onOpenChange={handleCloseDetailsModal}
                    projectId={viewProjectId}
                    userRole={session?.user?.role}
                />
            </div>
        </TooltipProvider>
    );
}
