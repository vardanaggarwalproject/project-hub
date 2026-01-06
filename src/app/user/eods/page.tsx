"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    ClipboardList, 
    Search, 
    History,
    Calendar, 
    FolderKanban,
    ArrowUpRight,
    CheckCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface EODReport {
    id: string;
    clientUpdate: string | null;
    actualUpdate: string | null;
    reportDate: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
    projectId: string;
    projectName?: string;
}

export default function UserEODPage() {
    const { data: session } = authClient.useSession();
    const [reports, setReports] = useState<EODReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/eods");
                const data = await res.json();
                
                // Ideally filter for user-specific EODs or show all if that's the intent
                // Assuming currently API returns all or filtered by server.
                setReports(data.map((r: any) => ({
                    ...r,
                    projectName: "Active Project"
                })));
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchReports();
        }
    }, [session]);

    const filteredReports = reports.filter(report => 
        (report.clientUpdate?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (report.actualUpdate?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        report.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0f172a] uppercase italic">
                        My EOD Reports
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-70">
                        Your daily progress history
                    </p>
                </div>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 font-black uppercase text-[10px] tracking-[0.2em] px-8 py-6 h-auto rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all">
                    <Link href="/user/projects">
                        <CheckCircle className="mr-2 h-4 w-4 stroke-[3]" />
                        Submit New EOD
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30 px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                            <Input 
                                placeholder="SEARCH ACTIVITY..." 
                                className="pl-12 bg-white border-slate-200 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest focus-visible:ring-emerald-600 focus-visible:ring-offset-0 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-emerald-600 shadow-sm transition-all">
                                <History className="mr-2 h-4 w-4" />
                                Date Range
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 space-y-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
                        </div>
                    ) : filteredReports.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredReports.map((report) => (
                                <div key={report.id} className="p-8 flex flex-col md:flex-row gap-10 hover:bg-slate-50/50 transition-all duration-300 group">
                                    <div className="flex items-start gap-4 md:w-64 shrink-0">
                                        <Avatar className="h-14 w-14 border-2 border-white shadow-md ring-2 ring-slate-100">
                                            <AvatarImage src={report.user.image || ""} />
                                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black">
                                                {report.user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-[#0f172a] uppercase tracking-tight truncate">{report.user.name}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(report.reportDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <Badge className="mt-3 bg-slate-50 text-slate-500 border-none rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                                                <FolderKanban className="h-2.5 w-2.5" />
                                                {report.projectName}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                                Client Facing
                                            </p>
                                            <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed italic">
                                                "{report.clientUpdate || "No client-facing update provided."}"
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-blue-500" />
                                                Internal Context
                                            </p>
                                            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm text-sm font-medium text-slate-600 leading-relaxed">
                                                {report.actualUpdate || "No internal update provided."}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:w-32 flex md:flex-col md:justify-center md:items-end gap-4">
                                        <Button variant="ghost" size="sm" className="h-9 px-4 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 group/btn" asChild>
                                            <Link href={`/user/projects/${report.projectId}`}>
                                                Deep Dive <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                            </Link>
                                        </Button>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                            {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse opacity-30" />
                                <div className="relative h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center">
                                    <ClipboardList className="h-10 w-10 text-slate-200" />
                                </div>
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Standard Silence</h4>
                                <p className="text-sm text-slate-500 font-medium">No EOD reports have been archived yet.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
