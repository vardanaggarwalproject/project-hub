"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FolderKanban,
  Building2,
  FileText,
  Users,
  Link2,
  ExternalLink,
  Calendar,
  Clock,
  Copy,
  CheckCheck,
  Code2,
  CheckCircle2,
  Star,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  userRole?: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  status: string;
  clientName: string | null;
  totalTime: string | null;
  completedTime: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  isMemoRequired?: boolean;
  team: Array<{
    id: string;
    name: string;
    image: string | null;
    role: string;
  }>;
  links: Array<{
    id: string;
    label: string;
    value: string;
    allowedRoles?: string[];
  }>;
}

/**
 * ProjectDetailsModal Component
 *
 * A reusable modal component for displaying comprehensive project information.
 * Shows project metadata, team members, and related links without page navigation.
 *
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback when modal open state changes
 * @param {string|null} projectId - ID of the project to display details for
 */
export function ProjectDetailsModal({
  open,
  onOpenChange,
  projectId,
  userRole = "admin",
}: ProjectDetailsModalProps) {
  // State management
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null); // Track which link was copied

  // Filter links based on user role
  // Admin sees all links, others only see links they have permission for
  const filteredLinks = project?.links.filter(link => {
    // Admin can see all links
    if (userRole === "admin") return true;

    // If no allowedRoles specified, default to all roles can see
    if (!link.allowedRoles || link.allowedRoles.length === 0) return true;

    // Check if user's role is in the allowed roles
    return link.allowedRoles.includes(userRole);
  }) || [];

  // Fetch project details when modal opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
    }
  }, [open, projectId]);

  /**
   * Fetches full project details from the API
   * Includes team members, links, and all project metadata
   */
  const fetchProjectDetails = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formats ISO date string to readable format
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date (e.g., "Jan 15, 2024")
   */
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not available";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Copies link URL to clipboard and shows success feedback
   * @param {string} url - The URL to copy
   * @param {string} linkId - ID of the link for tracking copied state
   */
  const copyToClipboard = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      toast.success("Link copied to clipboard!", {
        description: url,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinkId(null);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Maximum width increased for large screens - uses custom max-w value for better display */}
      <DialogContent className="max-w-[90vw] lg:max-w-7xl max-h-[90vh] p-0 bg-app-card border border-app flex flex-col rounded-2xl overflow-hidden">
        {isLoading || !project ? (
          // Loading skeleton placeholder - matches split-panel layout
          <>
            <DialogTitle className="sr-only">Loading project details...</DialogTitle>
            <div className="flex flex-col lg:flex-row h-[650px]">

              {/* Left Panel Skeleton */}
              <div className="w-full lg:w-2/5 p-8 bg-app-sidebar border-r border-app space-y-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-7 w-20" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-3/4" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-28" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel Skeleton */}
              <div className="flex-1 p-8 bg-app-card">
                {/* Resources Skeleton */}
                <div className="space-y-4">
                  <Skeleton className="h-7 w-48" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-app-subtle rounded-xl">
                        <div className="flex items-center gap-4 flex-1">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                        <Skeleton className="h-9 w-9 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="sr-only">{project.name}</DialogTitle>
            {/* Split Layout: Left Info Panel + Right Content Panel */}
            <div className="flex flex-col lg:flex-row h-[650px]">

              {/* ===== LEFT PANEL: Project Info ===== */}
              <div className="w-full lg:w-2/5 p-8 bg-app-sidebar border-r border-app">
                {/* Icon and Status Badge */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                    <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge className={cn(
                    "px-3 py-1 text-xs font-bold uppercase",
                    project.status === "active"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                      : project.status === "completed"
                      ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                      : "bg-slate-100 text-slate-700 border-app dark:bg-slate-500/20 dark:text-slate-400"
                  )}>
                    {project.status}
                  </Badge>
                </div>

                {/* Project Name */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-2">
                    <FolderKanban className="h-4 w-4" />
                    Project Name
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-app-heading">
                      {project.name}
                    </h2>
                    {/* Team Members - Grouped Avatar Bubbles */}
                    {project.team.length > 0 && (
                      <div className="flex items-center flex-shrink-0">
                        {project.team.slice(0, 4).map((member, index) => (
                          <TooltipProvider key={member.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className={cn(
                                  "h-8 w-8 cursor-pointer border-2 border-white dark:border-slate-800 text-xs font-bold text-white transition-transform hover:scale-110 hover:z-10",
                                  index !== 0 && "-ml-2",
                                  index % 6 === 0 && "bg-purple-500",
                                  index % 6 === 1 && "bg-pink-500",
                                  index % 6 === 2 && "bg-blue-500",
                                  index % 6 === 3 && "bg-indigo-500",
                                  index % 6 === 4 && "bg-emerald-500",
                                  index % 6 === 5 && "bg-orange-500"
                                )}>
                                  <AvatarImage src={member.image || ""} alt={member.name} />
                                  <AvatarFallback className="text-xs font-bold bg-inherit text-white">
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {project.team.length > 4 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-8 w-8 -ml-2 rounded-full bg-slate-400 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
                                  +{project.team.length - 4}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">
                                  {project.team.slice(4).map(m => m.name).join(", ")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                  </div>
                  {project.isMemoRequired && (
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          140 Character Memo Required
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400">
                          Developers must provide detailed memos
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client/Owner and Created Date - Side by Side */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  {/* Client/Owner */}
                  {project.clientName ? (
                    <div>
                      <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-2">
                        <Building2 className="h-4 w-4" />
                        Owned by
                      </div>
                      <p className="text-sm font-semibold text-app-heading">
                        {project.clientName}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-2">
                        <Building2 className="h-4 w-4" />
                        Owned by
                      </div>
                      <p className="text-sm font-semibold text-app-muted">
                        Not assigned
                      </p>
                    </div>
                  )}

                  {/* Created Date */}
                  <div>
                    <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-2">
                      <Calendar className="h-4 w-4" />
                      Created
                    </div>
                    <p className="text-sm font-semibold text-app-heading">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-3">
                    <FileText className="h-4 w-4" />
                    Description
                  </div>
                  <div className="border border-dashed border-app rounded-lg p-6 bg-app-hover max-h-[280px] overflow-y-auto">
                    {project.description ? (
                      <p className="text-sm text-app-body leading-relaxed">
                        {project.description}
                      </p>
                    ) : (
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-app-icon mx-auto mb-2" />
                        <p className="text-sm font-medium text-app-muted mb-1">
                          Description not available
                        </p>
                        <p className="text-xs text-app-muted">
                          No description has been added to this project yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== RIGHT PANEL: Resources (Scrollable) ===== */}
              <div className="flex-1 p-8 bg-app-card flex flex-col h-full">
                {/* Header */}
                <h3 className="text-xl font-bold text-app-heading border-l-4 border-blue-600 dark:border-blue-500 pl-3 mb-4 flex-shrink-0">
                  Resources & Links
                </h3>

                {/* Scrollable Resources Container */}
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                  {filteredLinks.length > 0 ? (
                    <div className="space-y-3">
                      <TooltipProvider delayDuration={300}>
                        {filteredLinks.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between p-4 bg-app-subtle rounded-xl hover:bg-app-hover transition-colors group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex-shrink-0">
                                <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-app-heading mb-1">
                                  {link.label}
                                </h4>
                                <p className="text-sm text-app-muted truncate">
                                  {link.value}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => copyToClipboard(link.value, link.id)}
                                    className="p-2 hover:bg-app-card rounded-lg transition-colors"
                                  >
                                    {copiedLinkId === link.id ? (
                                      <CheckCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <Copy className="h-5 w-5 text-app-icon group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{copiedLinkId === link.id ? "Copied!" : "Click to copy"}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={link.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-app-card rounded-lg transition-colors"
                                  >
                                    <ExternalLink className="h-5 w-5 text-app-icon group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Open in new tab</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Link2 className="h-12 w-12 text-app-icon mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium text-app-muted mb-1">No links added yet</p>
                        <p className="text-xs text-app-muted">
                          Add project links like Live URL, Staging, Figma designs, etc.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
