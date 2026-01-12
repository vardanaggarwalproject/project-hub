import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  currentMonth: Date;
  projectName?: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/**
 * Calendar header with month navigation and project name
 */
export const CalendarHeader = React.memo(function CalendarHeader({
  currentMonth,
  projectName,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-900">
        {format(currentMonth, "MMMM yyyy")} - {projectName || "Project"}
      </h2>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onPrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
