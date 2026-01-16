
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

export default function NewProjectPage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [clientId, setClientId] = useState("");
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
    const [isMemoRequired, setIsMemoRequired] = useState(false);

    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();


    useEffect(() => {
        getSocket();
    }, []);

    useEffect(() => {
        // Fetch clients
        fetch("/api/clients")
            .then(res => res.json())
            .then(data => {
                if (data.data) setClients(data.data);
            });

        // Fetch users (developers)
        fetch("/api/users?limit=100")
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setUsers(data.data);
                }
            });
    }, []);

    const toggleUser = (userId: string) => {
        setAssignedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    clientId,
                    assignedUserIds,
                    status: "active",
                    isMemoRequired
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create project");
            }

            const data = await res.json();

            // Redirect to admin projects
            router.push("/admin/projects");
            router.refresh();
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-2">
                <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full">
                    <div onClick={() => router.back()} className="cursor-pointer flex items-center justify-center">
                         <Plus className="h-4 w-4 rotate-45" />
                    </div>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">Create Project</h2>
                    <p className="text-muted-foreground text-sm">Set up a new project and assign a team</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-md bg-app-card overflow-hidden">
                            <CardHeader className="bg-app-subtle border-b pb-4">
                                <CardTitle className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    General Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Website Redesign"
                                        required
                                        className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client" className="text-xs font-bold uppercase tracking-wider text-slate-500">Client</Label>
                                    <Select onValueChange={setClientId} required>
                                        <SelectTrigger className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium text-left">
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
                                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Description</Label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        placeholder="Briefly describe the project scope and goals..."
                                        className="w-full rounded-md border border-slate-200 bg-app-input px-3 py-2 text-sm ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium transition-all"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
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

                    <div className="space-y-6">
                        <Card className="border-none shadow-md bg-app-card overflow-hidden h-full flex flex-col">
                            <CardHeader className="bg-app-subtle border-b pb-4">
                                <CardTitle className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    Assign Team
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 overflow-y-auto max-h-[500px] pt-6">
                                <div className="space-y-3">
                                    {users.length > 0 ? users.map(user => (
                                        <div
                                            key={user.id}
                                            className={cn(
                                                "flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer hover:border-blue-100 hover:bg-blue-50/30",
                                                assignedUserIds.includes(user.id) ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-slate-100"
                                            )}
                                            onClick={() => toggleUser(user.id)}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#0f172a] truncate">{user.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{user.role}</p>
                                            </div>
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                assignedUserIds.includes(user.id) ? "bg-blue-500 border-blue-500" : "border-slate-200"
                                            )}>
                                                {assignedUserIds.includes(user.id) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-muted-foreground italic text-center py-8">No members found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={() => router.back()} type="button" className="font-bold text-slate-500">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !clientId || !name} className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8 py-6 font-bold text-base rounded-xl transition-all hover:scale-[1.02]">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Project
                    </Button>
                </div>
            </form>
        </div>
    );
}
