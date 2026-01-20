"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Eye, Clock, CheckCircle2, Search, FilterX, AlertCircle, Calendar as CalendarIcon, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/utils/error-handler";
import { AdminReportDetail } from "@/components/admin/AdminReportDetail";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DayDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    date: Date | null;
    type: "eod" | "memo";
}

export function DayDetailsDialog({ isOpen, onOpenChange, date, type }: DayDetailsDialogProps) {
    const [details, setDetails] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProject, setSelectedProject] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "missed">("all");

    useEffect(() => {
        if (isOpen && date) {
            fetchDetails();
            // Reset filters on open
            setSearchQuery("");
            setSelectedProject("all");
            setStatusFilter("all");
        }
    }, [isOpen, date, type]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const dateStr = format(date!, "yyyy-MM-dd");
            const res = await fetch(`/api/admin/stats/day-details?date=${dateStr}&type=${type}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setDetails(data);
        } catch (error) {
            handleApiError(error, "Fetch day details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewReport = (report: any) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    const uniqueProjects = useMemo(() => {
        const projects = new Set(details.map(d => d.project));
        return Array.from(projects).sort();
    }, [details]);

    const filteredDetails = useMemo(() => {
        return details.filter(item => {
            const matchesSearch = item.user.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProject = selectedProject === "all" || item.project === selectedProject;
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;
            return matchesSearch && matchesProject && matchesStatus;
        });
    }, [details, searchQuery, selectedProject, statusFilter]);

    // Stats for the header
    const stats = useMemo(() => {
        const total = details.length;
        const submitted = details.filter(d => d.status === "submitted").length;
        const missed = total - submitted;
        return { total, submitted, missed };
    }, [details]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] lg:max-w-6xl w-full h-[90vh] max-h-[850px] p-0 flex flex-col overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl gap-0">
                    
                    {/* Header Section */}
                    <div className="flex flex-col border-b border-slate-200 bg-slate-50/50 p-6 lg:p-8 gap-6 flex-shrink-0 z-10 relative">
                        {/* Title and Key Stats Row */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-blue-600 flex-shrink-0">
                                    <CalendarIcon className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center flex-wrap gap-x-2 gap-y-1">
                                        Summary for <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{date ? format(date, "MMMM d, yyyy") : ""}</span>
                                    </DialogTitle>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        Reviewing status for <span className="font-bold text-slate-700">{type === "eod" ? "EOD Reports" : "Memo Submissions"}</span>
                                    </p>
                                </div>
                            </div>
                            
                            {/* Stats Badges */}
                            <div className="flex gap-4 self-start md:self-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                    <div className="flex flex-col items-center min-w-[30px]">
                                        <span className="text-2xl font-bold text-emerald-700 leading-none tabular-nums">{stats.submitted}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-emerald-600/70 tracking-wider">Submitted</span>
                                        <span className="text-[10px] text-emerald-600/60 font-medium">On Track</span>
                                    </div>
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-40 ml-1" />
                                </div>
                                <div className="w-px bg-slate-100 my-1" />
                                <div className="flex items-center gap-3 px-4 py-2 bg-rose-50/50 rounded-lg border border-rose-100/50">
                                    <div className="flex flex-col items-center min-w-[30px]">
                                        <span className="text-2xl font-bold text-rose-700 leading-none tabular-nums">{stats.missed}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-rose-600/70 tracking-wider">Missing</span>
                                        <span className="text-[10px] text-rose-600/60 font-medium">Action Needed</span>
                                    </div>
                                    <AlertCircle className="h-5 w-5 text-rose-500 opacity-40 ml-1" />
                                </div>
                            </div>
                        </div>

                        {/* Filters Toolbar */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 pt-2">
                            <div className="relative w-full lg:max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input 
                                    placeholder="Search by user name..." 
                                    className="pl-9 h-9 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-lg shadow-sm text-xs font-medium transition-all focus:border-blue-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                                <Select value={selectedProject} onValueChange={setSelectedProject}>
                                    <SelectTrigger className="w-full sm:w-[220px] h-9 bg-white border-slate-200 rounded-lg font-medium text-xs text-slate-700 shadow-sm focus:ring-blue-500">
                                        <SelectValue placeholder="All Projects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-[200px]">
                                            <SelectItem value="all">All Projects</SelectItem>
                                            {uniqueProjects.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>

                                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex-grow sm:flex-grow-0">
                                    <button
                                        onClick={() => setStatusFilter("all")}
                                        className={cn(
                                            "flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200",
                                            statusFilter === "all" ? "bg-slate-100 text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("submitted")}
                                        className={cn(
                                            "flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200",
                                            statusFilter === "submitted" ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        Submitted
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("missed")}
                                        className={cn(
                                            "flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200",
                                            statusFilter === "missed" ? "bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        Missed
                                    </button>
                                </div>

                                {(searchQuery !== "" || selectedProject !== "all" || statusFilter !== "all") && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedProject("all");
                                            setStatusFilter("all");
                                        }}
                                        className="h-9 px-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg ml-auto border border-transparent hover:border-rose-100 text-xs font-medium"
                                    >
                                        <FilterX className="h-3.5 w-3.5 mr-2" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(12)].map((_, i) => (
                                    <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white shadow-sm border border-slate-100" />
                                ))}
                            </div>
                        ) : filteredDetails.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                                {filteredDetails.map((item) => (
                                    <div 
                                        key={`${item.userId}-${item.projectId}`}
                                        className={cn(
                                            "group relative flex flex-col bg-white rounded-2xl p-5 border transition-all duration-300 h-full",
                                            item.status === "submitted" 
                                                ? "border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1" 
                                                : "border-rose-100 bg-rose-50/5 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-900/5 hover:-translate-y-1 hover:bg-white"
                                        )}
                                    >
                                        {/* Status Strip */}
                                        <div className={cn(
                                            "absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full transition-all duration-300 group-hover:scale-y-110",
                                            item.status === "submitted" ? "bg-emerald-500" : "bg-rose-500"
                                        )} />

                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4 pl-3">
                                            <div className="flex-1 min-w-0 pr-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-slate-900 text-base truncate" title={item.user}>
                                                        {item.user}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <FolderKanban className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <p className="text-xs font-bold truncate tracking-tight text-slate-600" title={item.project}>
                                                        {item.project}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {item.status === "submitted" ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide shadow-none shrink-0 rounded-lg transition-colors">
                                                    Submitted
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-white text-rose-700 border-rose-200 group-hover:bg-rose-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide shadow-none shrink-0 rounded-lg transition-colors">
                                                    Missing
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="mt-auto pl-3 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className={cn(
                                                "flex items-center gap-1.5 transition-colors", 
                                                item.status === "submitted" ? "text-slate-500 group-hover:text-slate-700" : "text-rose-400 group-hover:text-rose-500"
                                            )}>
                                                <Clock className="h-3.5 w-3.5" />
                                                <span className="text-[11px] font-bold">
                                                    {item.status === "submitted" ? item.submittedAt : "No submission"}
                                                </span>
                                            </div>
                                            
                                            {item.status === "submitted" && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => handleViewReport(item)}
                                                    className="h-8 text-[10px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-transparent px-3 rounded-lg transition-all duration-300 uppercase tracking-wider"
                                                >
                                                    View Report <Eye className="h-3 w-3 ml-1.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-70 min-h-[400px]">
                                <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center border-2 border-slate-100 shadow-sm rotate-3">
                                    <Search className="h-10 w-10 text-slate-300 -rotate-3" />
                                </div>
                                <div className="space-y-2 max-w-sm">
                                    <p className="text-xl font-bold text-slate-900">No matching reports found</p>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        We couldn't find any submissions matching your current filters. Try searching for a different user or changing the status filter.
                                    </p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedProject("all");
                                        setStatusFilter("all");
                                    }}
                                    className="mt-4 text-slate-700 border-slate-300 h-11 px-8 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AdminReportDetail 
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                reportId={selectedReport?.id}
                type={type}
            />
        </>
    );
}
