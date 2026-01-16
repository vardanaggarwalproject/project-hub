"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Loader2, FolderKanban, Building2, FileText, Users, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DynamicFieldsInput, DynamicField } from "@/common/DynamicFieldsInput";
import { Switch } from "@/components/ui/switch";

interface Client {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

interface ProjectFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  projectId?: string;
  initialData?: {
    name: string;
    description: string;
    status: string;
    clientId: string | null;
    team: User[];
    links?: DynamicField[];
    isMemoRequired?: boolean;
  };
  onSuccess?: () => void;
  fixedClientId?: string; // When set, client dropdown will be hidden and locked to this client
}

export function ProjectFormSheet({
  open,
  onOpenChange,
  mode,
  projectId,
  initialData,
  onSuccess,
  fixedClientId,
}: ProjectFormSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [clientId, setClientId] = useState<string>("");
  const [team, setTeam] = useState<User[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [globalAllowedRoles, setGlobalAllowedRoles] = useState<string[]>(["admin", "developer", "tester", "designer"]);
  const [isMemoRequired, setIsMemoRequired] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState("");

  // Fetch project data in edit mode
  useEffect(() => {
    if (open && mode === "edit" && projectId && !initialData) {
      setIsFetchingData(true);
      fetch(`/api/projects/${projectId}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.name || "");
          setDescription(data.description || "");
          setStatus(data.status || "active");
          setClientId(data.clientId || "");
          setTeam(data.team || []);
          setDynamicFields(data.links || []);
          setIsMemoRequired(data.isMemoRequired || false);
          setIsFetchingData(false);
        })
        .catch((err) => {
          console.error("Failed to fetch project:", err);
          setIsFetchingData(false);
        });
    } else if (!open) {
      // Reset fetching state when closing
      setIsFetchingData(false);
    }
  }, [open, mode, projectId, initialData]);

  // Reset form when opening or when initialData changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setName(initialData.name || "");
        setDescription(initialData.description || "");
        setStatus(initialData.status || "active");
        setClientId(initialData.clientId || "");
        setTeam(initialData.team || []);
        setDynamicFields(initialData.links || []);
        setIsMemoRequired(initialData.isMemoRequired || false);
      } else if (mode === "add") {
        setName("");
        setDescription("");
        setStatus("active");
        setClientId(fixedClientId || "");
        setTeam([]);
        setDynamicFields([]);
        setIsMemoRequired(false);
      }
    }
  }, [open, mode, initialData, fixedClientId]);

  // Fetch clients and users when sheet opens
  useEffect(() => {
    if (open) {
      // Fetch clients
      fetch("/api/clients?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setClients(data.data);
        })
        .catch((err) => console.error("Failed to fetch clients:", err));

      // Fetch users
      fetch("/api/users?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setAvailableUsers(data.data);
        })
        .catch((err) => console.error("Failed to fetch users:", err));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = mode === "add" ? "/api/projects" : `/api/projects/${projectId}`;
      const method = mode === "add" ? "POST" : "PATCH";

      // Filter out empty dynamic fields
      const validLinks = dynamicFields.filter(
        (field) => field.label.trim() !== "" && field.value.trim() !== ""
      );

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          status,
          clientId,
          assignedUserIds: team.map((u) => u.id),
          links: validLinks.map((link) => ({
            label: link.label,
            value: link.value,
          })),
          isMemoRequired,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${mode} project`);
      }

      // Show success notification
      toast.success(
        mode === "add" ? "Project created successfully!" : "Project updated successfully!",
        {
          description: `${name} has been ${mode === "add" ? "created" : "updated"}.`,
        }
      );

      // Close the sheet and refresh
      onOpenChange(false);

      // Call the onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        mode === "add" ? "Failed to create project" : "Failed to update project",
        {
          description: error.message || "Please try again.",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTeamMember = (user: User) => {
    if (team.some((u) => u.id === user.id)) {
      setTeam(team.filter((u) => u.id !== user.id));
    } else {
      setTeam([...team, user]);
    }
  };

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto overflow-x-hidden p-0 flex flex-col bg-app-card">
        <SheetHeader className="space-y-3 px-6 py-5 border-b border-app bg-app-card sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold text-app-heading">
                {mode === "add" ? "Add New Project" : "Edit Project"}
              </SheetTitle>
              <SheetDescription className="text-sm text-app-body">
                {mode === "add"
                  ? "Create a new project and assign team"
                  : "Update project information"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 space-y-6 px-6 py-6 overflow-y-auto">
            {isFetchingData ? (
              <div className="space-y-6">
                {/* Project Name Skeleton */}
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-app-hover rounded animate-pulse" />
                  <div className="h-11 bg-app-hover rounded-lg animate-pulse" />
                </div>

                {/* Client and Status Row Skeleton */}
                <div className={cn("grid gap-4", fixedClientId ? "grid-cols-1" : "grid-cols-2")}>
                  {!fixedClientId && (
                    <div className="space-y-2">
                      <div className="h-5 w-24 bg-app-hover rounded animate-pulse" />
                      <div className="h-11 bg-app-hover rounded-lg animate-pulse" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="h-5 w-20 bg-app-hover rounded animate-pulse" />
                    <div className="h-11 bg-app-hover rounded-lg animate-pulse" />
                  </div>
                </div>

                {/* Description Skeleton */}
                <div className="space-y-2">
                  <div className="h-5 w-28 bg-app-hover rounded animate-pulse" />
                  <div className="h-[100px] bg-app-hover rounded-lg animate-pulse" />
                </div>

                {/* Project Links Skeleton */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 bg-app-hover rounded animate-pulse" />
                    <div className="h-9 w-24 bg-app-hover rounded-lg animate-pulse" />
                  </div>
                  <div className="h-16 bg-app-hover rounded-lg animate-pulse" />
                </div>

                {/* Team Members Skeleton */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 bg-app-hover rounded animate-pulse" />
                    <div className="h-8 w-24 bg-app-hover rounded-full animate-pulse" />
                  </div>
                  <div className="h-10 bg-app-hover rounded-lg animate-pulse" />
                  <div className="h-[280px] bg-app-hover rounded-lg animate-pulse" />
                </div>
              </div>
            ) : (
              <>
            {/* Project Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-app-body flex items-center gap-2"
              >
                <FolderKanban className="h-4 w-4 text-blue-600" />
                Project Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Website Redesign"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-app-input border-app focus-ring-app"
              />
            </div>

            {/* Client and Status Row */}
            <div className={cn("grid gap-4", fixedClientId ? "grid-cols-1" : "grid-cols-2")}>
              {/* Client - Hidden when fixedClientId is set */}
              {!fixedClientId && (
                <div className="space-y-2 min-w-0">
                  <Label
                    htmlFor="client"
                    className="text-sm font-semibold text-app-body flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Client
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select value={clientId} onValueChange={setClientId} required>
                    <SelectTrigger className="h-11 bg-white border-slate-200 w-full">
                      <SelectValue placeholder="Select client" className="truncate">
                        {clientId ? <span className="truncate">{clients.find(c => c.id === clientId)?.name || "Select client"}</span> : "Select client"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2 min-w-0">
                <Label
                  htmlFor="status"
                  className="text-sm font-semibold text-app-body flex items-center gap-2"
                >
                  Status
                  <span className="text-red-500">*</span>
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger
                    className={cn(
                      "h-11 font-medium w-full",
                      status === "active"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : status === "completed"
                        ? "text-blue-600 bg-blue-50 border-blue-200"
                        : "text-slate-600 bg-slate-50"
                    )}
                  >
                    <SelectValue className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-app-body flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                Description
                <span className="text-xs font-normal text-slate-500">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Briefly describe the project scope and goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] max-h-[150px] bg-app-input border-app focus-ring-app resize-none"
              />
            </div>

            {/* Memo Requirement Toggle */}
            <div className="rounded-lg border border-app bg-app-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor="memo-required"
                    className="text-sm font-semibold text-app-body flex items-center gap-2 cursor-pointer"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Require 140 Character Memo
                  </Label>
                  <p className="text-xs text-app-muted">
                    When enabled, developers must provide a maximum 140 character memo for this project
                  </p>
                </div>
                <Switch
                  id="memo-required"
                  checked={isMemoRequired}
                  onCheckedChange={setIsMemoRequired}
                  className="ml-4"
                />
              </div>
              {isMemoRequired && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Team members assigned to this project will be required to submit a detailed memo (maximum 140 characters) daily.
                  </p>
                </div>
              )}
            </div>

            {/* Dynamic Fields - Project Links */}
            <DynamicFieldsInput
              fields={dynamicFields}
              onChange={setDynamicFields}
              globalAllowedRoles={globalAllowedRoles}
              onGlobalRolesChange={setGlobalAllowedRoles}
            />

            {/* Team Assignment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Team Members
                </Label>
                <div className="flex items-center gap-2">
                  {/* Selected team avatars */}
                  {team.length > 0 && (
                    <TooltipProvider>
                      <div className="flex items-center -space-x-3">
                        {team.slice(0, 3).map((member, index) => (
                          <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                              <Avatar className="h-8 w-8 border-2 border-white shadow-sm cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                                <AvatarImage src={member.image || ""} />
                                <AvatarFallback className="text-xs font-bold bg-blue-500 text-white">
                                  {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs font-medium">{member.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{member.role}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {team.length > 3 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                                <span className="text-xs font-bold text-slate-600">+{team.length - 3}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {team.slice(3).map((member) => (
                                  <div key={member.id} className="text-xs">
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase">{member.role}</p>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  )}
                  <Badge variant="secondary" className="font-mono">
                    {team.length} selected
                  </Badge>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-icon" />
                <Input
                  placeholder="Search team members..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 h-10 bg-app-input border-app"
                />
              </div>

              {/* Team Members Checkbox List */}
              <div className="border border-app rounded-lg bg-app-card max-h-[280px] overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredUsers.map((user) => {
                      const isSelected = team.some((u) => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-blue-50",
                            isSelected ? "bg-blue-50/50 border border-blue-200" : "border border-transparent"
                          )}
                          onClick={() => toggleTeamMember(user)}
                        >
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                              isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-slate-300 hover:border-blue-400"
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-app-heading truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-app-muted uppercase tracking-wider truncate">
                              {user.role}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      {userSearch ? "No users found" : "No team members available"}
                    </p>
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </div>

          <SheetFooter className="sticky bottom-0 bg-app-card border-t border-app px-6 py-4 mt-auto">
            <Button
              type="submit"
              disabled={isLoading || isFetchingData || !name || clientId === ""}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFetchingData ? "Loading..." : mode === "add" ? "Create Project" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
