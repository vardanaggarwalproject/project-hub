
"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Users, FolderKanban, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Client {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    clientId: string;
    team: User[];
}

export default function EditProjectPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const { id } = use(params);
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("active");
    const [clientId, setClientId] = useState("");
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
    
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [projectRes, clientsRes, usersRes] = await Promise.all([
                fetch(`/api/projects/${id}`),
                fetch("/api/clients?limit=100"),
                fetch("/api/users?limit=100")
            ]);

            const projectData: Project = await projectRes.json();
            const clientsData = await clientsRes.json();
            const usersData = await usersRes.json();

            setName(projectData.name);
            setDescription(projectData.description || "");
            setStatus(projectData.status);
            setClientId(projectData.clientId);
            setAssignedUserIds(projectData.team.map(u => u.id));

            if (clientsData.data) setClients(clientsData.data);
            if (usersData.data) setUsers(usersData.data);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleUser = (userId: string) => {
        setAssignedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(uid => uid !== userId) 
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    status,
                    clientId,
                    assignedUserIds
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update project");
            }

            router.push("/dashboard/projects");
            router.refresh();
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Edit Project</h2>
                    <p className="text-muted-foreground">Modify project settings and manage team assignments</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-8">
                        <Card className="border-none shadow-md bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FolderKanban className="h-5 w-5 text-blue-600" />
                                    Project Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Name</Label>
                                        <Input 
                                            id="name" 
                                            required 
                                            className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium capitalize">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="on-hold">On Hold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client" className="text-xs font-bold uppercase tracking-wider text-slate-500">Client</Label>
                                    <Select value={clientId} onValueChange={setClientId} required>
                                        <SelectTrigger className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium">
                                            <SelectValue placeholder="Select a client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</Label>
                                    <textarea 
                                        id="description" 
                                        rows={6}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 font-medium transition-all"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md bg-white overflow-hidden">
                             <CardHeader className="bg-slate-50/50 border-b py-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                    Danger Zone
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground mb-4">Deleting a project is permanent and cannot be undone. All associated tasks, messages, and reports will be archived/lost.</p>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to delete this project?")) {
                                            await fetch(`/api/projects/${id}`, { method: "DELETE" });
                                            router.push("/dashboard/projects");
                                        }
                                    }}
                                >
                                    Delete Project
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="border-none shadow-md bg-white overflow-hidden flex flex-col h-full max-h-[700px]">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-indigo-600" />
                                    Manage Team
                                </CardTitle>
                                <CardDescription>Select project members</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 overflow-y-auto">
                                <div className="space-y-2">
                                    {users.map(user => (
                                        <div 
                                            key={user.id} 
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                                assignedUserIds.includes(user.id) 
                                                    ? "border-indigo-200 bg-indigo-50/50" 
                                                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                            )}
                                            onClick={() => toggleUser(user.id)}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#0f172a] truncate">{user.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{user.role}</p>
                                            </div>
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                assignedUserIds.includes(user.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-200"
                                            )}>
                                                {assignedUserIds.includes(user.id) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <div className="p-4 border-t bg-slate-50/50">
                                <p className="text-[10px] font-bold text-slate-500 uppercase text-center">
                                    {assignedUserIds.length} members selected
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                    <Button variant="ghost" onClick={() => router.back()} type="button" className="font-bold text-slate-500">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8 py-6 font-bold text-base rounded-xl transition-all hover:scale-[1.02]">
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
