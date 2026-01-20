
"use client";

import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users, FolderKanban, CheckCircle2, AlertCircle } from "lucide-react";

interface AdminCalendarGridProps {
  calendarDays: any[];
  onDayClick: (date: Date) => void;
  type: "eod" | "memo";
}


export const AdminCalendarGrid = React.memo(function AdminCalendarGrid({
  calendarDays,
  onDayClick,
  type,
}: AdminCalendarGridProps) {
  return (
    <>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 bg-slate-200 gap-px border-b border-slate-200">
        {calendarDays.map((day, idx) => {
          const stats = day.stats;
          const isFuture = stats?.isFuture || false;

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[130px] p-2 flex flex-col gap-1 transition-all duration-200 group relative",
                day.isOtherMonth ? "bg-slate-50/50 opacity-40 uppercase" : "bg-white/80 hover:bg-slate-50",
                day.isToday && "bg-blue-50/30 ring-inset ring-2 ring-blue-500/10 z-10",
                !isFuture && "cursor-pointer"
              )}
              onClick={() => !isFuture && onDayClick(day.date)}
            >
              {day.isToday && (
                <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
              )}
              <div className={cn(
                "text-xs font-bold",
                day.isToday ? "text-blue-600" : "text-slate-700"
              )}>
                {format(day.date, "d")}
              </div>

              {!isFuture && stats && (stats.submittedCount > 0 || stats.missedCount > 0) && (
                <div className="flex flex-col gap-1 mt-auto">
                  {/* Submitted Count */}
                  <Badge
                    variant="outline"
                    className="w-full justify-between text-[9px] py-0.5 rounded-md border shadow-sm bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Sub.</span>
                    <span>{stats.submittedCount}</span>
                  </Badge>

                  {/* Missed Count */}
                  {stats.missedCount > 0 && (
                    <Badge
                      variant="outline"
                      className="w-full justify-between text-[9px] py-0.5 rounded-md border shadow-sm bg-red-50 text-red-700 border-red-200"
                    >
                      <span className="flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" /> Miss.</span>
                      <span>{stats.missedCount}</span>
                    </Badge>
                  )}

                  {/* User Count */}
                  <Badge
                    variant="outline"
                    className="w-full justify-between text-[9px] py-0.5 rounded-md border shadow-sm bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> Users</span>
                    <span>{stats.userCount}</span>
                  </Badge>

                  {/* Project Count */}
                  <Badge
                    variant="outline"
                    className="w-full justify-between text-[9px] py-0.5 rounded-md border shadow-sm bg-slate-50 text-slate-700 border-slate-200"
                  >
                    <span className="flex items-center gap-1"><FolderKanban className="h-2.5 w-2.5" /> Proj.</span>
                    <span>{stats.projectCount}</span>
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3 px-5 bg-white border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 py-0 text-[10px]">Sub.</Badge>
          <span className="text-slate-600 font-medium">Daily Submissions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 py-0 text-[10px]">Miss.</Badge>
          <span className="text-slate-600 font-medium">Missing Reports</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-0 text-[10px]">Users</Badge>
          <span className="text-slate-600 font-medium">Both EOD & Memo Submitted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 py-0 text-[10px]">Proj.</Badge>
          <span className="text-slate-600 font-medium">Total Active Projects</span>
        </div>
      </div>
    </>
  );
});
