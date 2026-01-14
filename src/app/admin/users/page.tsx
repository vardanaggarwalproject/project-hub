"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    UserPlus, 
    Shield, 
    Users, 
    CheckCircle2,
    UserCircle,
    Info,
    ArrowRight
} from "lucide-react";
import { AdminCreateUserForm } from "./create-user-form";
import { cn } from "@/lib/utils";

interface Stats {
    total: number;
    active: number;
    admins: number;
}

export default function AdminUsersPage() {
    const { data: session } = authClient.useSession();
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, admins: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users?limit=1`);
            const resData = await res.json();
            setStats(resData.stats);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session) {
            fetchStats();
        }
    }, [session, fetchStats]);

    if (isLoading && stats.total === 0) return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Skeleton className="h-[500px] w-full rounded-3xl" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-3xl" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] uppercase">User Management</h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Provision system access & administrative controls</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100/20 group hover:shadow-md transition-all rounded-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="h-16 w-16 text-blue-600" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 text-blue-600 shadow-inner">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Total Workforce</p>
                                <p className="text-3xl font-bold text-[#0f172a] mt-1">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100/20 group hover:shadow-md transition-all rounded-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <UserCircle className="h-16 w-16 text-emerald-600" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 shadow-inner">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Active Sessions</p>
                                <p className="text-3xl font-bold text-[#0f172a] mt-1">{stats.active}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-100/20 group hover:shadow-md transition-all rounded-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Shield className="h-16 w-16 text-amber-600" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-100 text-amber-600 shadow-inner">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Administrative</p>
                                <p className="text-3xl font-bold text-[#0f172a] mt-1">{stats.admins}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Create User Form Section */}
                <div className="lg:col-span-2 flex">
                    <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white w-full flex flex-col">
                        <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Identity Provisioning</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium">Onboard new team members with secure credentials</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 flex-grow">
                            <AdminCreateUserForm onSuccess={() => fetchStats()} />
                        </CardContent>
                    </Card>
                </div>

                {/* Authority Matrix Panel */}
                <div className="flex">
                    <Card className="border-none shadow-md rounded-2xl bg-white border border-slate-100 overflow-hidden w-full flex flex-col">
                        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <Shield className="h-4 w-4 text-slate-400" />
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Authority Matrix</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3 flex-grow">
                            {[
                                { role: "Admin", color: "bg-amber-500", desc: "Full System Authority" },
                                { role: "Developer", color: "bg-blue-500", desc: "Development & Deployment" },
                                { role: "Tester", color: "bg-purple-500", desc: "QA & Verification" },
                                { role: "Designer", color: "bg-pink-500", desc: "UI/UX & Visual Assets" }
                            ].map((r) => (
                                <div key={r.role} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-2 w-2 rounded-full", r.color)} />
                                        <span className="text-sm font-semibold text-slate-700">{r.role}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{r.desc}</span>
                                </div>
                            ))}
                            
                            <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                <p className="text-[11px] text-blue-600/70 font-medium leading-relaxed italic text-center">
                                    "Selecting the appropriate role ensures the user has access to necessary tools and modules."
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
