import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-25 md:min-h-[120px] border-r border-b border-slate-50 p-2 ${
              day.isOtherMonth ? "bg-slate-50 opacity-50" : ""
            } ${day.isToday ? "bg-blue-50" : "bg-white"}`}
          >
            <div className="text-sm font-semibold text-slate-900 mb-2">
              {format(day.date, "d")}
            </div>
            <div className="space-y-1.5">
              {!day.isOtherMonth && day.isValidDate && (
                <>
                  {day.hasMemo ? (
                    <Badge
                      className="w-full justify-center bg-green-100 text-green-700 border-green-200 hover:bg-green-200 text-xs cursor-pointer"
                      onClick={() => onDayClick(day, "memo")}
                    >
                      ✓ Memo
                    </Badge>
                  ) : (
                    <Badge
                      className="w-full justify-center bg-red-100 text-red-700 border-red-200 hover:bg-red-200 text-xs cursor-pointer"
                      onClick={() => onDayClick(day, "memo")}
                    >
                      ✗ Memo
                    </Badge>
                  )}

                  {day.hasEOD ? (
                    <Badge
                      className="w-full justify-center bg-green-100 text-green-700 border-green-200 hover:bg-green-200 text-xs cursor-pointer"
                      onClick={() => onDayClick(day, "eod")}
                    >
                      ✓ EOD
                    </Badge>
                  ) : day.isToday ? (
                    <Badge
                      className="w-full justify-center bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 text-xs cursor-pointer"
                      onClick={() => onDayClick(day, "eod")}
                    >
                      ⏳ EOD
                    </Badge>
                  ) : (
                    <Badge
                      className="w-full justify-center bg-red-100 text-red-700 border-red-200 hover:bg-red-200 text-xs cursor-pointer"
                      onClick={() => onDayClick(day, "eod")}
                    >
                      ✗ EOD
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap gap-4 text-xs">
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
      </div>
    </>
  );
});
