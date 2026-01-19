
"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, CheckCircle2, XCircle, User, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/utils/error-handler";
import { AdminReportDetail } from "@/components/admin/AdminReportDetail";
import { Card } from "@/components/ui/card";

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

    useEffect(() => {
        if (isOpen && date) {
            fetchDetails();
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

    const submittedCount = details.filter(d => d.status === "submitted").length;
    const missedCount = details.filter(d => d.status === "missed").length;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                    {/* Header with gradient background */}
                    <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                        <div className="space-y-3">
                            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                                <div className="p-2 rounded-lg bg-white shadow-sm">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        {type === "eod" ? "EOD Reports" : "Memos"}
                                    </span>
                                    <span className="text-slate-300 font-normal">•</span>
                                    <span className="text-slate-600 font-semibold text-lg">
                                        {date ? format(date, "MMMM d, yyyy") : ""}
                                    </span>
                                </div>
                            </DialogTitle>
                            
                            {/* Summary Stats */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-emerald-100">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-700">{submittedCount} Submitted</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-rose-100">
                                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                    <span className="text-xs font-bold text-rose-700">{missedCount} Missed</span>
                                </div>
                                <div className="ml-auto text-xs text-slate-500 font-medium">
                                    Total: {details.length} {details.length === 1 ? 'assignment' : 'assignments'}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : details.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <div className="p-4 rounded-full bg-slate-100 mb-4">
                                    <Calendar className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium text-lg">No assignments for this day</p>
                                <p className="text-slate-400 text-sm mt-1">There are no active project assignments on this date.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {details.map((row, i) => (
                                    <Card 
                                        key={i} 
                                        className={`p-4 transition-all duration-200 hover:shadow-md border ${
                                            row.status === "submitted" 
                                                ? "bg-white border-emerald-100 hover:border-emerald-200" 
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Left: User & Project Info */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* Avatar */}
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-sm ${
                                                    row.status === "submitted" 
                                                        ? "bg-gradient-to-br from-emerald-500 to-teal-600" 
                                                        : "bg-gradient-to-br from-slate-400 to-slate-500"
                                                }`}>
                                                    {row.user.charAt(0).toUpperCase()}
                                                </div>

                                                {/* User & Project Details */}
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                        <span className="font-bold text-slate-800 text-base truncate">
                                                            {row.user}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                        <span className="text-slate-600 text-sm font-medium truncate">
                                                            {row.project}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Center: Time & Status */}
                                            <div className="flex items-center gap-4">
                                                {/* Submission Time */}
                                                {row.status === "submitted" && (
                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                                                        <Clock className="h-4 w-4 text-slate-500" />
                                                        <span className="text-sm font-semibold text-slate-700">
                                                            {row.submittedAt}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                {row.status === "submitted" ? (
                                                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold shadow-sm">
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                        Submitted
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold">
                                                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                                        Missed
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Right: Action Button */}
                                            <div className="flex-shrink-0">
                                                {row.status === "submitted" ? (
                                                    <Button 
                                                        variant="default" 
                                                        size="sm" 
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm h-9 px-4"
                                                        onClick={() => handleViewReport(row)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Button>
                                                ) : (
                                                    <div className="w-24"></div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
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
