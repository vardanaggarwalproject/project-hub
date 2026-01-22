"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Calendar, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface AdminGroupedListProps<T> {
    data: T[];
    groupBy: keyof T;
    columns: Column<T>[];
    emptyMessage?: string;
    accentColor?: "blue" | "indigo" | "emerald";
}

export function AdminGroupedList<T extends { id: string; projectName?: string | null; uploader?: { name: string; image: string | null } | null; createdAt: Date | string; updatedAt: Date | string }>({
    data,
    groupBy,
    columns,
    emptyMessage = "No items found.",
    accentColor = "blue"
}: AdminGroupedListProps<T>) {
    // Group items by the specified key
    const groupedData = data.reduce((acc, item) => {
        const groupKey = (item[groupBy] as string) || "Unknown Project";
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {} as Record<string, T[]>);

    const projectNames = Object.keys(groupedData).sort();

    const colorClasses = {
        blue: {
            border: "border-blue-600",
            bg: "bg-blue-50",
            text: "text-blue-600",
            badge: "bg-blue-50 text-blue-700"
        },
        indigo: {
            border: "border-indigo-600",
            bg: "bg-indigo-50",
            text: "text-indigo-600",
            badge: "bg-indigo-50 text-indigo-700"
        },
        emerald: {
            border: "border-emerald-600",
            bg: "bg-emerald-50",
            text: "text-emerald-600",
            badge: "bg-emerald-50 text-emerald-700"
        }
    };

    const activeColor = colorClasses[accentColor];

    if (data.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-6 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-slate-200">
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                    <FolderKanban className="h-10 w-10 text-slate-200" />
                </div>
                <div className="max-w-xs space-y-2">
                    <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Vault Empty</h4>
                    <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-16">
            {projectNames.map((projectName) => (
                <div key={projectName} className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h3 className={cn(
                            "text-xl font-black text-[#0f172a] uppercase tracking-tight italic pl-4 border-l-4",
                            activeColor.border
                        )}>
                            {projectName}
                        </h3>
                        <Badge className={cn("border-none rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider", activeColor.badge)}>
                            {groupedData[projectName].length} Records
                        </Badge>
                    </div>

                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2rem] border border-slate-100/50">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 border-b border-slate-100">
                                        <TableHead className="w-[80px] pl-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Index</TableHead>
                                        {columns.map((col, idx) => (
                                            <TableHead key={idx} className={cn("text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-6", col.className)}>
                                                {col.header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedData[projectName].map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/40 transition-all duration-300 border-b border-slate-50 last:border-0 group">
                                            <TableCell className="pl-8 font-black text-slate-300 text-[11px] tracking-tighter italic">
                                                #{String(index + 1).padStart(2, '0')}
                                            </TableCell>
                                            {columns.map((col, idx) => (
                                                <TableCell key={idx} className={cn("py-6 text-sm", col.className)}>
                                                    {col.cell ? (
                                                        col.cell(item)
                                                    ) : (
                                                        <span className="font-bold text-[#0f172a] uppercase tracking-tight">
                                                            {String(item[col.accessorKey!] || "-")}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}

export function UploaderCell({ uploader, createdAt, updatedAt }: { uploader?: any, createdAt: Date | string, updatedAt: Date | string }) {
    const createdDate = new Date(createdAt);
    const updatedDate = new Date(updatedAt);
    const isEdited = updatedDate.getTime() - createdDate.getTime() > 1000;

    return (
        <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-md transition-transform group-hover:scale-110">
                <AvatarImage src={uploader?.image || ""} />
                <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-black">
                    {uploader?.name?.substring(0, 2).toUpperCase() || "NB"}
                </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                    {uploader?.name || "System"}
                </p>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        <Calendar className="h-3 w-3" />
                        {format(createdDate, "MMM d, yyyy")}
                    </div>
                    {isEdited && (
                        <div className="flex items-center gap-1.5 text-[9px] text-blue-500 font-black uppercase tracking-widest bg-blue-50/50 px-1.5 py-0.5 rounded-md">
                            <Clock className="h-3 w-3" />
                            {format(updatedDate, "MMM d, yyyy")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
