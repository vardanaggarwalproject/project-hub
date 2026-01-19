"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { 
    FileText, 
    FolderKanban, 
    Calendar as CalendarIcon, 
    Clock, 
    Copy,
    ShieldCheck,
    AlertCircle,
    UserCircle,
    CheckCircle2,
    CalendarCheck,
    History
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminReportDetailProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    reportId: string | null;
    type: "eod" | "memo";
}

export function AdminReportDetail({ isOpen, onOpenChange, reportId, type }: AdminReportDetailProps) {
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [associatedMemos, setAssociatedMemos] = useState<{ short?: any, universal?: any } | null>(null);

    useEffect(() => {
        if (isOpen && reportId) {
            fetchReport();
        } else if (!isOpen) {
            setReport(null);
            setAssociatedMemos(null);
        }
    }, [isOpen, reportId, type]);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/${type}s/${reportId}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setReport(data);

            // Fetch extra info (associated memos) for both EOD and Memo views to show the complete picture
            const params = new URLSearchParams({
                projectId: data.projectId,
                userId: data.userId,
                date: format(new Date(data.reportDate), "yyyy-MM-dd"),
                summary: "true"
            });
            const mRes = await fetch(`/api/memos?${params.toString()}`);
            const mData = await mRes.json();
            if (mData.data) {
                setAssociatedMemos({
                    short: mData.data.find((m: any) => m.memoType === 'short'),
                    universal: mData.data.find((m: any) => m.memoType === 'universal')
                });
            }
        } catch (error) {
            console.error("Fetch report detail error:", error);
            toast.error("Failed to load report details");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, section?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(section ? `${section} copied to clipboard` : "Copied to clipboard", {
            duration: 2000,
            className: "bg-green-50 text-green-700 border-green-200",
        });
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "p-0 bg-white dark:bg-[#0f1115] border-none flex flex-col rounded-[24px] overflow-hidden shadow-2xl transition-all duration-300",
                "max-w-[95vw] lg:max-w-6xl max-h-[92vh]"
            )}>
                <DialogTitle className="sr-only">
                    {type === "eod" ? "EOD Report" : "Memo Report"} - {report?.projectName}
                </DialogTitle>

                {isLoading ? (
                    <div className="flex flex-col lg:flex-row h-[600px] animate-pulse">
                        <div className="w-full lg:w-[360px] bg-slate-50 dark:bg-white/[0.02] border-r border-slate-100 dark:border-white/5 p-8 space-y-8">
                            <Skeleton className="h-10 w-32 rounded-xl" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-14 w-14 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                            <div className="space-y-6 pt-6">
                                <Skeleton className="h-24 w-full rounded-2xl" />
                                <Skeleton className="h-24 w-full rounded-2xl" />
                            </div>
                        </div>
                        <div className="flex-1 p-10 space-y-10">
                            <Skeleton className="h-8 w-48 rounded-lg" />
                            <Skeleton className="h-40 w-full rounded-3xl" />
                            <Skeleton className="h-40 w-full rounded-3xl" />
                        </div>
                    </div>
                ) : report ? (
                    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                        {/* SIDEBAR: Metadata & Context */}
                        <aside className="w-full lg:w-[380px] bg-slate-50 dark:bg-[#15181e] border-r border-slate-100 dark:border-white/5 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Header Badge */}
                                <div className="space-y-5">
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] shadow-sm",
                                        type === "eod" 
                                            ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" 
                                            : "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                    )}>
                                        {type === "eod" ? <FileText className="h-4 w-4" /> : <History className="h-4 w-4" />}
                                        {type === "eod" ? "EOD Report" : "Daily Memo"}
                                    </div>

                                    {/* User Profile */}
                                    <div className="flex items-center gap-4 group">
                                        <div className="relative">
                                            <Avatar className="h-16 w-16 border-4 border-white dark:border-[#1a1f26] shadow-xl transition-transform group-hover:scale-105 duration-300">
                                                <AvatarImage src={report.user?.image || ""} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl">
                                                    {report.user?.name?.substring(0, 2).toUpperCase() || "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white dark:border-[#1a1f26] h-5 w-5 rounded-full flex items-center justify-center shadow-lg">
                                                <CheckCircle2 className="h-3 w-3 text-white" />
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                                                {report.user?.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5 mt-0.5">
                                                <ShieldCheck className="h-3 w-3 text-blue-500" />
                                                {report.user?.role || "Team Member"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Info Cards */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-5 border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                                <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Project</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate pl-0.5">
                                            {report.projectName}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-5 border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                                <CalendarCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Report Date</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 pl-0.5">
                                            {format(new Date(report.reportDate), "MMMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>

                                {/* Daily Memos Synchronization */}
                                <div className="pt-4 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <History className="h-3 w-3" /> Associated Memos
                                        </h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[20px] p-5 shadow-sm group/memo overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/memo:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => copyToClipboard(associatedMemos?.universal?.memoContent, "Universal Memo")}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Universal Memo</p>
                                            </div>
                                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                                {associatedMemos?.universal?.memoContent || "No universal memo submitted for this day."}
                                            </p>
                                        </div>

                                        {(report.isMemoRequired || type === 'memo' && report.memoType === 'short') && (
                                            <div className="bg-amber-500/[0.03] dark:bg-amber-500/5 border border-amber-500/10 rounded-[20px] p-5 shadow-sm group/memo relative">
                                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/memo:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => copyToClipboard(associatedMemos?.short?.memoContent, "140 Char Memo")}>
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge variant="outline" className="bg-amber-500 text-white border-none text-[9px] px-1.5 py-0 h-4 font-black">140</Badge>
                                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Required Memo</p>
                                                </div>
                                                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-bold">
                                                    {associatedMemos?.short?.memoContent || (report.isMemoRequired ? "Missing required memo." : "Not required.")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Footer */}
                            <div className="p-6 bg-slate-100/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] flex items-center justify-between">
                                    <span>Captured On:</span>
                                    <span className="text-slate-600 dark:text-slate-400">{format(new Date(report.createdAt), "PPP p")}</span>
                                </p>
                            </div>
                        </aside>

                        {/* MAIN CONTENT: Report Data */}
                        <main className="flex-1 flex flex-col bg-white dark:bg-[#0f1115] min-h-0 relative">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[120px] -z-10 rounded-full" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[120px] -z-10 rounded-full" />

                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar">
                                {type === "eod" ? (
                                    <>
                                        {/* Client Facing Section */}
                                        <section className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] flex items-center gap-3">
                                                        <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                                        Client Communication
                                                    </h2>
                                                    <p className="text-[11px] text-slate-400 font-medium pl-11">The primary update shared with the client</p>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(report.clientUpdate || "", "Client Communication")}
                                                    className="h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/[0.05] hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 border-none transition-all"
                                                >
                                                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy Section
                                                </Button>
                                            </div>
                                            <div className="relative group/content">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[32px] opacity-0 group-hover/content:opacity-[0.03] transition-opacity duration-500" />
                                                <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-[32px] p-8 lg:p-10 border border-slate-100 dark:border-white/5 shadow-inner backdrop-blur-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/30" />
                                                    <p className="text-sm lg:text-[15px] text-slate-800 dark:text-slate-200 leading-[1.8] whitespace-pre-wrap font-medium">
                                                        {report.clientUpdate || "No client communication provided for this report."}
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Internal Context Section */}
                                        <section className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] flex items-center gap-3">
                                                        <span className="h-1 w-8 bg-indigo-600 rounded-full" />
                                                        Internal Context
                                                    </h2>
                                                    <p className="text-[11px] text-slate-400 font-medium pl-11">Deep-dive technical details and team notes</p>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(report.actualUpdate || "", "Internal Context")}
                                                    className="h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-600 dark:text-slate-300 border-none transition-all"
                                                >
                                                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy Section
                                                </Button>
                                            </div>
                                            <div className="bg-white dark:bg-transparent rounded-[32px] p-8 lg:p-10 border-2 border-dashed border-slate-100 dark:border-white/10 relative group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/30" />
                                                <p className="text-sm lg:text-[15px] text-slate-700 dark:text-slate-300 leading-[1.8] whitespace-pre-wrap font-medium italic">
                                                    {report.actualUpdate || "No internal context or additional details provided."}
                                                </p>
                                            </div>
                                        </section>
                                    </>
                                ) : (
                                    /* MEMO TYPE SPECIFIC VIEW (If accessed directly as memo) */
                                    <section className="space-y-8 max-w-3xl mx-auto">
                                        <div className="text-center space-y-6 mb-12">
                                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-3">
                                                <FileText className="h-10 w-10 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Daily Update Memo</h2>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">Standardized team communication & alignment</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-[40px] p-10 lg:p-14 border border-slate-100 dark:border-white/5 relative overflow-hidden backdrop-blur-xl">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                                            <div className="absolute top-6 right-8">
                                                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-indigo-50 dark:hover:bg-indigo-500/10" onClick={() => copyToClipboard(report.memoContent, "Memo Content")}>
                                                    <Copy className="h-5 w-5 text-indigo-500" />
                                                </Button>
                                            </div>
                                            <p className="text-lg lg:text-xl text-slate-800 dark:text-slate-100 leading-relaxed font-semibold whitespace-pre-wrap">
                                                {report.memoContent}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-100 dark:border-white/5">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sync Status</p>
                                                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-2xl w-fit text-xs font-bold">
                                                    <CheckCircle2 className="h-4 w-4" /> Logged & Synced
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-1">Memo Category</p>
                                                <Badge className={cn(
                                                    "px-4 py-2.5 rounded-2xl text-xs font-bold shadow-none",
                                                    report.memoType === 'universal' 
                                                        ? "bg-slate-900 dark:bg-white dark:text-slate-900" 
                                                        : "bg-indigo-600 text-white"
                                                )}>
                                                    {report.memoType === 'universal' ? 'Universal Announcement' : 'Required Project Memo'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Main Footer / Action Bar */}
                            <footer className="p-6 lg:p-8 bg-slate-50 dark:bg-[#15181e] border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-6">
                                <div className="hidden sm:flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em]">Official Log Verified</span>
                                    </div>
                                    <span className="text-[20px] text-slate-200 dark:text-white/10 font-thin">|</span>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                                        Report ID: {reportId?.substring(0, 8).toUpperCase()}...
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Button
                                        onClick={() => {
                                            if (type === "eod") {
                                                const combined = [
                                                    `*EOD REPORT: ${report.projectName} | ${format(new Date(report.reportDate), "PPP")}*`,
                                                    "",
                                                    "*CLIENT UPDATE:*",
                                                    report.clientUpdate || "N/A",
                                                    "",
                                                    "*INTERNAL CONTEXT:*",
                                                    report.actualUpdate || "N/A",
                                                    "",
                                                    "*DAILY MEMOS:*",
                                                    `- Universal: ${associatedMemos?.universal?.memoContent || "N/A"}`,
                                                    `- 140 Char: ${associatedMemos?.short?.memoContent || "N/A"}`
                                                ].join("\n");
                                                copyToClipboard(combined, "Full Report Bundle");
                                            } else {
                                                copyToClipboard(report.memoContent, "Memo Header");
                                            }
                                        }}
                                        className="flex-1 sm:flex-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-[11px] font-black uppercase tracking-[0.15em] px-8 py-7 rounded-[20px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copy Complete Report
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        className="hidden sm:flex h-14 w-14 rounded-[20px] border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 p-0"
                                    >
                                        <Clock className="h-5 w-5 text-slate-400" />
                                    </Button>
                                </div>
                            </footer>
                        </main>
                    </div>
                ) : (
                    <div className="p-20 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                            <AlertCircle className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Report Not Found</h3>
                            <p className="text-slate-500 max-w-sm">The requested report could not be retrieved. It may have been deleted or the ID is invalid.</p>
                        </div>
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-10">Close Modal</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
