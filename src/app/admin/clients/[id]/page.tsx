
"use client";

import { useEffect, useState, use } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mail,
  Calendar,
  ArrowLeft,
  Building2,
  Briefcase,
  Plus,
  Clock,
  CheckCircle2,
  PauseCircle,
  FileText,
  ExternalLink,
  FolderKanban,
  Activity,
  CheckCircle,
  MapPin,
  Eye,
  Copy,
  Check,
  Edit3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ProjectDetailsModal } from "@/common/ProjectDetailsModal";
import { ProjectFormSheet } from "@/common/ProjectFormSheet";
import { ClientFormSheet } from "@/components/clients/ClientFormSheet";


interface Project {
  id: string;
  name: string;
  status: string | null;
  description: string | null;
  totalTime: string | null;
  completedTime: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClientDetails {
  id: string;
  name: string;
  email: string | null;
  description: string | null;
  createdAt: string;
  projects: Project[];
  phone?: string | null;
  address?: string | null;
}

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectSheet, setShowProjectSheet] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectSheetMode, setProjectSheetMode] = useState<"add" | "edit">("edit");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          console.error("API Error:", data.error);
          setClient(null);
        } else {
          setClient(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch client:", err);
        setClient(null);
        setIsLoading(false);
      });
  }, [id]);

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectModal(true);
  };

  const handleEditProject = (projectId: string) => {
    setProjectSheetMode("edit");
    setSelectedProjectId(projectId);
    setShowProjectSheet(true);
  };

  const handleAddProject = () => {
    setProjectSheetMode("add");
    setSelectedProjectId(null);
    setShowProjectSheet(true);
  };

  const statusConfig: Record<
    string,
    { icon: any; color: string; label: string }
  > = {
    active: {
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      label: "Active",
    },
    completed: {
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700 border-green-200",
      label: "Completed",
    },
    "on-hold": {
      icon: PauseCircle,
      color: "bg-slate-100 text-slate-700 border-slate-200",
      label: "On Hold",
    },
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="max-w-7xl mx-auto p-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-40" />
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>

            {/* Client Info Skeleton */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader className="border-b">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl sm:col-span-2 lg:col-span-3" />
                </div>
              </CardContent>
            </Card>

            {/* Projects Section Skeleton */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Client Not Found
              </h2>
              <p className="text-slate-500 mb-6">
                The client you're looking for doesn't exist.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const clientProjects = client.projects || [];
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              {client.name}
            </h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 font-medium">
              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
              Client Profile Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="font-bold border-app hover:bg-slate-50"
            onClick={() => setIsSheetOpen(true)}
          >
            <Edit3 className="h-4 w-4 mr-2 text-amber-600" />
            Edit Client
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 border-app">
            <Copy className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        </div>
      </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderKanban className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-5xl font-bold text-blue-600">
                    {clientProjects.length}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total Projects
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-5xl font-bold text-emerald-600">
                    {clientProjects.filter((p) => p.status === "active").length}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Active
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-gradient-to-br from-cyan-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-cyan-600" />
                  </div>
                  <p className="text-5xl font-bold text-cyan-600">
                    {
                      clientProjects.filter((p) => p.status === "completed")
                        .length
                    }
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Client Information Section */}
          <Card className="border-none shadow-xl bg-app-card">
            <CardHeader className="border-b bg-app-subtle">
              <CardTitle className="text-xl font-bold text-slate-900">
                Client Details
              </CardTitle>
              <CardDescription className="text-slate-600">
                Primary contact and background details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Contact Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Contact Name */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-white shadow-sm">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Contact Name
                      </p>
                      <p className="font-bold text-slate-900 truncate">
                        {client.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-white shadow-sm">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Email Address
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 truncate flex-1">
                          {client.email || "Not provided"}
                        </p>
                        {client.email && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-blue-100 shrink-0"
                                  onClick={() =>
                                    handleCopy(client.email!, "email")
                                  }
                                >
                                  {copiedField === "email" ? (
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-blue-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copiedField === "email"
                                    ? "Copied!"
                                    : "Copy email"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 shadow-sm hover:shadow-md transition-all sm:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-white shadow-sm">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Location
                      </p>
                      <p className="font-bold text-slate-900">
                        {client.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {client.description && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Description
                    </p>
                  </div>
                  <p className="text-slate-600 leading-relaxed pl-7">
                    {client.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card className="border-none shadow-xl bg-app-card">
            <CardHeader className="border-b bg-app-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        Projects ({clientProjects.length})
                      </CardTitle>
                      <CardDescription className="text-slate-600 mt-0.5">
                        All projects for this client
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddProject}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new project for this client</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {clientProjects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-50 hover:to-slate-100/50 border-b-2 border-slate-200">
                        <th className="text-left py-4 px-8 text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="text-left py-4 px-6 text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
                          Created Date
                        </th>
                        <th className="text-center py-4 px-6 text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientProjects.map((project, index) => {
                        const status = project.status || "active";
                        const StatusIcon = statusConfig[status]?.icon || Clock;
                        return (
                          <tr
                            key={project.id}
                            className="group transition-all hover:bg-blue-50/30 border-b border-slate-100"
                          >
                            {/* Project Name with Icon */}
                            <td className="py-4 px-8">
                              <Link href={`/admin/projects/${project.id}`}>
                                <div className="flex items-center gap-3 cursor-pointer group/link">
                                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm group-hover/link:shadow-md group-hover/link:scale-105 transition-all">
                                    <Briefcase className="h-4 w-4" />
                                  </div>
                                  <span className="font-semibold text-[#0f172a] group-hover/link:text-blue-600 transition-colors">
                                    {project.name}
                                  </span>
                                </div>
                              </Link>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6">
                              <Badge
                                className={`${statusConfig[status]?.color} font-bold px-3 py-1.5 border text-xs inline-flex items-center gap-1.5 shadow-sm`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusConfig[status]?.label || status}
                              </Badge>
                            </td>

                            {/* Created Date */}
                            <td className="py-4 px-6">
                              <span className="text-slate-500 text-sm font-medium text-nowrap">
                                {new Date(project.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewProject(project.id)}
                                  className="h-8 px-3 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                  <span className="font-semibold text-xs">
                                    View
                                  </span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProject(project.id)}
                                  className="h-8 px-3 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                                  <span className="font-semibold text-xs">
                                    Edit
                                  </span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    No Projects Yet
                  </h3>
                  <p className="text-slate-500 mb-6">
                    This client doesn't have any projects assigned yet.
                  </p>
                  <Button
                    onClick={handleAddProject}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

      <ProjectDetailsModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        projectId={selectedProjectId}
      />

      <ProjectFormSheet
        open={showProjectSheet}
        onOpenChange={setShowProjectSheet}
        mode={projectSheetMode}
        projectId={selectedProjectId || undefined}
        fixedClientId={client?.id}
        onSuccess={() => {
          setShowProjectSheet(false);
          // Refresh client data to show updated/new project
          fetch(`/api/clients/${id}`)
            .then((res) => res.json())
            .then((data) => {
              if (!data.error) {
                setClient(data);
              }
            })
            .catch((err) => console.error("Failed to refresh client:", err));
        }}
      />

      <ClientFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        mode="edit"
        clientId={client?.id}
        initialData={
          client
            ? {
                name: client.name,
                email: client.email || "",
                address: client.address || "",
                description: client.description || "",
              }
            : undefined
        }
        onSuccess={() => {
          setIsSheetOpen(false);
          // Refresh client data
          fetch(`/api/clients/${id}`)
            .then((res) => res.json())
            .then((data) => {
              if (!data.error) {
                setClient(data);
              }
            })
            .catch((err) => console.error("Failed to refresh client:", err));
        }}
      />
    </div>
  );
}
