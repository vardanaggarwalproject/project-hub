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
              className="p-4 hover:bg-slate-50 transition-colors duration-150 grid md:grid-cols-[1fr_auto] gap-4 items-center"
            >
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium text-slate-900">
                  {formatDisplayDate(missing.date).split(",")[0]} -{" "}
                  {missing.projectName}
                </h3>
                <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">
                  {missing.type === "memo"
                    ? "Memo Not Submitted"
                    : "EOD Not Submitted"}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="border border-slate-200 hover:border-slate-300"
                onClick={() =>
                  onOpenModal(missing.type, missing.projectId, getLocalDateString(missing.date))
                }
              >
                Add Now
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});
