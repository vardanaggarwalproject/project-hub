"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    ClipboardList, 
    Search, 
    Calendar, 
    FolderKanban,
    ArrowUpRight,
    UserCircle,
    Eye,
    MessageSquare,
    FilterX,
    FileText,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EODReport {
    id: string;
    clientUpdate: string | null;
    actualUpdate: string | null;
    reportDate: string;
    createdAt: string;
    projectName: string;
    user: {
        id: string;
        name: string;
        image: string | null;
        role: string;
    };
    projectId: string;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminEODPage() {
    const { data: session } = authClient.useSession();
    const [reports, setReports] = useState<EODReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const limit = 10;

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/eods?${params.toString()}`);
            const resData = await res.json();
            setReports(resData.data);
            setMeta(resData.meta);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (session) {
                fetchReports();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [session, fetchReports]);

    if (isLoading && reports.length === 0) return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-full sm:w-80 rounded-lg" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <div className="border-b-2 border-slate-200">
                    <div className="grid grid-cols-6 gap-4 p-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                </div>
                <div className="p-0">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="grid grid-cols-6 gap-4 p-6 border-b border-slate-100 items-center">
                            <Skeleton className="h-4 w-8" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-2 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <div className="flex justify-end">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );

    return (
        <TooltipProvider anonymousId="eods-tooltip">
            <div className="space-y-6 pb-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] uppercase">EOD Reports</h2>
                        <p className="text-muted-foreground mt-1">Daily operational mapping & transparency</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search reports..." 
                                className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1); // Reset to first page on search
                                }}
                            />
                        </div>
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm h-10 flex items-center justify-center">
                            {meta?.total || 0} REPORTS
                        </Badge>
                    </div>
                </div>

                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-50 hover:to-slate-100/50 border-b-2 border-slate-200">
                                        <TableHead className="w-[80px] font-bold text-slate-700 uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                        <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">User Information</TableHead>
                                        <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Role</TableHead>
                                        <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Project</TableHead>
                                        <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">EOD Date</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.length > 0 ? (
                                        reports.map((report, index) => (
                                            <TableRow key={report.id} className="group transition-all hover:bg-blue-50/30 border-b border-slate-100">
                                                <TableCell className="pl-6 font-semibold text-slate-500">{(page - 1) * limit + index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border-1 border-white shadow-sm ring-[0.5px] ring-slate-100">
                                                            <AvatarImage src={report.user.image || ""} />
                                                            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                                {report.user.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-[#0f172a] group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{report.user.name}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Logged At {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-slate-100 text-slate-600 border-none px-3 py-1 font-bold text-[10px] uppercase shadow-sm">
                                                        {report.user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                            <FolderKanban className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight truncate max-w-[150px]">
                                                            {report.projectName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {new Date(report.reportDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 bg-white overflow-hidden">
                                                                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-8 py-6 border-b border-slate-200">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                                            <AvatarImage src={report.user.image || ""} />
                                                                            <AvatarFallback className="bg-blue-500 text-white font-bold text-sm">
                                                                                {report.user.name.substring(0, 2).toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <DialogTitle className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">
                                                                                EOD Report: {report.user.name}
                                                                            </DialogTitle>
                                                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                                                <span className="flex items-center gap-1.5"><FolderKanban className="h-3 w-3 text-blue-500" /> {report.projectName}</span>
                                                                                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-blue-500" /> {new Date(report.reportDate).toLocaleDateString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                                            Client Facing Update
                                                                        </div>
                                                                        <div className="p-6 rounded-2xl bg-blue-50/20 border border-blue-100/50 text-sm font-medium text-slate-700 leading-relaxed break-words whitespace-pre-wrap shadow-sm">
                                                                            {report.clientUpdate || "No client-facing update provided."}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                                            Internal Development Context
                                                                        </div>
                                                                        <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed break-words whitespace-pre-wrap shadow-sm">
                                                                            {report.actualUpdate || "No internal update provided."}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                        Report Logged at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                        
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-blue-50 hover:text-blue-600" asChild>
                                                                    <Link href={`/admin/projects/${report.projectId}`}>
                                                                        <ArrowUpRight className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Deep Dive Project</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                                {isLoading ? "Fetching organization EODs..." : "No EOD reports found matching your criteria."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {meta && meta.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gradient-to-r from-slate-50/50 to-slate-100/30">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> reports
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="h-9 px-3 border-slate-200 hover:bg-white font-bold"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Prev
                                    </Button>
                                    <div className="text-sm font-bold text-[#0f172a] px-3">
                                        Page {page} of {meta.totalPages}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                        disabled={page === meta.totalPages}
                                        className="h-9 px-3 border-slate-200 hover:bg-white font-bold"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
