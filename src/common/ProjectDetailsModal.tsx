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
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings,
  GripVertical,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { authClient } from "@/lib/auth-client";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  userRole?: string;
}

interface AssetDetails {
  id: string;
  name: string;
  url: string;
  fileType: string;
  fileSize: string;
  allowedRoles?: string[];
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
  assets: AssetDetails[];
}

export function ProjectDetailsModal({
  open,
  onOpenChange,
  projectId,
  userRole = "user",
}: ProjectDetailsModalProps) {
  // State management
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [orderedLinks, setOrderedLinks] = useState<any[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  
  const [orderedAssets, setOrderedAssets] = useState<any[]>([]);
  const [draggedAssetIndex, setDraggedAssetIndex] = useState<number | null>(null);
  const [isAssetOrderChanged, setIsAssetOrderChanged] = useState(false);

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  // Link Management State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: string; label: string; value: string; allowedRoles?: string[] } | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["admin", "developer", "tester", "designer"]);
  const [isSavingLink, setIsSavingLink] = useState(false);
  
  // Link Delete state
  const [linkToDelete, setLinkToDelete] = useState<{ id: string; label: string } | null>(null);
  const [isDeletingLink, setIsDeletingLink] = useState(false);

  // Asset Management State
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetDetails | null>(null);
  const [assetTitle, setAssetTitle] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetRoles, setAssetRoles] = useState<string[]>(["admin", "developer", "tester", "designer"]);
  const [isSavingAsset, setIsSavingAsset] = useState(false);

  // Asset Delete state
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; label: string } | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);

  // Authorization check: Admin OR Project Member
  const canManageLinks = userRole?.toLowerCase() === "admin" || project?.team.some(m => m.id === currentUserId);

  const formatError = (error: any): string => {
    if (typeof error === 'string') return error;
    if (Array.isArray(error)) {
      return error.map(issue => issue.message || "Invalid input").join(', ');
    }
    if (error && typeof error === 'object') {
      return error.message || "An error occurred";
    }
    return "An unknown error occurred";
  };

  // Filter links based on user role
  const filteredLinks = orderedLinks.filter(link => {
    if (userRole?.toLowerCase() === "admin") return true;
    if (!link.allowedRoles || link.allowedRoles.length === 0) return true;
    return link.allowedRoles.some((role: string) => role.toLowerCase() === userRole?.toLowerCase());
  }) || [];

  // Filter assets based on user role
  const filteredAssets = orderedAssets.filter(asset => {
    if (userRole?.toLowerCase() === "admin") return true;
    if (!asset.allowedRoles || asset.allowedRoles.length === 0) return true;
    return asset.allowedRoles.some((role: string) => role.toLowerCase() === userRole?.toLowerCase());
  }) || [];

  // Fetch project details when modal opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
    }
    
    const socket = getSocket();
    if (!socket) return;

    const onProjectUpdated = (data: { projectId: string; project: any }) => {
        if (data.projectId === projectId && open) {
             fetchProjectDetails(); 
        }
    };

    socket.on("project-updated", onProjectUpdated);
    return () => {
        socket.off("project-updated", onProjectUpdated);
    };
  }, [open, projectId]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setOrderedLinks(data.links || []);
        setIsOrderChanged(false);
        setOrderedAssets(data.assets || []);
        setIsAssetOrderChanged(false);
      }
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // NATIVE DRAG AND DROP HANDLERS
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // For transparent drag image fix:
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.5";
  };

  const onDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
  };

  const onDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const targetIndex = orderedLinks.findIndex(l => l.id === targetId);
    if (draggedIndex === targetIndex) return;

    const newLinks = [...orderedLinks];
    const draggedItem = newLinks[draggedIndex];
    newLinks.splice(draggedIndex, 1);
    newLinks.splice(targetIndex, 0, draggedItem);
    
    setDraggedIndex(targetIndex);
    setOrderedLinks(newLinks);
    setIsOrderChanged(true);
  };

  const handleSaveOrder = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: orderedLinks.map((link, idx) => ({
            ...link,
            position: idx
          }))
        }),
      });

      if (res.ok) {
        toast.success("Order saved successfully");
        setIsOrderChanged(false);
        fetchProjectDetails();
      } else {
        toast.error("Failed to save order");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // ASSETS DRAG AND DROP HANDLERS
  const onAssetDragStart = (e: React.DragEvent, index: number) => {
    setDraggedAssetIndex(index);
    e.dataTransfer.effectAllowed = "move";
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.5";
  };

  const onAssetDragEnd = (e: React.DragEvent) => {
    setDraggedAssetIndex(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
  };

  const onAssetDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedAssetIndex === null) return;

    const targetIndex = orderedAssets.findIndex(a => a.id === targetId);
    if (draggedAssetIndex === targetIndex) return;

    const newAssets = [...orderedAssets];
    const draggedItem = newAssets[draggedAssetIndex];
    newAssets.splice(draggedAssetIndex, 1);
    newAssets.splice(targetIndex, 0, draggedItem);
    
    setDraggedAssetIndex(targetIndex);
    setOrderedAssets(newAssets);
    setIsAssetOrderChanged(true);
  };

  const handleSaveAssetOrder = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets: orderedAssets.map((asset, idx) => ({
            ...asset,
            position: idx
          }))
        }),
      });

      if (res.ok) {
        toast.success("Asset order saved successfully");
        setIsAssetOrderChanged(false);
        fetchProjectDetails();
      } else {
        toast.error("Failed to save asset order");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = () => {
    setEditingLink(null);
    setLinkTitle("");
    setLinkUrl("");
    
    // Set default roles based on current user role: Admin + Current User Role
    const defaultRoles = ["admin"];
    const normalizedRole = userRole?.toLowerCase();
    if (normalizedRole && normalizedRole !== "admin") {
      defaultRoles.push(normalizedRole);
    }
    
    setSelectedRoles(defaultRoles);
    setIsFormOpen(true);
  };

  const handleEditLink = (link: any) => {
    setEditingLink(link);
    setLinkTitle(link.label);
    setLinkUrl(link.value);
    setSelectedRoles(link.allowedRoles || ["admin", "developer", "tester", "designer"]);
    setIsFormOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setIsSavingLink(true);
    try {
      const url = editingLink ? `/api/links/${editingLink.id}` : "/api/links";
      const method = editingLink ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: linkTitle,
          url: linkUrl,
          projectId,
          allowedRoles: selectedRoles,
          addedBy: currentUserId,
        }),
      });

      if (res.ok) {
        toast.success(editingLink ? "Link updated" : "Link added");
        setIsFormOpen(false);
        fetchProjectDetails();
      } else {
        const err = await res.json();
        toast.error(formatError(err.error) || "Failed to save link");
      }
    } catch (error) {
      toast.error("An error occurred while saving the link");
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;

    setIsDeletingLink(true);
    try {
      const res = await fetch(`/api/links/${linkToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Link deleted");
        setLinkToDelete(null);
        fetchProjectDetails();
      } else {
        const err = await res.json();
        toast.error(formatError(err.error) || "Failed to delete link");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the link");
    } finally {
      setIsDeletingLink(false);
    }
  };

  const handleAddAsset = () => {
    setEditingAsset(null);
    setAssetTitle("");
    setAssetUrl("");
    
    // Set default roles based on current user role: Admin + Current User Role
    const defaultRoles = ["admin"];
    const normalizedRole = userRole?.toLowerCase();
    if (normalizedRole && normalizedRole !== "admin") {
      defaultRoles.push(normalizedRole);
    }
    
    setAssetRoles(defaultRoles);
    setIsAssetFormOpen(true);
  };

  const handleEditAsset = (asset: AssetDetails) => {
    setEditingAsset(asset);
    setAssetTitle(asset.name);
    setAssetUrl(asset.url);
    setAssetRoles(asset.allowedRoles || ["admin", "developer", "tester", "designer"]);
    setIsAssetFormOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setIsSavingAsset(true);
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets";
      const method = editingAsset ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assetTitle,
          url: assetUrl,
          projectId,
          uploadedBy: currentUserId,
          allowedRoles: assetRoles,
          fileType: "link",
        }),
      });

      if (res.ok) {
        toast.success(editingAsset ? "Asset updated" : "Asset added");
        setIsAssetFormOpen(false);
        fetchProjectDetails();
      } else {
        const err = await res.json();
        toast.error(formatError(err.error) || "Failed to save asset");
      }
    } catch (error) {
      toast.error("An error occurred while saving the asset");
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;

    setIsDeletingAsset(true);
    try {
      const res = await fetch(`/api/assets/${assetToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Asset deleted");
        setAssetToDelete(null);
        fetchProjectDetails();
      } else {
        const err = await res.json();
        toast.error(formatError(err.error) || "Failed to delete asset");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the asset");
    } finally {
      setIsDeletingAsset(false);
    }
  };

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

  const copyToClipboard = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      toast.success("Link copied to clipboard!", { description: url });
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] lg:max-w-7xl max-h-[90vh] p-0 bg-white dark:bg-[#191919] border border-app flex flex-col rounded-2xl overflow-hidden">
        {isLoading || !project ? (
          <>
            <DialogTitle className="sr-only">Loading project details...</DialogTitle>
            <div className="flex flex-col lg:flex-row min-h-[500px] h-fit max-h-[calc(90vh-2rem)]">
              <div className="w-full lg:w-2/5 p-8 bg-slate-50 dark:bg-[#1e1e1e] border-r border-app space-y-6">
                 <Skeleton className="h-12 w-12 rounded-xl" />
                 <Skeleton className="h-8 w-3/4" />
                 <Skeleton className="h-24 w-full rounded-lg" />
              </div>
              <div className="flex-1 p-8">
                 <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="sr-only">{project.name}</DialogTitle>
            <div className="flex flex-col lg:flex-row min-h-[500px] h-fit max-h-[calc(90vh-2rem)]">
              {/* LEFT PANEL */}
              <div className="w-full lg:w-2/5 p-8 bg-slate-50 dark:bg-[#1e1e1e] border-r border-app overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                    <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge className={cn(
                    "px-3 py-1 text-xs font-bold uppercase",
                    project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                    project.status === "completed" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-700"
                  )}>
                    {project.status}
                  </Badge>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-2">
                    <FolderKanban className="h-4 w-4" /> Project Name
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-app-heading">{project.name}</h2>
                    <div className="flex items-center flex-shrink-0">
                      {project.team.slice(0, 4).map((member, index) => (
                        <TooltipProvider key={member.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className={cn("h-8 w-8 cursor-pointer border-2 border-white dark:border-slate-800", index !== 0 && "-ml-2")}>
                                <AvatarImage src={member.image || ""} alt={member.name} />
                                <AvatarFallback className="text-xs font-bold bg-blue-500 text-white">
                                  {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent><p className="font-semibold">{member.name}</p><p className="text-xs capitalize">{member.role}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                  {project.isMemoRequired && (
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-amber-900">Max 140 Character Memo</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-2"><Building2 className="h-4 w-4" /> Owned by</div>
                    <p className="text-sm font-semibold text-app-heading">{project.clientName || "Direct Client"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-2"><Calendar className="h-4 w-4" /> Created</div>
                    <p className="text-sm font-semibold text-app-heading">{formatDate(project.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-app-muted text-xs font-bold uppercase mb-3"><FileText className="h-4 w-4" /> Description</div>
                  <div className="border border-dashed border-app rounded-lg p-4 bg-app-hover max-h-[200px] overflow-y-auto text-sm text-app-body">
                    {project.description || "No description available."}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div className="flex-1 pt-8 px-8 pb-4 bg-white dark:bg-[#191919] flex flex-col min-h-[500px] max-h-[calc(90vh-2rem)] overflow-hidden">
                {/* LINKS SECTION */}
                <section className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-app-heading flex items-center gap-2">
                       <Link2 className="h-4 w-4 text-blue-600" /> Resources & Links
                    </h3>
                    <div className="flex items-center gap-2">
                      {isOrderChanged && (
                        <Button onClick={handleSaveOrder} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-3">
                          <Save className="h-3.5 w-3.5" /> Save Changes
                        </Button>
                      )}
                      {canManageLinks && !isFormOpen && (
                        <Button onClick={handleAddLink} size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2">
                          <Plus className="h-4 w-4 mr-1" /> Add Link
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isFormOpen ? (
                      <div className="bg-app-subtle p-5 rounded-xl border border-app mb-6">
                        <form onSubmit={handleSaveLink} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-app-heading">Label</Label>
                              <Input className="h-10 text-sm bg-white dark:bg-app-card border-app focus:ring-blue-500 rounded-lg" placeholder="e.g. Design" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-app-heading">URL</Label>
                              <Input className="h-10 text-sm bg-white dark:bg-app-card border-app focus:ring-blue-500 rounded-lg" placeholder="https://..." type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} required />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-app-heading">Visibility</Label>
                            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-app-subtle rounded-xl border border-app shadow-sm">
                              {["admin", "developer", "tester", "designer"].map((role) => (
                                <div key={role} className="flex items-center space-x-2 bg-white dark:bg-app-card px-3 py-1.5 rounded-lg border border-app hover:border-blue-200 transition-colors">
                                  <Checkbox 
                                    id={`link-role-${role}`} 
                                    checked={selectedRoles.includes(role)}
                                    onCheckedChange={(checked) => checked ? setSelectedRoles([...selectedRoles, role]) : setSelectedRoles(selectedRoles.filter(r => r !== role))}
                                    disabled={role === "admin" || role.toLowerCase() === userRole?.toLowerCase()}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                  />
                                  <Label htmlFor={`link-role-${role}`} className="text-xs font-medium capitalize cursor-pointer">{role}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="flex-1 h-10 border-app text-app-body hover:bg-app-hover">Cancel</Button>
                            <Button type="submit" size="sm" className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-semibold" disabled={isSavingLink}>
                              {isSavingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Link"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : filteredLinks.length > 0 ? (
                      <div className="flex flex-col gap-4 pb-16">
                        {filteredLinks.map((link) => {
                          const originalIndex = orderedLinks.findIndex(l => l.id === link.id);
                          return (
                            <div 
                              key={link.id} 
                              draggable={canManageLinks}
                              onDragStart={(e) => onDragStart(e, originalIndex)}
                              onDragEnd={onDragEnd}
                              onDragOver={(e) => onDragOver(e, link.id)}
                              className={cn(
                                "flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-[#252525] rounded-xl border border-app hover:border-blue-200 transition-all group",
                                draggedIndex === originalIndex ? "border-blue-500 bg-blue-50/50" : "cursor-default"
                              )}
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {canManageLinks && (
                                  <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                )}
                                <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 shrink-0">
                                  <Link2 className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 pr-2">
                                  <p className="text-sm font-bold text-app-heading truncate flex items-center gap-2">
                                    {link.label}
                                    {link.allowedRoles && link.allowedRoles.length < 4 && <Settings className="h-3 w-3 text-slate-400" />}
                                  </p>
                                  <p className="text-[10px] text-app-muted truncate opacity-70">{link.value}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canManageLinks && (
                                  <>
                                    <button onClick={() => handleEditLink(link)} className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-amber-600"><Pencil className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => setLinkToDelete(link)} className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </>
                                )}
                                <button onClick={() => copyToClipboard(link.value, link.id)} className="p-1.5 hover:bg-white rounded-md">
                                  {copiedLinkId === link.id ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                                </button>
                                <a href={link.value} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-blue-600">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-slate-50 dark:bg-app-card/50 rounded-xl border border-dashed border-app">
                        <Link2 className="h-8 w-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-500 italic">No links shared yet.</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="h-px bg-app shrink-0 -mx-8 shadow-sm shadow-blue-500/5 opacity-50 my-6" />

                {/* ASSETS SECTION */}
                <section className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-app-heading flex items-center gap-2">
                       <FileText className="h-4 w-4 text-purple-600" /> Project Assets
                    </h3>
                    <div className="flex items-center gap-2">
                      {isAssetOrderChanged && (
                        <Button onClick={handleSaveAssetOrder} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-3">
                          <Save className="h-3.5 w-3.5" /> Save Changes
                        </Button>
                      )}
                      {canManageLinks && !isAssetFormOpen && (
                        <Button onClick={handleAddAsset} size="sm" variant="ghost" className="h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2">
                          <Plus className="h-4 w-4 mr-1" /> Add Asset
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isAssetFormOpen ? (
                      <div className="bg-app-subtle p-5 rounded-xl border border-app mb-6">
                        <form onSubmit={handleSaveAsset} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-app-heading">Asset Name</Label>
                              <Input className="h-10 text-sm bg-white dark:bg-app-card border-app focus:ring-purple-500 rounded-lg" placeholder="e.g. Logo Set" value={assetTitle} onChange={(e) => setAssetTitle(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-app-heading">Resource Link</Label>
                              <Input className="h-10 text-sm bg-white dark:bg-app-card border-app focus:ring-purple-500 rounded-lg" placeholder="URL or file link" value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} required />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-app-heading">Visibility</Label>
                            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-app-subtle rounded-xl border border-app shadow-sm">
                              {["admin", "developer", "tester", "designer"].map((role) => (
                                <div key={role} className="flex items-center space-x-2 bg-white dark:bg-app-card px-3 py-1.5 rounded-lg border border-app hover:border-purple-200 transition-colors">
                                  <Checkbox 
                                    id={`asset-role-${role}`} 
                                    checked={assetRoles.includes(role)}
                                    onCheckedChange={(checked) => checked ? setAssetRoles([...assetRoles, role]) : setAssetRoles(assetRoles.filter(r => r !== role))}
                                    disabled={role === "admin" || role.toLowerCase() === userRole?.toLowerCase()}
                                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                  />
                                  <Label htmlFor={`asset-role-${role}`} className="text-xs font-medium capitalize cursor-pointer">{role}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssetFormOpen(false)} className="flex-1 h-10 border-app text-app-body hover:bg-app-hover">Cancel</Button>
                            <Button type="submit" size="sm" className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 font-semibold" disabled={isSavingAsset}>
                              {isSavingAsset ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Asset"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : filteredAssets.length > 0 ? (
                      <div className="flex flex-col gap-4 pb-16">
                        {filteredAssets.map((asset) => {
                          const originalIndex = orderedAssets.findIndex(a => a.id === asset.id);
                          return (
                            <div 
                              key={asset.id} 
                              draggable={canManageLinks}
                              onDragStart={(e) => onAssetDragStart(e, originalIndex)}
                              onDragEnd={onAssetDragEnd}
                              onDragOver={(e) => onAssetDragOver(e, asset.id)}
                              className={cn(
                                "flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-[#252525] rounded-xl border border-app hover:border-purple-200 transition-all group",
                                draggedAssetIndex === originalIndex ? "border-purple-500 bg-purple-50/50" : "cursor-default"
                              )}
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {canManageLinks && (
                                  <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                )}
                                <div className="w-12 h-12 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 shrink-0">
                                  <FileText className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 pr-2">
                                  <p className="text-sm font-bold text-app-heading truncate flex items-center gap-2">
                                    {asset.name}
                                    {asset.allowedRoles && asset.allowedRoles.length < 4 && <Settings className="h-3 w-3 text-slate-400" />}
                                  </p>
                                  <p className="text-[10px] text-app-muted truncate opacity-70">{asset.url}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canManageLinks && (
                                  <>
                                    <button onClick={() => handleEditAsset(asset)} className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-amber-600"><Pencil className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => setAssetToDelete({ id: asset.id, label: asset.name })} className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </>
                                )}
                                <a href={asset.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-purple-600">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-slate-50 dark:bg-app-card/50 rounded-xl border border-dashed border-app">
                        <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-500 italic">No assets shared yet.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </DialogContent>
      <DeleteConfirmDialog
        open={!!linkToDelete}
        onOpenChange={(open) => !open && setLinkToDelete(null)}
        onConfirm={handleDeleteLink}
        itemName={linkToDelete?.label}
        title="Delete Resource Link"
        isDeleting={isDeletingLink}
      />
      <DeleteConfirmDialog
        open={!!assetToDelete}
        onOpenChange={(open) => !open && setAssetToDelete(null)}
        onConfirm={handleDeleteAsset}
        itemName={assetToDelete?.label}
        title="Delete Project Asset"
        isDeleting={isDeletingAsset}
      />
    </Dialog>
  );
}
