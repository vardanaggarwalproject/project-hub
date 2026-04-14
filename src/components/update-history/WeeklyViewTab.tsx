"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, CheckCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyEOD {
  id: string;
  projectId: string;
  userId: string;
  clientUpdate: string | null;
  actualUpdate: string | null;
  reportDate: Date;
  createdAt: Date;
  projectName: string;
  userName: string;
}

interface WeeklyViewTabProps {
  projectId: string;
  userId: string;
  projectName?: string;
}

export function WeeklyViewTab({
  projectId,
  userId,
  projectName,
}: WeeklyViewTabProps) {
  const [eods, setEods] = useState<WeeklyEOD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [formattedText, setFormattedText] = useState("");

  useEffect(() => {
    fetchWeeklyEods();
  }, [projectId, userId]);

  const fetchWeeklyEods = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/eods/weekly?projectId=${projectId}&userId=${userId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weekly EODs");
      }

      const result = await response.json();
      const eodsData = result.data || [];

      // Convert date strings to Date objects
      const processedEods = eodsData.map((eod: any) => ({
        ...eod,
        reportDate: new Date(eod.reportDate),
        createdAt: new Date(eod.createdAt),
      }));

      setEods(processedEods);

      // Format the text
      const formatted = formatEodsText(processedEods, projectName);
      setFormattedText(formatted);
    } catch (error) {
      console.error("Error fetching weekly EODs:", error);
      toast.error("Failed to fetch weekly EODs");
    } finally {
      setIsLoading(false);
    }
  };

  const formatEodsText = (eodsData: WeeklyEOD[], projName?: string) => {
    if (eodsData.length === 0) {
      return "No EODs submitted for this week yet.";
    }

    return eodsData
      .map((eod) => {
        const dateStr = format(new Date(eod.reportDate), "dd-MM-yyyy");
        const eodContent = eod.clientUpdate || "No update provided";

        return `Date: ${dateStr}\n${eodContent}`;
      })
      .join("\n\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setIsCopied(true);
      toast.success("Copied to clipboard!");

      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Current Week's EODs
          </h3>
        </div>

        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 transition-all",
            isCopied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 hover:bg-slate-50",
          )}
        >
          {isCopied ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy All
            </>
          )}
        </Button>
      </div>

      {/* Info text */}
      <p className="text-sm text-muted-foreground">
        Showing EODs from Monday to today for this project. Only submitted EODs
        are displayed.
      </p>

      {/* Formatted EODs Display */}
      <div className="relative">
        <textarea
          value={formattedText}
          onChange={(e) => {
            setFormattedText(e.target.value);
          }}
          className="w-full min-h-90 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="No EODs submitted for this week yet."
        />
      </div>

      {/* Stats */}
      {eods.length > 0 && (
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Total EODs:</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
              {eods.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Latest:</span>
            <span className="text-slate-600">
              {format(
                new Date(eods[eods.length - 1].reportDate),
                "MMM d, yyyy",
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
