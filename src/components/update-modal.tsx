"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import type { Project } from "@/types/project";
import { MEMO_MAX_LENGTH } from "@/lib/constants";
import { toast } from "sonner";

/**
 * Props for UpdateModal component
 */
interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  showDatePicker?: boolean;
  maxDate?: string;
  minDate?: string;
  showProjectSelect?: boolean;
  mode?: "view" | "edit";
  onEditClick?: () => void;
  initialTab?: "memo" | "eod";
  initialProjectId?: string;
  initialDate?: string;
  initialMemoContent?: string;
  initialClientUpdate?: string;
  initialInternalUpdate?: string;
  referenceDataFetcher?: (
    type: "memo" | "eod",
    projectId: string,
    date: string
  ) => Promise<{ type: string; content: string } | null>;
  onSubmit: (data: {
    type: "memo" | "eod";
    projectId: string;
    date: string;
    memoContent?: string;
    clientUpdate?: string;
    internalUpdate?: string;
  }) => Promise<void>;
}

/**
 * Modal component for submitting and viewing daily memos and EOD reports
 * Supports both view and edit modes, with reference data display
 */
export function UpdateModal({
  isOpen,
  onClose,
  projects,
  showDatePicker = false,
  maxDate,
  minDate,
  showProjectSelect = true,
  mode = "edit",
  onEditClick,
  initialTab = "memo",
  initialProjectId = "",
  initialDate = "",
  initialMemoContent = "",
  initialClientUpdate = "",
  initialInternalUpdate = "",
  referenceDataFetcher,
  onSubmit,
}: UpdateModalProps) {
  const [modalTab, setModalTab] = useState<"memo" | "eod">(initialTab);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [memoContent, setMemoContent] = useState(initialMemoContent);
  const [clientUpdate, setClientUpdate] = useState(initialClientUpdate);
  const [internalUpdate, setInternalUpdate] = useState(initialInternalUpdate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceData, setReferenceData] = useState<{
    type: string;
    content: string;
  } | null>(null);
  const [localMode, setLocalMode] = useState<"view" | "edit">(mode);

  useEffect(() => {
    if (!isOpen || !referenceDataFetcher || !selectedProjectId || !selectedDate)
      return;

    const fetchReference = async () => {
      try {
        const data = await referenceDataFetcher(
          modalTab,
          selectedProjectId,
          selectedDate
        );
        setReferenceData(data);
      } catch (error) {
        console.error("Failed to fetch reference data", error);
      }
    };

    fetchReference();
  }, [
    isOpen,
    modalTab,
    selectedDate,
    selectedProjectId,
    referenceDataFetcher,
    localMode,
  ]);

  useEffect(() => {
    if (isOpen) {
      setMemoContent(initialMemoContent);
      setClientUpdate(initialClientUpdate);
      setInternalUpdate(initialInternalUpdate);
      setModalTab(initialTab);
      setSelectedDate(initialDate);
      setSelectedProjectId(initialProjectId);
      setLocalMode(mode);
    }
  }, [
    isOpen,
    initialMemoContent,
    initialClientUpdate,
    initialInternalUpdate,
    initialTab,
    initialDate,
    initialProjectId,
    mode,
  ]);

  const handleSubmit = async () => {
    // Authority check for date manually entered or selected
    if (minDate && selectedDate && selectedDate < minDate) {
        toast.error(`Access Denied: You cannot submit updates for dates before your project allocation (${minDate}).`);
        return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: modalTab,
        projectId: selectedProjectId,
        date: selectedDate,
        memoContent,
        clientUpdate,
        internalUpdate,
      });
      // Only close if submission was successful (no error thrown)
      onClose();
    } catch (error) {
      // Error is already handled by parent component
      console.error("Failed to submit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isViewMode = localMode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-140 max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle className="text-base font-semibold">
                {isViewMode
                  ? modalTab === "memo"
                    ? "View Memo"
                    : "View EOD Report"
                  : modalTab === "memo"
                    ? "Add Memo"
                    : "Add EOD Report"}
              </DialogTitle>
            </div>
            {isViewMode && onEditClick && (
              <Button variant="ghost" size="sm" onClick={onEditClick}>
                Edit
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">
            Submit your {modalTab === "memo" ? "daily memo" : "end of day report"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isViewMode && (
            <>
              <Tabs
                value={modalTab}
                onValueChange={(val) => setModalTab(val as "memo" | "eod")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
                  <TabsTrigger value="memo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Memo
                  </TabsTrigger>
                  <TabsTrigger value="eod" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    EOD Report
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {showProjectSelect && (
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-medium">
                    Project
                  </Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger id="project" className="w-full">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showDatePicker && modalTab === "eod" && (
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">
                    Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="date"
                      type="date"
                      value={selectedDate}
                      max={maxDate}
                      min={minDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {referenceData && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">
                    📋 {referenceData.type} (for reference)
                  </span>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {referenceData.content}
                  </div>
                </div>
              )}
            </>
          )}

          {isViewMode && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
              {modalTab === "memo" ? (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    📝 Memo
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">
                    {memoContent || "No content"}
                  </div>
                </div>
              ) : (
                <>
                  {clientUpdate && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        📤 Client Update
                      </div>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap">
                        {clientUpdate}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      🔧 Internal Update
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {internalUpdate || "No content"}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!isViewMode && (
            <>
              {modalTab === "memo" ? (
                <div className="space-y-2">
                  <Label htmlFor="memo" className="text-sm font-medium">
                    What are you working on today?
                  </Label>
                  <Textarea
                    id="memo"
                    value={memoContent}
                    onChange={(e) => setMemoContent(e.target.value.slice(0, MEMO_MAX_LENGTH))}
                    placeholder="Brief overview of your tasks for today..."
                    className="min-h-25 resize-none"
                    maxLength={MEMO_MAX_LENGTH}
                  />
                  <div className="text-xs text-right text-slate-400">
                    {memoContent.length}/{MEMO_MAX_LENGTH}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client" className="text-sm font-medium">
                      Client Update
                    </Label>
                    <Textarea
                      id="client"
                      value={clientUpdate}
                      onChange={(e) => setClientUpdate(e.target.value)}
                      placeholder="Summary suitable for client review..."
                      className="min-h-25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internal" className="text-sm font-medium">
                      Internal Update
                    </Label>
                    <Textarea
                      id="internal"
                      value={internalUpdate}
                      onChange={(e) => setInternalUpdate(e.target.value)}
                      placeholder="Detailed technical update for the team..."
                      className="min-h-25"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="p-5 pt-3 border-t border-slate-100 flex-row gap-2">
          <Button variant="ghost" onClick={onClose} size="sm" className="flex-1 sm:flex-initial">
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : "Save Update"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
