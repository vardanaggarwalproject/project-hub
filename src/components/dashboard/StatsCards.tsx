import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ClipboardCheck } from "lucide-react";

interface StatsCardsProps {
  todayMemoCount: number;
  todayEodCount: number;
  totalProjects: number;
}

/**
 * Dashboard stats cards showing today's memo and EOD completion status
 */
export const StatsCards = React.memo(function StatsCards({
  todayMemoCount,
  todayEodCount,
  totalProjects,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all duration-200">
        <CardContent className="px-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Today's Memo
              </div>
              <div className="text-xl font-semibold text-slate-900 mb-0.5">
                {todayMemoCount}/{totalProjects} Projects
              </div>
              <div className="text-xs text-slate-500">
                {totalProjects - todayMemoCount} pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all duration-200">
        <CardContent className="px-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <ClipboardCheck className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Today's EOD
              </div>
              <div className="text-xl font-semibold text-slate-900 mb-0.5">
                {todayEodCount}/{totalProjects} Projects
              </div>
              <div className="text-xs text-slate-500">
                {totalProjects - todayEodCount} pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
