import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  memosThisMonth: number;
  eodsThisMonth: number;
  completionRate: number;
}

interface StatsCardsProps {
  stats: Stats;
}

import { FileText, CheckCircle2, Percent } from "lucide-react";

/**
 * Update history stats cards showing monthly memo/EOD counts and completion rate
 */
export const StatsCards = React.memo(function StatsCards({
  stats,
}: StatsCardsProps) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
      <Card className="border border-slate-100/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              {stats.memosThisMonth}
            </div>
            <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">Memos Sent</div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center text-blue-600 shadow-inner">
            <FileText className="h-7 w-7" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-slate-100/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-slate-900 tracking-tight group-hover:text-purple-600 transition-colors">
              {stats.eodsThisMonth}
            </div>
            <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">EODs Sent</div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-purple-50 group-hover:bg-purple-100 transition-colors flex items-center justify-center text-purple-600 shadow-inner">
             <CheckCircle2 className="h-7 w-7" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-100/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
              {stats.completionRate}%
            </div>
            <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">Completion Rate</div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center text-emerald-600 shadow-inner">
            <Percent className="h-7 w-7" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
