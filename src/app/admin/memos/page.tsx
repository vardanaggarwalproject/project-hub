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
    FileText,
    Search,
    Calendar as CalendarIcon,
    FolderKanban,
    ChevronLeft,
    ChevronRight,
    Eye,
    FilterX,
    UserCircle,
    ExternalLink,
    Copy,
    AlignLeft,
    X,
    ShieldCheck,
    AlertCircle,
    Trash2,
    Clock,
    LayoutGrid,
    RotateCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ClearFilterButton } from "@/components/ui/clear-filter-button";
import { format } from "date-fns";
import { AdminCalendarView } from "@/components/admin/AdminCalendarView";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

interface Memo {
    id: string;
    memoContent: string;
    memoType: 'short' | 'universal';
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
    isMemoRequired?: boolean;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminMemosPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = authClient.useSession();

    // Initialize state from URL params
    const [selectedProject, setSelectedProject] = useState(searchParams.get("project") || "");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (searchParams.get("fromDate") && searchParams.get("toDate")) {
            return { from: new Date(searchParams.get("fromDate")!), to: new Date(searchParams.get("toDate")!) };
        }
        // Default to today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { from: today, to: today };
    });
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
    const [activeDualMemos, setActiveDualMemos] = useState<{ short?: Memo, universal?: Memo } | null>(null);
    const [isFetchingDual, setIsFetchingDual] = useState(false);
    const [show140Only, setShow140Only] = useState(false);
    const [showUniversalOnly, setShowUniversalOnly] = useState(false);
    const [memos, setMemos] = useState<Memo[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
    const [isViewInitialized, setIsViewInitialized] = useState(false);
    const limit = 10;

    // Initialize View Mode from LocalStorage
    useEffect(() => {
        const savedView = localStorage.getItem("admin_memo_view_mode");
        if (savedView === "calendar" || savedView === "table") {
            setViewMode(savedView);
        }
        setIsViewInitialized(true);
    }, []);

    const handleViewChange = (mode: "table" | "calendar") => {
        setViewMode(mode);
        localStorage.setItem("admin_memo_view_mode", mode);
    };

    // Load filters from localStorage
    useEffect(() => {
        const saved140 = localStorage.getItem("admin_memos_filter_140");
        const savedUniversal = localStorage.getItem("admin_memos_filter_universal");

        if (saved140 !== null) setShow140Only(saved140 === "true");
        if (savedUniversal !== null) setShowUniversalOnly(savedUniversal === "true");
        setIsInitialLoad(false);
    }, []);

    // Save filters to localStorage
    useEffect(() => {
        if (!isInitialLoad) {
            localStorage.setItem("admin_memos_filter_140", show140Only.toString());
            localStorage.setItem("admin_memos_filter_universal", showUniversalOnly.toString());
        }
    }, [show140Only, showUniversalOnly, isInitialLoad]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchMemos = useCallback(async () => {
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

            // Filter logic: if one is checked and other isn't, pass it to API
            // If both are checked or none are checked, don't pass anything (show all)
            if (show140Only && !showUniversalOnly) {
                params.append("isMemoRequired", "true");
            } else if (!show140Only && showUniversalOnly) {
                params.append("isMemoRequired", "false");
            }

            const res = await fetch(`/api/memos?${params.toString()}`);
            const resData = await res.json();
            if (!resData.data) {
                console.error("No data returned from API:", resData);
                setMemos([]);
                setMeta(null);
                return;
            }
            const transformedData = resData.data.map((memo: any) => ({
                ...memo,
                reportDate: new Date(memo.reportDate),
                createdAt: new Date(memo.createdAt)
            }));

            setMemos(transformedData);
            setMeta(resData.meta);
        } catch (error) {
            console.error("Failed to fetch memos", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, selectedProject, dateRange, show140Only, showUniversalOnly]);

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedProject) params.set("project", selectedProject);
        if (dateRange?.from) params.set("fromDate", format(dateRange.from, "yyyy-MM-dd"));
        if (dateRange?.to) params.set("toDate", format(dateRange.to, "yyyy-MM-dd"));

        const newUrl = params.toString() ? `?${params.toString()}` : "/admin/memos";
        router.replace(newUrl, { scroll: false });
    }, [debouncedSearch, selectedProject, dateRange, router]);

    useEffect(() => {
        if (session) {
            fetchMemos();
        }
    }, [session, fetchMemos]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Memo copied to clipboard", {
            duration: 2000,
            className: "bg-green-50 text-green-700 border-green-200",
        });
    };

    if (!isViewInitialized || (isLoading && memos.length === 0)) return (
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
                            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] uppercase">Memos</h2>
                            <p className="text-muted-foreground text-sm">Critical checkpoints & team alignment</p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm">
                            {meta?.total || 0} MEMOS
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
                                    <ProjectSelect
                                        value={selectedProject}
                                        onValueChange={(val) => {
                                            setSelectedProject(val);
                                            if (val) {
                                                setShow140Only(false);
                                                setShowUniversalOnly(false);
                                            }
                                        }}
                                    />
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                        placeholder="Filter by report date..."
                                        className="w-[280px]"
                                    />
                                    <ClearFilterButton
                                        isActive={!!(searchQuery || selectedProject || dateRange || show140Only || showUniversalOnly)}
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedProject("");
                                            setDateRange(undefined);
                                            setShow140Only(false);
                                            setShowUniversalOnly(false);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                            <div className="flex items-center gap-4 ml-auto">
                                {viewMode === "table" && (
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="140-memos"
                                                checked={show140Only}
                                                onCheckedChange={(c) => {
                                                    setShow140Only(!!c);
                                                    if (!!c) {
                                                        setSelectedProject("");
                                                        setShowUniversalOnly(false);
                                                    }
                                                    setPage(1);
                                                }}
                                                className="data-[state=checked]:bg-blue-600 border-slate-300 rounded-md"
                                            />
                                            <Label htmlFor="140-memos" className="text-xs font-bold text-slate-600 uppercase tracking-widest cursor-pointer select-none">140 Char Memo</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="universal-memos"
                                                checked={showUniversalOnly}
                                                onCheckedChange={(c) => {
                                                    setShowUniversalOnly(!!c);
                                                    if (!!c) {
                                                        setSelectedProject("");
                                                        setShow140Only(false);
                                                    }
                                                    setPage(1);
                                                }}
                                                className="data-[state=checked]:bg-blue-600 border-slate-300 rounded-md"
                                            />
                                            <Label htmlFor="universal-memos" className="text-xs font-bold text-slate-600 uppercase tracking-widest cursor-pointer select-none">Universal Only</Label>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchMemos}
                                    disabled={isLoading}
                                    className="h-8 px-4 text-[10px] uppercase tracking-wider font-black transition-all rounded-lg bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-sm gap-2"
                                >
                                    <RotateCw className={cn("h-3.5 w-3.5 transition-transform", isLoading && "animate-spin")} />
                                    Reload Memos
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {viewMode === "calendar" ? (
                    <AdminCalendarView type="memo" />
                ) : (
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                                            <TableHead className="w-[50px] font-bold text-slate-500 uppercase tracking-wider text-[10px]">S.No</TableHead>
                                            <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">User Name</TableHead>
                                            <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Project Name</TableHead>
                                            <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Report Date</TableHead>
                                            <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Submitted At</TableHead>
                                            <TableHead className="w-[80px] text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">Copy</TableHead>
                                            <TableHead className="w-[80px] text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">View</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {memos.length > 0 ? (
                                            memos.map((memo, index) => (
                                                <TableRow key={memo.id} className={cn(
                                                    "group hover:bg-slate-50/80 transition-colors duration-200",
                                                    memo.isMemoRequired && "bg-blue-50/30 hover:bg-blue-50/50"
                                                )}>
                                                    <TableCell className="font-medium text-slate-600 text-xs text-center border-r border-slate-100/50">
                                                        {(page - 1) * limit + index + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-slate-100 shadow-sm">
                                                                <AvatarImage src={memo.user.image || ""} />
                                                                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold">
                                                                    {memo.user.name.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">{memo.user.name}</span>
                                                                {memo.isMemoRequired && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-amber-50 text-amber-700 border-amber-300 text-[9px] px-1.5 py-0 h-4 cursor-help font-bold"
                                                                            >
                                                                                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                                                                140
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider">Detailed Memo Required</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Link
                                                            href={`/admin/projects/${memo.projectId}`}
                                                            className="group/link flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                        >
                                                            <span className="font-semibold text-slate-700 text-sm whitespace-nowrap group-hover/link:text-blue-600 transition-colors">
                                                                {memo.projectName}
                                                            </span>
                                                            <ExternalLink className="h-3 w-3 text-slate-400 group-hover/link:text-blue-500 transition-colors" />
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-semibold text-slate-700">
                                                            {format(memo.reportDate, "dd/MM/yyyy")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-slate-700">
                                                                {format(memo.createdAt, "dd/MM/yyyy")}
                                                            </span>
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                {format(memo.createdAt, "h:mm a")}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(memo.memoContent)}
                                                                    className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                                                                >
                                                                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider">Click to copy</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Dialog onOpenChange={async (open) => {
                                                            if (open) {
                                                                setIsFetchingDual(true);
                                                                setActiveDualMemos(null);
                                                                try {
                                                                    const params = new URLSearchParams({
                                                                        projectId: memo.projectId,
                                                                        userId: memo.user.id, // Use memo.user.id
                                                                        date: format(memo.reportDate, "yyyy-MM-dd"),
                                                                        summary: "true"
                                                                    });
                                                                    const res = await fetch(`/api/memos?${params.toString()}`);
                                                                    const resData = await res.json();
                                                                    if (resData.data) {
                                                                        const memos = resData.data;
                                                                        setActiveDualMemos({
                                                                            short: memos.find((m: any) => m.memoType === 'short'),
                                                                            universal: memos.find((m: any) => m.memoType === 'universal')
                                                                        });
                                                                    }
                                                                } catch (error) {
                                                                    console.error("Error fetching dual memos", error);
                                                                } finally {
                                                                    setIsFetchingDual(false);
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
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider">Click to view Memo</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <DialogContent className="max-w-2xl w-[95vw] sm:w-full rounded-2xl border border-slate-200 shadow-lg p-0 bg-white overflow-hidden max-h-[85vh] flex flex-col">
                                                                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex-shrink-0">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 text-blue-600 dark:text-blue-400 shadow-sm transition-transform hover:scale-105">
                                                                                <FolderKanban className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                                                                                    Daily Memo Report
                                                                                </DialogTitle>
                                                                                <p className="text-sm text-slate-500 font-medium">
                                                                                    Reviewing updates from <span className="text-slate-900 font-bold">{memo.user.name}</span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                                                                <AvatarImage src={memo.user.image || ""} />
                                                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                                                                                    {memo.user.name.substring(0, 2).toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                                                    {/* Project & Date Headers */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm">
                                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                                <FolderKanban className="h-3.5 w-3.5 text-blue-500" />
                                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Assignment</p>
                                                                            </div>
                                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                                {memo.projectName}
                                                                            </p>
                                                                        </div>
                                                                        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm">
                                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                                <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporting Date</p>
                                                                            </div>
                                                                            <p className="text-sm font-bold text-slate-900">
                                                                                {format(memo.reportDate, "MMMM d, yyyy")}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Memo Content Areas */}
                                                                    <div className="space-y-4">
                                                                        {/* Universal Memo Section */}
                                                                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100/50">
                                                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Universal Memo</p>
                                                                                </div>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => activeDualMemos?.universal && copyToClipboard(`UNIVERSAL MEMO:\n${activeDualMemos.universal.memoContent}`)}
                                                                                    className="h-7 text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                                                    disabled={!activeDualMemos?.universal}
                                                                                >
                                                                                    <Copy className="h-3 w-3 mr-1.5" /> Copy
                                                                                </Button>
                                                                            </div>
                                                                            <div className="p-5 min-h-[80px]">
                                                                                {isFetchingDual ? (
                                                                                    <div className="h-4 w-3/4 bg-slate-100 animate-pulse rounded" />
                                                                                ) : activeDualMemos?.universal ? (
                                                                                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                                        {activeDualMemos.universal.memoContent}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-sm text-slate-400 italic">Empty</div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* 140 Char Memo Section - Only if required */}
                                                                        {memo.isMemoRequired && (
                                                                            <div className="border border-blue-100/50 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-blue-50/50">
                                                                                <div className="px-4 py-3 border-b border-blue-50 bg-blue-50/20 flex items-center justify-between">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className="bg-amber-50 text-amber-700 border-amber-300 text-[9px] px-1.5 py-0 h-4 cursor-help font-bold"
                                                                                        >
                                                                                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                                                                            140
                                                                                        </Badge>
                                                                                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">140 Char Memo</p>
                                                                                    </div>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => activeDualMemos?.short && copyToClipboard(`140 CHAR MEMO:\n${activeDualMemos.short.memoContent}`)}
                                                                                        className="h-7 text-[10px] font-bold text-blue-400 hover:text-blue-600 hover:bg-blue-50/50"
                                                                                        disabled={!activeDualMemos?.short}
                                                                                    >
                                                                                        <Copy className="h-3 w-3 mr-1.5" /> Copy
                                                                                    </Button>
                                                                                </div>
                                                                                <div className="p-5 min-h-[80px]">
                                                                                    {isFetchingDual ? (
                                                                                        <div className="h-4 w-3/4 bg-slate-100 animate-pulse rounded" />
                                                                                    ) : activeDualMemos?.short ? (
                                                                                        <div className="text-sm text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                                                                                            {activeDualMemos.short.memoContent}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-sm text-slate-400 italic">Empty</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                            Logged At: {format(memo.createdAt, "h:mm a, MMM d")}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                const combined = [];
                                                                                if (activeDualMemos?.universal) combined.push(`UNIVERSAL MEMO:\n${activeDualMemos.universal.memoContent}`);
                                                                                if (activeDualMemos?.short) combined.push(`140 CHAR MEMO:\n${activeDualMemos.short.memoContent}`);
                                                                                copyToClipboard(combined.join("\n\n") || memo.memoContent);
                                                                            }}
                                                                            className="h-8 text-[10px] font-bold border-slate-200 hover:bg-white"
                                                                        >
                                                                            Copy Combined
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                                    {isLoading ? "Fetching organization memos..." : "No memos found matching your criteria."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Pagination Component */}
                            {meta && meta.totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gradient-to-r from-slate-50/50 to-slate-100/30">
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> memos
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
        </TooltipProvider>
    );
}


