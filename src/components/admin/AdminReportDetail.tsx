
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
    AlertCircle
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
    const [dualMemos, setDualMemos] = useState<{ short?: any, universal?: any } | null>(null);

    useEffect(() => {
        if (isOpen && reportId) {
            fetchReport();
        }
    }, [isOpen, reportId, type]);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/${type}s/${reportId}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setReport(data);

            // Fetch extra info
            if (type === "eod") {
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
            } else {
                const params = new URLSearchParams({
                    projectId: data.projectId,
                    userId: data.userId,
                    date: format(new Date(data.reportDate), "yyyy-MM-dd"),
                    summary: "true"
                });
                const mRes = await fetch(`/api/memos?${params.toString()}`);
                const mData = await mRes.json();
                if (mData.data) {
                    setDualMemos({
                        short: mData.data.find((m: any) => m.memoType === 'short'),
                        universal: mData.data.find((m: any) => m.memoType === 'universal')
                    });
                }
            }
        } catch (error) {
            console.error("Fetch report detail error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "p-0 bg-white dark:bg-[#191919] border border-slate-200 dark:border-slate-800 flex flex-col rounded-2xl overflow-hidden shadow-2xl",
                type === "eod" ? "max-w-[95vw] lg:max-w-6xl max-h-[95vh]" : "max-w-2xl w-[95vw] sm:w-full"
            )}>
                <DialogTitle className="sr-only">{type === "eod" ? "EOD Report" : "Memo Report"}</DialogTitle>

                {isLoading ? (
                    <div className="p-12 space-y-6">
                        <Skeleton className="h-12 w-1/3" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : report ? (
                    type === "eod" ? (
                        <div className="flex flex-col lg:flex-row h-full overflow-hidden min-h-[600px]">
                            {/* LEFT PANEL */}
                            <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-[#1e1e1e] border-r border-slate-100 dark:border-slate-800 flex flex-col min-h-0">
                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                            <FileText className="h-3.5 w-3.5" /> EOD Report
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                <AvatarImage src={report.user.image || ""} />
                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{report.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{report.user.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{report.user.role}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FolderKanban className="h-3 w-3" /> Project</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{report.projectName}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> Date</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{format(new Date(report.reportDate), "MMM d, yyyy")}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Submission</p>
                                            <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{format(new Date(report.createdAt), "PPP p")}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 space-y-6">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Daily Memos</h3>
                                        <div className="space-y-4">
                                            <div className="bg-white dark:bg-white/5 border border-slate-100 rounded-xl p-4 shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Universal Memo</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{associatedMemos?.universal?.memoContent || "No universal memo"}</p>
                                            </div>
                                            {report.isMemoRequired && (
                                                <div className="bg-blue-500/5 border border-blue-100 rounded-xl p-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">140 Char Memo</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{associatedMemos?.short?.memoContent || "Not submitted"}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* RIGHT PANEL */}
                            <div className="flex-1 flex flex-col bg-white dark:bg-[#191919] min-h-0">
                                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
                                    <section className="space-y-5">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4">Client Update</h3>
                                        <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 shadow-inner">
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{report.clientUpdate || "No client update provided."}</p>
                                        </div>
                                    </section>
                                    <section className="space-y-5">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-slate-300 pl-4">Internal Context</h3>
                                        <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{report.actualUpdate || "No internal context provided."}</p>
                                        </div>
                                    </section>
                                </div>
                                <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Verified Report</span>
                                    </div>
                                    <Button onClick={() => copyToClipboard(`CLIENT UPDATE:\n${report.clientUpdate}\n\nINTERNAL CONTEXT:\n${report.actualUpdate}`)} className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-8 py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2">
                                        <Copy className="h-4 w-4" /> Copy Report
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm"><FileText className="h-5 w-5" /></div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Daily Memo Report</DialogTitle>
                                            <p className="text-sm text-slate-500 font-medium">Reviewing updates from <span className="text-slate-900 font-bold">{report.user.name}</span></p>
                                        </div>
                                    </div>
                                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                        <AvatarImage src={report.user.image || ""} />
                                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">{report.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FolderKanban className="h-3.5 w-3.5 text-blue-500" /> Project</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{report.projectName}</p>
                                    </div>
                                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5 text-blue-500" /> Date</p>
                                        <p className="text-sm font-bold text-slate-900">{format(new Date(report.reportDate), "MMMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Universal Memo</p>
                                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(dualMemos?.universal?.memoContent)} className="h-7 text-[10px] font-bold text-slate-400">Copy</Button>
                                        </div>
                                        <div className="p-5 min-h-[80px] text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{dualMemos?.universal?.memoContent || "Empty"}</div>
                                    </div>
                                    {report.isMemoRequired && (
                                        <div className="border border-blue-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                            <div className="px-4 py-3 border-b border-blue-50 bg-blue-50/20 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[9px] px-1.5 py-0 h-4 font-bold">140</Badge>
                                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">140 Char Memo</p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(dualMemos?.short?.memoContent)} className="h-7 text-[10px] font-bold text-blue-400">Copy</Button>
                                            </div>
                                            <div className="p-5 min-h-[80px] text-sm text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{dualMemos?.short?.memoContent || "Empty"}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Logged At: {format(new Date(report.createdAt), "h:mm a, MMM d")}</span>
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${dualMemos?.universal?.memoContent}\n\n${dualMemos?.short?.memoContent}`)} className="h-8 text-[10px] font-bold border-slate-200">Copy Combined</Button>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="p-12 text-center text-slate-400 italic">Report not found.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
