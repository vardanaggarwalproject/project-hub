import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DayStatus } from "@/types/report";

interface CalendarGridProps {
  calendarDays: DayStatus[];
  onDayClick: (day: DayStatus, type: "memo" | "eod") => void;
  isMemoRequired?: boolean;
}

/**
 * Calendar grid displaying days with memo and EOD submission status
 */
export const CalendarGrid = React.memo(function CalendarGrid({
  calendarDays,
  onDayClick,
  isMemoRequired,
}: CalendarGridProps) {
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
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[110px] p-2 flex flex-col gap-1 transition-all duration-200 group relative ${day.isOtherMonth ? "bg-slate-50/50 opacity-40 uppercase" : "bg-white hover:bg-slate-50"
              } ${day.isToday ? "bg-blue-50/30 ring-inset ring-2 ring-blue-500/10 z-10" : ""}`}
            onClick={() => {
              // Cell click could trigger add if needed
            }}
          >
            {day.isToday && (
              <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
            )}
            <div className={`text-xs font-bold ${day.isToday ? "text-blue-600" : "text-slate-700"}`}>
              {format(day.date, "d")}
            </div>

            <div className="flex flex-col gap-1 mt-auto">
              {!day.isOtherMonth && (day.isValidDate || day.hasUniversal || day.hasShort || day.hasEOD) && (
                <>
                  {/* Universal Memo */}
                  {(day.isValidDate || day.hasUniversal) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-full justify-center text-[9px] cursor-pointer py-0.5 rounded-md border shadow-sm transition-all duration-200 active:scale-95",
                        day.hasUniversal
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : day.isToday
                            ? "bg-amber-50 text-amber-700 border-amber-200 border-dashed"
                            : "bg-red-50 text-red-700 border-red-200"
                      )}
                      onClick={() => onDayClick(day, "memo")}
                    >
                      {day.hasUniversal ? "✓ Univ. Memo" : day.isToday ? "Pend. Univ." : "Miss. Univ."}
                    </Badge>
                  )}

                  {/* 140ch Memo - Only if project requires it */}
                  {isMemoRequired && (day.isValidDate || day.hasShort) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-full justify-center text-[9px] cursor-pointer py-0.5 rounded-md border shadow-sm transition-all duration-200 active:scale-95",
                        day.hasShort
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : day.isToday
                            ? "bg-rose-50 text-rose-700 border-rose-200 border-dashed"
                            : "bg-red-50 text-red-700 border-red-200"
                      )}
                      onClick={() => onDayClick(day, "memo")}
                    >
                      {day.hasShort ? "✓ 140ch Memo" : day.isToday ? "Pend. 140ch" : "Miss. 140ch"}
                    </Badge>
                  )}

                  {/* EOD Report */}
                  {(day.isValidDate || day.hasEOD) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-full justify-center text-[9px] cursor-pointer py-0.5 rounded-md border shadow-sm transition-all duration-200 active:scale-95",
                        day.hasEOD
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : day.isToday
                            ? "bg-amber-50 text-amber-700 border-amber-200 border-dashed"
                            : "bg-red-50 text-red-700 border-red-200"
                      )}
                      onClick={() => onDayClick(day, "eod")}
                    >
                      {day.hasEOD ? "✓ EOD Report" : day.isToday ? "Pend. EOD" : "Miss. EOD"}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      < div className="p-3 px-5 bg-white border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px]" >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-green-50 border border-green-200"></div>
          <span className="text-slate-600 font-medium">Completed Update</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-200 border-dashed"></div>
          <span className="text-slate-600 font-medium">Pending Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200"></div>
          <span className="text-slate-600 font-medium">Missing Past</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-blue-50 border-2 border-blue-500/20"></div>
          <span className="text-slate-600 font-medium">Today</span>
        </div>
      </div >
    </>
  );
});
