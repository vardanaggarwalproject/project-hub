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

/**
 * Update history stats cards showing monthly memo/EOD counts and completion rate
 */
export const StatsCards = React.memo(function StatsCards({
  stats,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="border border-slate-200">
        <CardContent className="p-5 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {stats.memosThisMonth}
          </div>
          <div className="text-xs text-slate-500 mt-1">Memos This Month</div>
        </CardContent>
      </Card>
      <Card className="border border-slate-200">
        <CardContent className="p-5 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {stats.eodsThisMonth}
          </div>
          <div className="text-xs text-slate-500 mt-1">EODs This Month</div>
        </CardContent>
      </Card>
      <Card className="border border-slate-200">
        <CardContent className="p-5 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {stats.completionRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Completion Rate</div>
        </CardContent>
      </Card>
    </div>
  );
});
