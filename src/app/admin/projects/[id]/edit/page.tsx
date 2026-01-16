"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Save,
    Trash2,
    Users,
    Search,
    Plus,
    X,
    Building2,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket";

interface User {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    clientId: string | null;
    isMemoRequired: boolean;
    team: User[];
}

interface Client {
    id: string;
    name: string;
}

export default function EditProjectPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const projectId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("active");
    const [clientId, setClientId] = useState<string>("none");
    const [isMemoRequired, setIsMemoRequired] = useState(false);
    const [team, setTeam] = useState<User[]>([]);

    // Original state for diffing
    const [originalTeamIds, setOriginalTeamIds] = useState<Set<string>>(new Set());

    // User search
    const [userSearch, setUserSearch] = useState("");
    const [showUserSearch, setShowUserSearch] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Project
                const projectRes = await fetch(`/api/projects/${projectId}`);
                if (!projectRes.ok) throw new Error("Failed to fetch project");
                const projectData = await projectRes.json();

                setProject(projectData);
                setName(projectData.name);
                setDescription(projectData.description || "");
                setStatus(projectData.status);
                setClientId(projectData.clientId || "none");
                setIsMemoRequired(projectData.isMemoRequired || false);
                setTeam(projectData.team || []);
                setOriginalTeamIds(new Set((projectData.team || []).map((u: User) => u.id)));

                // Fetch Clients
                const clientsRes = await fetch("/api/clients?limit=100");
                if (clientsRes.ok) {
                    const clientsData = await clientsRes.json();
                    setClients(clientsData.data || []);
                }

                // Fetch Users to add
                const usersRes = await fetch("/api/users?limit=100");
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setAvailableUsers(usersData.data || []);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (projectId) fetchData();
    }, [projectId]);

    useEffect(() => {
        // Ensure socket is initialized when entering the page
        getSocket();
    }, []);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete project");

            const socket = getSocket();
            if (socket) {
                if (socket.connected) {
                    socket.emit("project-deleted", { projectId });
                } else {
                    // If not connected, try to connect or just queue it (default behavior)
                    // But to be safe, log it.
                    console.log("⚠️ Socket not connected, attempting to emit anyway (will buffer)");
                    socket.emit("project-deleted", { projectId });
                }
            }

            // Small delay to ensure optimized socket handling before navigation
            await new Promise(resolve => setTimeout(resolve, 100));

            router.refresh();
            router.push("/admin/projects");
        } catch (error) {
            console.error("Failed to delete project:", error);
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const currentTeamIds = team.map(u => u.id);

            const payload = {
                name,
                description,
                status,
                clientId: clientId === "none" ? null : clientId,
                assignedUserIds: currentTeamIds,
                isMemoRequired
            };

            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to update project");

            // Handle Socket Events for Added/Removed Members
            const socket = getSocket();
            if (socket && socket.connected) {
                const currentIdSet = new Set(currentTeamIds);

                // Find added users
                currentTeamIds.forEach(userId => {
                    if (!originalTeamIds.has(userId)) {
                        const user = team.find(u => u.id === userId);
                        socket.emit("assignment-added", {
                            projectId,
                            userId,
                            userName: user?.name || "Unknown User"
                        });
                    }
                });

                // Find removed users
                originalTeamIds.forEach(userId => {
                    if (!currentIdSet.has(userId)) {
                        const user = availableUsers.find(u => u.id === userId) ||
                            // Fallback if user is not in available list (unlikely if fetched all)
                            { name: "User" };
                        socket.emit("assignment-removed", {
                            projectId,
                            userId,
                            userName: user.name
                        });
                    }
                });
            }

            // Update original team IDs to match current
            setOriginalTeamIds(new Set(currentTeamIds));
            // Show success logic or redirect
            router.refresh();
            router.push("/admin/projects"); // Or just show success message

        } catch (error) {
            console.error("Failed to save project:", error);
            // Ideally show toast error
        } finally {
            setIsSaving(false);
        }
    };

    const addToTeam = (user: User) => {
        if (!team.some(u => u.id === user.id)) {
            setTeam([...team, user]);
        }
        setShowUserSearch(false);
        setUserSearch("");
    };

    const removeFromTeam = (userId: string) => {
        setTeam(team.filter(u => u.id !== userId));
    };

    const filteredUsers = availableUsers.filter(u =>
        !team.some(member => member.id === u.id) &&
        (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <Skeleton className="h-[500px] col-span-2" />
                    <Skeleton className="h-[300px] col-span-1" />
                </div>
            </div>
        );
    }

    if (!project) return <div>Project not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full">
                        <Link href="/admin/projects">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">Edit Project</h2>
                        <p className="text-muted-foreground text-sm">Update project details and manage team</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild className="font-bold">
                        <Link href="/admin/projects">Cancel</Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="w-9 h-9">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the project
                                    <span className="font-bold text-[#0f172a] mx-1">"{name}"</span>
                                    and remove all associated data including chat history and file links.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete();
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isDeleting ? "Deleting..." : "Delete Project"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 min-w-[120px] font-bold shadow-md"
                    >
                        {isSaving ? "Saving..." : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Project Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md bg-app-card">
                        <CardHeader className="border-b bg-app-subtle pb-4">
                            <h3 className="font-bold text-[#0f172a] flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-500" />
                                General Information
                            </h3>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">Project Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="font-semibold h-11"
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Status</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className={cn(
                                            "h-11 font-medium",
                                            status === "active" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                                                status === "completed" ? "text-blue-600 bg-blue-50 border-blue-200" :
                                                    "text-slate-600 bg-slate-50"
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="on-hold">On Hold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Client</label>
                                    <Select value={clientId} onValueChange={setClientId}>
                                        <SelectTrigger className="h-11 font-medium">
                                            <SelectValue placeholder="Select Client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Direct Client (No Agency)</SelectItem>
                                            {clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">Description</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[120px] font-medium"
                                    placeholder="Project description and goals..."
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="isMemoRequired"
                                    checked={isMemoRequired}
                                    onCheckedChange={(checked) => setIsMemoRequired(!!checked)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="isMemoRequired"
                                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Require Memos
                                    </Label>
                                    <p className="text-xs text-slate-500">
                                        If enabled, developers will be reminded to submit daily memos for this project.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </div>

                {/* Right Column: Team Management */}
                <div className="space-y-6">
                    <Card className="border-none shadow-md bg-app-card h-full flex flex-col">
                        <CardHeader className="border-b bg-app-subtle pb-4 flex flex-row items-center justify-between">
                            <h3 className="font-bold text-[#0f172a] flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                Team Members
                            </h3>
                            <Badge variant="secondary" className="font-mono">{team.length}</Badge>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1 flex flex-col space-y-4">
                            {/* Add Member Search */}
                            <div className="relative z-10">
                                {showUserSearch ? (
                                    <div className="absolute top-0 left-0 w-full bg-white shadow-xl rounded-xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                                            <Search className="h-4 w-4 text-slate-400" />
                                            <input
                                                className="flex-1 bg-transparent border-none text-sm focus:outline-none"
                                                placeholder="Search users..."
                                                autoFocus
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                            />
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowUserSearch(false)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto p-1">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map(user => (
                                                    <div
                                                        key={user.id}
                                                        className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center gap-2 group transition-colors"
                                                        onClick={() => addToTeam(user)}
                                                    >
                                                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-medium truncate group-hover:text-blue-700">{user.name}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
                                                        </div>
                                                        <Plus className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-xs text-muted-foreground">
                                                    {userSearch ? "No users found" : "Type to search"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-muted-foreground border-dashed"
                                        onClick={() => setShowUserSearch(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Team Member
                                    </Button>
                                )}
                            </div>

                            {/* Member List */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {team.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                {member.image ? (
                                                    <img src={member.image} alt={member.name} className="h-full w-full rounded-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-[#0f172a] truncate">{member.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{member.role}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeFromTeam(member.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                {team.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                                        <Users className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">No team members assigned</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warning Card Removed */}
                </div>
            </div>
        </div>
    );
}
