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
    X
} from "lucide-react";

import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover as DatePopover,
  PopoverContent as DatePopoverContent,
  PopoverTrigger as DatePopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

import { ProjectSelect } from "@/components/admin/ProjectSelect";
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
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined
    );
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
    
    const [reports, setReports] = useState<EODReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const limit = 10;

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
            if (selectedDate) params.append("date", format(selectedDate, "yyyy-MM-dd"));

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
    }, [page, debouncedSearch, selectedProject, selectedDate]);

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedProject) params.set("project", selectedProject);
        if (selectedDate) params.set("date", format(selectedDate, "yyyy-MM-dd"));
        
        const newUrl = params.toString() ? `?${params.toString()}` : "/admin/eods";
        router.replace(newUrl, { scroll: false });
    }, [debouncedSearch, selectedProject, selectedDate, router]);

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
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm mt-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by user name..." 
                                className="pl-10 h-10 bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg placeholder:text-muted-foreground/70"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
                            <ProjectSelect value={selectedProject} onValueChange={setSelectedProject} />
                             <DatePicker
                                date={selectedDate}
                                setDate={setSelectedDate}
                                placeholder="Filter by submitted date..."
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedProject("");
                                    setSelectedDate(undefined);
                                }}
                                className="h-10 px-4 text-xs font-semibold whitespace-nowrap"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </div>

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
                                                        <Dialog>
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
                                                            <DialogContent className="max-w-lg w-[95vw] sm:w-full rounded-2xl border border-slate-200 shadow-lg p-0 bg-white overflow-hidden">
                                                                <div className="p-6 border-b border-slate-100">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                                                                            <AvatarImage src={report.user.image || ""} />
                                                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">
                                                                                {report.user.name.substring(0, 2).toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0">
                                                                            <DialogTitle className="text-lg font-semibold text-slate-900 truncate">
                                                                                EOD Report
                                                                            </DialogTitle>
                                                                            <p className="text-sm text-slate-600 font-medium text-left">
                                                                            {report.user.name}
                                                                        </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="p-6 space-y-5">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                                                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                                                                <FolderKanban className="h-3 w-3 text-slate-500" /> Project
                                                                            </p>
                                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                                {report.projectName}
                                                                            </p>
                                                                        </div>
                                                                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                                                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                                                                <CalendarIcon className="h-3 w-3 text-slate-500" /> Date
                                                                            </p>
                                                                            <p className="text-sm font-bold text-slate-900">
                                                                                {format(report.reportDate, "MMM d, yyyy")}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                                                        {/* Client Update Section */}
                                                                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl overflow-hidden">
                                                                            <div className="px-4 py-2.5 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                                                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Client Facing Update</p>
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="sm" 
                                                                                    onClick={() => copyToClipboard(report.clientUpdate || "")}
                                                                                    className="h-6 px-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white"
                                                                                >
                                                                                    <Copy className="h-3 w-3 mr-1.5" /> Copy
                                                                                </Button>
                                                                            </div>
                                                                            <div className="p-4">
                                                                                <div className="text-sm text-slate-700 leading-relaxed font-medium break-words whitespace-pre-wrap">
                                                                                    {report.clientUpdate || "No client-facing update provided."}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Internal Update Section */}
                                                                        <div className="bg-slate-50/30 border border-slate-100 border-dashed rounded-xl overflow-hidden">
                                                                            <div className="px-4 py-2.5 border-b border-slate-100 border-dashed bg-white/30 flex items-center justify-between">
                                                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Internal Context</p>
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="sm" 
                                                                                    onClick={() => copyToClipboard(report.actualUpdate || "")}
                                                                                    className="h-6 px-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white"
                                                                                >
                                                                                    <Copy className="h-3 w-3 mr-1.5" /> Copy
                                                                                </Button>
                                                                            </div>
                                                                            <div className="p-4">
                                                                                <div className="text-sm text-slate-500 leading-relaxed font-medium break-words whitespace-pre-wrap italic">
                                                                                    {report.actualUpdate || "No internal update provided."}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="px-6 py-3.5 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                                                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                                                        Logged {format(report.createdAt, "MMM d, h:mm a")}
                                                                    </span>
                                                                    <div className="flex gap-1">
                                                                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                                        <div className="h-1 w-1 rounded-full bg-slate-500" />
                                                                    </div>
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
            </div>
        </TooltipProvider>
    );
}

// Helper DatePicker Component (Local for now, or could be shared)
function DatePicker({ date, setDate, placeholder }: { date: Date | undefined, setDate: (d: Date | undefined) => void, placeholder: string }) {
  return (
    <DatePopover>
      <DatePopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] h-10 justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </DatePopoverTrigger>
      <DatePopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </DatePopoverContent>
    </DatePopover>
  )
}

