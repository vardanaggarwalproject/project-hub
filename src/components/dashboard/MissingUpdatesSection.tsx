import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import type { MissingUpdate } from "@/types/report";
import { formatDisplayDate, getLocalDateString } from "@/lib/utils/date";

interface MissingUpdatesSectionProps {
  missingUpdates: MissingUpdate[];
  onOpenModal: (type: "memo" | "eod", projectId: string, date: string) => void;
}

/**
 * Dashboard section displaying missing updates (memos and EODs) from past days
 */
export const MissingUpdatesSection = React.memo(function MissingUpdatesSection({
  missingUpdates,
  onOpenModal,
}: MissingUpdatesSectionProps) {
  if (missingUpdates.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <h2 className="text-base font-semibold text-slate-900">
          Missing Updates
        </h2>
      </div>
      <Card className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-112.5 overflow-y-auto divide-y divide-slate-100 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-300">
          {missingUpdates.map((missing) => (
            <div
              key={missing.id}
              className="p-4 hover:bg-slate-50 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  {formatDisplayDate(missing.date).split(",")[0]} — {missing.projectName}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {missing.isUniversalMissing && (
                    <Badge 
                      variant="outline" 
                      className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] uppercase tracking-wider font-bold cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={() => onOpenModal("memo", missing.projectId, getLocalDateString(missing.date))}
                    >
                      Universal Memo
                    </Badge>
                  )}
                  {missing.isShortMissing && (
                    <Badge 
                      variant="outline" 
                      className="bg-rose-50 text-rose-600 border-rose-100 text-[10px] uppercase tracking-wider font-bold cursor-pointer hover:bg-rose-100 transition-colors"
                      onClick={() => onOpenModal("memo", missing.projectId, getLocalDateString(missing.date))}
                    >
                      140chars Memo
                    </Badge>
                  )}
                  {missing.isEodMissing && (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] uppercase tracking-wider font-bold cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => onOpenModal("eod", missing.projectId, getLocalDateString(missing.date))}
                    >
                      EOD Report
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="default"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                onClick={() => {
                  // If memo part is missing, open memo tab, else EOD
                  const type = (missing.isUniversalMissing || missing.isShortMissing) ? "memo" : "eod";
                  onOpenModal(type, missing.projectId, getLocalDateString(missing.date));
                }}
              >
                Add Update
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});
