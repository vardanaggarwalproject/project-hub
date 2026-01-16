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
import { Search, Eye, MoreHorizontal, FolderKanban, Plus, ChevronLeft, ChevronRight, Edit3, MessageSquare, AlertCircle } from "lucide-react";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectFormSheet } from "@/common/ProjectFormSheet";
import { ActionButtons } from "@/common/ActionButtons";
import { ProjectDetailsModal } from "@/common/ProjectDetailsModal";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface Project {
    id: string;
    name: string;
    status: string;
    clientName: string | null;
    clientId?: string | null;
    description?: string;
    updatedAt: Date;
    progress?: number;
    isMemoRequired?: boolean;
    team?: Array<{
        id: string;
        name: string;
        image: string | null;
        role: string;
        email?: string;
    }>;
    links?: Array<{
        id: string;
        label: string;
        value: string;
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
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [page, setPage] = useState(1);
    const limit = 10;

    // Sheet states
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editMode, setEditMode] = useState<"add" | "edit">("add");
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Delete dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Details modal states
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewProjectId, setViewProjectId] = useState<string | null>(null);

    const fetchProjects = useCallback(() => {
        setIsLoading(true);
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

        fetch(`/api/projects?${params.toString()}`, { cache: "no-store" })
            .then((res) => res.json())
            .then((resData) => {
                // Use actual progress from DB, default to 0 if not set
                const dataWithProgress = resData.data.map((p: any) => ({
                    ...p,
                    progress: p.progress ?? 0,
                    updatedAt: new Date(p.updatedAt)
                }));
                setProjects(dataWithProgress);
                setMeta(resData.meta);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, [page, search, statusFilter, dateRange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProjects();
        }, 300);    
        return () => clearTimeout(timer);
    }, [fetchProjects]);

    const canManageProjects = hasPermission(userRole, "CAN_MANAGE_PROJECTS");

    const handleAddProject = () => {
        setEditMode("add");
        setSelectedProject(null);
        setIsSheetOpen(true);
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

    const handleEditProject = async (project: Project) => {
        setEditMode("edit");

        // Fetch full project details including clientId, description, and links
        try {
            const res = await fetch(`/api/projects/${project.id}`);
            if (res.ok) {
                const fullProjectData = await res.json();
                setSelectedProject({
                    ...project,
                    clientId: fullProjectData.clientId,
                    description: fullProjectData.description || "",
                    links: fullProjectData.links || [],
                    isMemoRequired: fullProjectData.isMemoRequired || false,
                });
            } else {
                setSelectedProject(project);
            }
        } catch (error) {
            console.error("Failed to fetch full project details:", error);
            setSelectedProject(project);
        }

        setIsSheetOpen(true);
    };

    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/projects/${projectToDelete.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete project");
            }

            toast.success("Project deleted successfully!", {
                description: `${projectToDelete.name} has been deleted.`,
            });

            setIsDeleteDialogOpen(false);
            setProjectToDelete(null);
            fetchProjects();
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to delete project", {
                description: error.message || "Please try again.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

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
       <>
        <TooltipProvider>
            <div className="space-y-6">
            {/* Page Header with Search and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-app-heading">Projects</h2>
                    <p className="text-muted-foreground mt-1">Monitor and manage all active organization projects</p>
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
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => {
                            setDateRange(range);
                            setPage(1);
                        }}
                        placeholder="Filter by date"
                        className="w-full sm:w-[280px]"
                    />
                    {canManageProjects && (
                        <Button onClick={handleAddProject} className="bg-blue-600 hover:bg-blue-700 shadow-md whitespace-nowrap">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <Card className="border-none shadow-app overflow-hidden bg-app-card border border-app">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-app-table-header hover:bg-app-table-header border-b-2 border-app">
                                    <TableHead className="w-[80px] font-bold text-app-body uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                    <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider">Project Information</TableHead>
                                    <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider">Assigned Team</TableHead>
                                    <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider">Status</TableHead>
                                    <TableHead className="font-bold text-app-body uppercase text-[10px] tracking-wider text-center">Project Chat</TableHead>
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
                                                            <div className="font-bold text-app-heading group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase text-sm tracking-tight">{project.name}</div>
                                                            {project.isMemoRequired && (
                                                                <TooltipProvider>
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
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
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
                                                <ActionButtons
                                                    actions={[
                                                        {
                                                            type: "view",
                                                            onClick: () => handleViewProject(project.id)
                                                        },
                                                        ...(canManageProjects ? [
                                                            {
                                                                type: "edit" as const,
                                                                onClick: () => handleEditProject(project)
                                                            },
                                                            {
                                                                type: "delete" as const,
                                                                onClick: () => handleDeleteProject(project)
                                                            }
                                                        ] : [])
                                                    ]}
                                                />
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

            {/* Project Form Sheet */}
            <ProjectFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                mode={editMode}
                projectId={selectedProject?.id}
                initialData={
                    selectedProject
                        ? {
                              name: selectedProject.name,
                              description: selectedProject.description || "",
                              status: selectedProject.status,
                              clientId: selectedProject.clientId || null,
                              team: (selectedProject.team || []).map(member => ({
                                  ...member,
                                  email: member.email || ""
                              })),
                              links: selectedProject.links || [],
                              isMemoRequired: selectedProject.isMemoRequired || false,
                          }
                        : undefined
                }
                onSuccess={fetchProjects}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-slate-900">{projectToDelete?.name}</span>? This action cannot be undone and will permanently remove the project and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteProject}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Project Details Modal */}
            </div>
        </TooltipProvider>
        <div className="w-full">
             <ProjectDetailsModal
                open={isDetailsModalOpen}
                onOpenChange={handleCloseDetailsModal}
                projectId={viewProjectId}
                userRole={userRole}
            />
           </div>
       </>
    );
}
