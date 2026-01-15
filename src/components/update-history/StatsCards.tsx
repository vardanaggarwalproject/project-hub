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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <Card className="border border-slate-100 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.memosThisMonth}
            </div>
            <div className="text-sm font-medium text-slate-500 mt-1">Memos Sent</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-slate-100 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.eodsThisMonth}
            </div>
            <div className="text-sm font-medium text-slate-500 mt-1">EODs Sent</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
             <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.completionRate}%
            </div>
            <div className="text-sm font-medium text-slate-500 mt-1">Completion Rate</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Percent className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
