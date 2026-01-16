import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DayStatus } from "@/types/report";

interface CalendarGridProps {
  calendarDays: DayStatus[];
  onDayClick: (day: DayStatus, type: "memo" | "eod") => void;
}

/**
 * Calendar grid displaying days with memo and EOD submission status
 */
export const CalendarGrid = React.memo(function CalendarGrid({
  calendarDays,
  onDayClick,
}: CalendarGridProps) {
  return (
    <>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 bg-slate-200 gap-px border-b border-slate-200">
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[140px] p-3 flex flex-col gap-2 transition-all duration-200 group relative ${day.isOtherMonth ? "bg-slate-50/50 opacity-40" : "bg-white hover:bg-slate-50"
              } ${day.isToday ? "bg-blue-50/30 ring-inset ring-2 ring-blue-500/10 z-10" : ""}`}
            onClick={() => {
              // Optional: Add entire cell click handler logic if desired, 
              // currently handled by badges. But clicking empty space could trigger "Add".
              // Keeping it badge-only for now to avoid confusion, or can enable cell click.
            }}
          >
            {day.isToday && (
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
            )}
            <div className={`text-sm font-bold ${day.isToday ? "text-blue-600" : "text-slate-700"}`}>
              {format(day.date, "d")}
            </div>

            <div className="flex flex-col gap-1.5 mt-auto">
              {!day.isOtherMonth && (day.isValidDate || day.hasMemo || day.hasEOD) && (
                <>
                  {(day.hasMemo || day.isValidDate) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-full justify-center text-xs cursor-pointer py-1.5 rounded-lg border shadow-sm transition-all duration-200 active:scale-95",
                        day.hasMemo
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300"
                          : day.isToday
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 border-dashed"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      )}
                      onClick={() => onDayClick(day, "memo")}
                    >
                      {day.hasMemo ? "✓ Memo" : day.isToday ? "Pend. Memo" : "Missing Memo"}
                    </Badge>
                  )}

                  {(day.hasEOD || day.isValidDate) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-full justify-center text-xs cursor-pointer py-1.5 rounded-lg border shadow-sm transition-all duration-200 active:scale-95",
                        day.hasEOD
                          ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300"
                          : day.isToday
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 border-dashed"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      )}
                      onClick={() => onDayClick(day, "eod")}
                    >
                      {day.hasEOD ? "✓ EOD" : day.isToday ? "Pend. EOD" : "Missing EOD"}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      < div className="p-4 bg-white border-t border-slate-100 flex flex-wrap gap-4 text-xs" >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
          <span className="text-slate-600">Completed (click to view)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
          <span className="text-slate-600">Pending Today (click to add)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
          <span className="text-slate-600">Missing Past (click to add)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-500"></div>
          <span className="text-slate-600">Today</span>
        </div>
      </div >
    </>
  );
});
