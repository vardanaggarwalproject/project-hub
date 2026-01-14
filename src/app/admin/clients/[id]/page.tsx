
"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Mail, 
    Calendar, 
    ArrowLeft, 
    Building2,
    Briefcase,
    Plus,
    MoreVertical
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClientDetails {
    id: string;
    name: string;
    email: string | null;
    description: string | null;
    createdAt: Date;
}

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [client, setClient] = useState<ClientDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // We'll use the existing /api/clients endpoint if it supports filtering or create a new one
        fetch(`/api/clients/${id}`)
            .then(res => res.json())
            .then(data => {
                setClient({
                    ...data,
                    createdAt: new Date(data.createdAt)
                });
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [id]);

    if (isLoading) return <div className="p-8"><Skeleton className="h-[300px] w-full" /></div>;
    if (!client) return <div className="p-8 text-center text-muted-foreground">Client not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">{client.name}</h2>
                    <p className="text-muted-foreground">Partner since {new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm">Edit Client</Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                        <Link href="/admin/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Client Information</CardTitle>
                        <CardDescription>Primary contact and background details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="p-4 rounded-xl bg-slate-50 flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</p>
                                    <p className="font-bold text-[#0f172a]">{client.email || "No email provided"}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Company ID</p>
                                    <p className="font-bold text-[#0f172a]">{client.id.substring(0, 8)}...</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-bold text-[#0f172a]">About the Company</p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {client.description || "No description provided for this client. They are a valued partner focused on various technological and business solutions."}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Active Projects</CardTitle>
                        <CardDescription>Currently assigned work</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[1, 2].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border group hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                            <Briefcase className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#0f172a]">E-Commerce Flow</p>
                                            <Badge variant="outline" className="text-[8px] uppercase font-bold text-emerald-600 border-emerald-100 bg-emerald-50">Active</Badge>
                                        </div>
                                    </div>
                                    <MoreVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
