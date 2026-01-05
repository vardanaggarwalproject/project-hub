
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
    id: string;
    name: string;
    email: string | null;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/clients")
            .then(res => res.json())
            .then(data => {
                setClients(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) return <Skeleton className="h-48 w-full" />;

    return (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
                    <p className="text-muted-foreground">Manage your clients</p>
                </div>
                 <Button asChild>
                    <Link href="/clients/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                    </Link>
                </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map(client => (
                    <Card key={client.id}>
                        <CardHeader>
                            <CardTitle>{client.name}</CardTitle>
                            <CardDescription>{client.email || "No email"}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
         </div>
    )
}
