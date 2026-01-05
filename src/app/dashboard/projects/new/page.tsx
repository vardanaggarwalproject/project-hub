
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Client {
    id: string;
    name: string;
}

export default function NewProjectPage() {
    const [name, setName] = useState("");
    const [clientId, setClientId] = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Fetch clients for dropdown
        fetch("/api/clients")
            .then(res => res.json())
            .then(data => {
                // API returns { data: [...], meta: {...} }
                if (data.data && Array.isArray(data.data)) {
                    setClients(data.data);
                } else {
                    console.error("Unexpected API response format", data);
                    setClients([]);
                }
            })
            .catch(err => {
                console.error("Failed to load clients", err);
                setClients([]);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    clientId,
                    status: "active"
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create project");
            }

            router.push("/dashboard/projects");
            router.refresh();
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Project</CardTitle>
                    <CardDescription>Add a new project and assign it to a client.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input 
                                id="name" 
                                placeholder="e.g. Website Redesign" 
                                required 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client">Client</Label>
                            <Select onValueChange={setClientId} required>
                                <SelectTrigger>
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
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => router.back()} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !clientId}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Project
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
