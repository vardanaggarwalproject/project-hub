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
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      <Card className="border border-slate-100/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white group rounded-xl overflow-hidden">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              {stats.memosThisMonth}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memos Sent</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center text-blue-600 shadow-inner">
            <FileText className="h-4.5 w-4.5" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-slate-100/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white group rounded-xl overflow-hidden">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-purple-600 transition-colors">
              {stats.eodsThisMonth}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EODs Sent</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors flex items-center justify-center text-purple-600 shadow-inner">
             <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-100/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white group rounded-xl overflow-hidden">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
              {stats.completionRate}%
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center text-emerald-600 shadow-inner">
            <Percent className="h-4.5 w-4.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
