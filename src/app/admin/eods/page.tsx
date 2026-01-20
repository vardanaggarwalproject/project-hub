"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ClipboardList,
    Search,
    Calendar as CalendarIcon,
    FolderKanban,
    ExternalLink,
    UserCircle,
    Eye,
    MessageSquare,
    FilterX,
    FileText,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Copy,
    X,
    Clock,
    ShieldCheck,
    AlertCircle,
    LayoutGrid,
} from "lucide-react";

import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { AdminCalendarView } from "@/components/admin/AdminCalendarView";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ClearFilterButton } from "@/components/ui/clear-filter-button";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EODReport {
    id: string;
    clientUpdate: string | null;
    actualUpdate: string | null;
    reportDate: Date;
    createdAt: Date;
    projectName: string;
    user: {
        id: string;
        name: string;
        image: string | null;
        role: string;
    };
    projectId: string;
    userId: string;
    isMemoRequired: boolean;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminEODPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = authClient.useSession();

    // Initialize state from URL params
    const [selectedProject, setSelectedProject] = useState(searchParams.get("project") || "");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        searchParams.get("fromDate") && searchParams.get("toDate")
            ? { from: new Date(searchParams.get("fromDate")!), to: new Date(searchParams.get("toDate")!) }
            : undefined
    );
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
    const [activeAssociatedMemos, setActiveAssociatedMemos] = useState<{ short?: any, universal?: any } | null>(null);
    const [isFetchingMemos, setIsFetchingMemos] = useState(false);

    const [reports, setReports] = useState<EODReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
    const [isViewInitialized, setIsViewInitialized] = useState(false);
    const limit = 10;

    // Initialize View Mode from LocalStorage
    useEffect(() => {
        const savedView = localStorage.getItem("admin_eod_view_mode");
        if (savedView === "calendar" || savedView === "table") {
            setViewMode(savedView);
        }
        setIsViewInitialized(true);
    }, []);

    const handleViewChange = (mode: "table" | "calendar") => {
        setViewMode(mode);
        localStorage.setItem("admin_eod_view_mode", mode);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (debouncedSearch) params.append("search", debouncedSearch);
            if (selectedProject) params.append("projectId", selectedProject);
            if (dateRange?.from) params.append("fromDate", format(dateRange.from, "yyyy-MM-dd"));
            if (dateRange?.to) params.append("toDate", format(dateRange.to, "yyyy-MM-dd"));

            const res = await fetch(`/api/eods?${params.toString()}`);
            const resData = await res.json();
            if (!resData.data) {
                console.error("No data returned from API:", resData);
                setReports([]);
                setMeta(null);
                return;
            }
            const transformedData = resData.data.map((report: any) => ({
                ...report,
                reportDate: new Date(report.reportDate),
                createdAt: new Date(report.createdAt)
            }));
            setReports(transformedData);
            setMeta(resData.meta);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, selectedProject, dateRange]);

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedProject) params.set("project", selectedProject);
        if (dateRange?.from) params.set("fromDate", format(dateRange.from, "yyyy-MM-dd"));
        if (dateRange?.to) params.set("toDate", format(dateRange.to, "yyyy-MM-dd"));

        const newUrl = params.toString() ? `?${params.toString()}` : "/admin/eods";
        router.replace(newUrl, { scroll: false });
    }, [debouncedSearch, selectedProject, dateRange, router]);

    useEffect(() => {
        if (session) {
            fetchReports();
        }
    }, [session, fetchReports]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Content copied to clipboard", {
            duration: 2000,
            className: "bg-green-50 text-green-700 border-green-200",
        });
    };

    if (!isViewInitialized || (isLoading && reports.length === 0)) return (
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
        <TooltipProvider>
            <div className="space-y-6 pb-10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] uppercase">EOD Reports</h2>
                            <p className="text-muted-foreground text-sm">Daily operational mapping & transparency</p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm">
                            {meta?.total || 0} REPORTS
                        </Badge>
                    </div>

                    {/* Filter Toolbar */}
                    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm mt-4">
                        {viewMode === "table" && (
                            <div className="flex flex-col lg:flex-row items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by user name..."
                                        className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl placeholder:text-muted-foreground/70"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                    <ProjectSelect value={selectedProject} onValueChange={setSelectedProject} />
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                        placeholder="Filter by report date..."
                                        className="w-[280px]"
                                    />
                                    <ClearFilterButton 
                                        isActive={!!(searchQuery || selectedProject || dateRange)}
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedProject("");
                                            setDateRange(undefined);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-start">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-fit">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewChange("table")}
                                    className={cn(
                                        "h-8 px-4 text-[10px] uppercase tracking-wider font-black transition-all rounded-lg",
                                        viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Table
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewChange("calendar")}
                                    className={cn(
                                        "h-8 px-4 text-[10px] uppercase tracking-wider font-black transition-all rounded-lg",
                                        viewMode === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <CalendarIcon className="h-3.5 w-3.5 mr-2" /> Calendar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {viewMode === "calendar" ? (
                    <AdminCalendarView type="eod" />
                ) : (
                    <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                                        <TableHead className="w-[50px] font-bold text-slate-500 uppercase tracking-wider text-[10px]">S.No</TableHead>
                                        <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">User Name</TableHead>
                                        <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Project Name</TableHead>
                                        <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Report Date</TableHead>
                                        <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Submitted Date</TableHead>
                                        <TableHead className="w-[80px] text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">Copy</TableHead>
                                        <TableHead className="w-[80px] text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">View</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.length > 0 ? (
                                        reports.map((report, index) => (
                                            <TableRow key={report.id} className="group hover:bg-slate-50/80 transition-colors duration-200">
                                                <TableCell className="font-medium text-slate-600 text-xs text-center border-r border-slate-100/50">
                                                    {(page - 1) * limit + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-slate-100 shadow-sm">
                                                            <AvatarImage src={report.user.image || ""} />
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold">
                                                                {report.user.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">{report.user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/admin/projects/${report.projectId}`}
                                                        className="group/link flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                    >
                                                        <span className="font-semibold text-slate-700 text-sm whitespace-nowrap group-hover/link:text-blue-600 transition-colors">
                                                            {report.projectName}
                                                        </span>
                                                        <ExternalLink className="h-3 w-3 text-slate-400 group-hover/link:text-blue-500 transition-colors" />
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {format(report.reportDate, "dd/MM/yyyy")}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {format(report.createdAt, "dd/MM/yyyy")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-slate-900 border-slate-200 hover:border-slate-300 transition-all"
                                                                onClick={() => {
                                                                    const combinedContent = [
                                                                        report.clientUpdate && `CLIENT UPDATE:\n${report.clientUpdate}`,
                                                                        report.actualUpdate && `INTERNAL CONTEXT:\n${report.actualUpdate}`
                                                                    ].filter(Boolean).join('\n\n');
                                                                    copyToClipboard(combinedContent || "");
                                                                }}
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider">Click to copy</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Dialog onOpenChange={async (open) => {
                                                            if (open) {
                                                                setIsFetchingMemos(true);
                                                                setActiveAssociatedMemos(null);
                                                                try {
                                                                    const params = new URLSearchParams({
                                                                        projectId: report.projectId,
                                                                        userId: report.userId,
                                                                        date: format(report.reportDate, "yyyy-MM-dd"),
                                                                        summary: "true"
                                                                    });
                                                                    const res = await fetch(`/api/memos?${params.toString()}`);
                                                                    const resData = await res.json();
                                                                    if (resData.data) {
                                                                        const memos = resData.data;
                                                                        setActiveAssociatedMemos({
                                                                            short: memos.find((m: any) => m.memoType === 'short'),
                                                                            universal: memos.find((m: any) => m.memoType === 'universal')
                                                                        });
                                                                    }
                                                                } catch (error) {
                                                                    console.error("Error fetching associated memos", error);
                                                                } finally {
                                                                    setIsFetchingMemos(false);
                                                                }
                                                            }
                                                        }}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider">Click to view EOD</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] p-0 bg-white dark:bg-[#191919] border border-slate-200 dark:border-slate-800 flex flex-col rounded-2xl overflow-hidden shadow-2xl">
                                                                <DialogTitle className="sr-only">EOD Report for {report.projectName}</DialogTitle>

                                                                <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                                                                    {isFetchingMemos ? (
                                                                        <div className="flex flex-col lg:flex-row w-full h-full animate-in fade-in duration-500">
                                                                            <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-[#1e1e1e] border-r border-slate-100 dark:border-slate-800 p-8 space-y-8">
                                                                                <div className="space-y-4">
                                                                                    <Skeleton className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-white/5" />
                                                                                    <div className="flex items-center gap-3">
                                                                                        <Skeleton className="h-12 w-12 rounded-full bg-slate-200 dark:bg-white/5" />
                                                                                        <div className="space-y-2 flex-1">
                                                                                            <Skeleton className="h-4 w-3/4 bg-slate-200 dark:bg-white/5" />
                                                                                            <Skeleton className="h-3 w-1/2 bg-slate-200 dark:bg-white/5" />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                                                                    <Skeleton className="h-20 w-full rounded-2xl bg-slate-200 dark:bg-white/5" />
                                                                                    <Skeleton className="h-20 w-full rounded-2xl bg-slate-200 dark:bg-white/5" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-1 bg-white dark:bg-[#191919] p-8 lg:p-12 space-y-12">
                                                                                <div className="space-y-4">
                                                                                    <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-white/5" />
                                                                                    <Skeleton className="h-40 w-full rounded-3xl bg-slate-200 dark:bg-white/5" />
                                                                                </div>
                                                                                <div className="space-y-4">
                                                                                    <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-white/5" />
                                                                                    <Skeleton className="h-32 w-full rounded-3xl bg-slate-200 dark:bg-white/5" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {/* LEFT PANEL: Context & Metadata & Memos */}
                                                                            <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-[#1e1e1e] border-r border-slate-100 dark:border-slate-800 flex flex-col min-h-0">
                                                                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                                                                    {/* EOD Header Section */}
                                                                                    <div className="space-y-4">
                                                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                                                                            <FileText className="h-3.5 w-3.5" />
                                                                                            EOD Report
                                                                                        </div>

                                                                                        <div className="flex items-center gap-3">
                                                                                            <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-md">
                                                                                                <AvatarImage src={report.user.image || ""} />
                                                                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                                                                                    {report.user.name.substring(0, 2).toUpperCase()}
                                                                                                </AvatarFallback>
                                                                                            </Avatar>
                                                                                            <div className="min-w-0">
                                                                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{report.user.name}</p>
                                                                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{report.user.role}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Details Grid */}
                                                                                    <div className="space-y-5">
                                                                                        <div className="grid grid-cols-2 gap-4">
                                                                                            <div>
                                                                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                                                    <FolderKanban className="h-3 w-3" /> Project
                                                                                                </p>
                                                                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{report.projectName}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                                                    <CalendarIcon className="h-3 w-3" /> Date
                                                                                                </p>
                                                                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{format(report.reportDate, "MMM d, yyyy")}</p>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div>
                                                                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                                                <Clock className="h-3 w-3" /> Submission
                                                                                            </p>
                                                                                            <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                                                                                {format(report.createdAt, "PPP p")}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Associated Memos - MOVED TO LEFT */}
                                                                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                                                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                                                                                            Daily Memos
                                                                                        </h3>

                                                                                        <div className="space-y-4">
                                                                                            {/* Universal Memo Card */}
                                                                                            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-4 shadow-sm">
                                                                                                <div className="flex items-center gap-2 mb-2.5">
                                                                                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Universal Memo</p>
                                                                                                </div>
                                                                                                <div className="min-h-[40px]">
                                                                                                    {activeAssociatedMemos?.universal ? (
                                                                                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                                                                            {activeAssociatedMemos.universal.memoContent}
                                                                                                        </p>
                                                                                                    ) : (
                                                                                                        <p className="text-sm text-slate-400 dark:text-slate-600 italic">No universal memo</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* 140 Char Memo Card */}
                                                                                            <div className={cn(
                                                                                                "bg-blue-500/5 border rounded-xl p-4 transition-colors",
                                                                                                report.isMemoRequired ? "border-blue-100 dark:border-blue-900/30 shadow-sm" : "border-slate-100 dark:border-white/5 hidden"
                                                                                            )}>
                                                                                                <div className="flex items-center gap-2 mb-2.5">
                                                                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[9px] px-1.5 py-0 h-4 cursor-help font-bold"><AlertCircle className="h-2.5 w-2.5 mr-0.5" />140</Badge>
                                                                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">140 Char Memo</p>
                                                                                                </div>
                                                                                                <div className="min-h-[40px]">
                                                                                                    {activeAssociatedMemos?.short ? (
                                                                                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                                                                            {activeAssociatedMemos.short.memoContent}
                                                                                                        </p>
                                                                                                    ) : (
                                                                                                        <p className="text-sm text-slate-400 dark:text-slate-600 italic">
                                                                                                            {report.isMemoRequired ? "Not submitted" : "Not required"}
                                                                                                        </p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* RIGHT PANEL: Report Content (EOD Updates) */}
                                                                            <div className="flex-1 flex flex-col bg-white dark:bg-[#191919] min-h-0">
                                                                                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar">
                                                                                    {/* Client Facing Update */}
                                                                                    <section className="space-y-5">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4">
                                                                                                Client Update
                                                                                            </h3>
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                onClick={() => copyToClipboard(report.clientUpdate || "")}
                                                                                                className="h-8 px-3 text-[10px] font-bold border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                                            >
                                                                                                <Copy className="h-3.5 w-3.5 mr-2" /> Copy Section
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-3xl p-8 border border-slate-100 dark:border-white/5 shadow-inner">
                                                                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                                                                                {report.clientUpdate || "No client update provided."}
                                                                                            </p>
                                                                                        </div>
                                                                                    </section>

                                                                                    {/* Internal Context */}
                                                                                    <section className="space-y-5">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-slate-300 dark:border-slate-700 pl-4">
                                                                                                Internal Context
                                                                                            </h3>
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                onClick={() => copyToClipboard(report.actualUpdate || "")}
                                                                                                className="h-8 px-3 text-[10px] font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-white/10"
                                                                                            >
                                                                                                <Copy className="h-3.5 w-3.5 mr-2" /> Copy Section
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="bg-white dark:bg-transparent rounded-3xl p-8 border border-dashed border-slate-200 dark:border-white/10">
                                                                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                                                                                {report.actualUpdate || "No internal context provided."}
                                                                                            </p>
                                                                                        </div>
                                                                                    </section>
                                                                                </div>

                                                                                {/* Footer Action Bar */}
                                                                                <div className="p-4 lg:p-6 bg-slate-50 dark:bg-[#1e1e1e] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified Report</span>
                                                                                        </div>
                                                                                    </div>

                                                                                    <Button
                                                                                        onClick={() => {
                                                                                            const combined = [];
                                                                                            combined.push(`CLIENT UPDATE:\n${report.clientUpdate || "N/A"}\n`);
                                                                                            combined.push(`INTERNAL CONTEXT:\n${report.actualUpdate || "N/A"}`);
                                                                                            copyToClipboard(combined.join("\n"));
                                                                                        }}
                                                                                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-bold px-8 py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
                                                                                    >
                                                                                        <Copy className="h-4 w-4" />
                                                                                        Copy Report
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
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
                )}
            </div>
        </TooltipProvider >
    );
}


