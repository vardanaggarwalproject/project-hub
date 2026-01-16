"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertCircle } from "lucide-react";
import type { Project } from "@/types/project";
import type { Memo, EOD } from "@/types/report";
import { MEMO_MAX_LENGTH } from "@/lib/constants";
import { toast } from "sonner";
import { getLocalDateString } from "@/lib/utils/date";

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
  existingMemos?: Memo[];
  existingEods?: EOD[];
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
  existingMemos = [],
  existingEods = [],
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
  const [isLoading, setIsLoading] = useState(false);

  // Get selected project details
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const isMemoRequired = selectedProject?.isMemoRequired || false;
  const MEMO_MIN_LENGTH = isMemoRequired ? 140 : 1;

  // Combined Effect to handle initialization (Data Fetching + Mode Determination)
  // Track previous open state to detect "Opening" transition
  const wasOpen = useRef(isOpen);

  // Combined Effect to handle initialization (Data Fetching + Mode Determination + State Sync)
  useEffect(() => {
    if (!isOpen) {
        wasOpen.current = false;
        return;
    }

    const initializeModal = async () => {
      setIsLoading(true);
      
      const isOpening = !wasOpen.current;
      wasOpen.current = true;

      // Determine Target Values (Props if just opened, State if already open)
      const targetProjectId = isOpening ? initialProjectId : selectedProjectId;
      const targetDate = isOpening ? initialDate : selectedDate;
      const targetTab = isOpening ? initialTab : modalTab;
      
      // If opening, sync state immediately
      if (isOpening) {
          setMemoContent(initialMemoContent);
          setClientUpdate(initialClientUpdate);
          setInternalUpdate(initialInternalUpdate);
          setModalTab(initialTab);
          setSelectedDate(initialDate);
          setSelectedProjectId(initialProjectId);
          setLocalMode(mode);
      }

      try {
        // 1. Fetch Reference Data (using targets)
        if (referenceDataFetcher && targetProjectId && targetDate) {
           const data = await referenceDataFetcher(
             targetTab,
             targetProjectId,
             targetDate
           );
           setReferenceData(data);
        }

        // 2. Determine Mode & Content
        const dateStr = targetDate; 
        let foundContent: { memo?: string; client?: string; internal?: string } | null = null;
        let exists = false;

        if (targetTab === "memo") {
            const match = existingMemos.find(m => m.projectId === targetProjectId && getLocalDateString(m.reportDate) === dateStr);
            if (match) {
                exists = true;
                foundContent = { memo: match.memoContent };
            }
        } else {
            const match = existingEods.find(e => e.projectId === targetProjectId && getLocalDateString(e.reportDate) === dateStr);
            if (match) {
                exists = true;
                foundContent = { client: match.clientUpdate, internal: match.actualUpdate };
            }
        }

        if (exists && foundContent) {
            setLocalMode("view");
            if (targetTab === "memo") {
                setMemoContent(foundContent.memo || "");
            } else {
                setClientUpdate(foundContent.client || "");
                setInternalUpdate(foundContent.internal || "");
            }
        } else {
            // Default to Edit mode (Add) and clear fields if switching context
            setLocalMode("edit");
            // Only clear content if we are NOT opening (if opening, we kept initialMemoContent above)
            // Or if we are opening but didn't find match?
            // Actually, if we are opening, we trust initialMemoContent unless we find a match that overrides it?
            // The logic: if match found, use match. If not found, use initial (which might be empty).
            // But if we switch tabs (not opening), we want to clear.
            
            if (!isOpening) {
                if (targetTab === "memo") {
                     setMemoContent("");
                } else {
                     setClientUpdate("");
                     setInternalUpdate("");
                }
            } else {
                // If opening and no match found, we stick with initialMemoContent (already set above)
            }
        }

      } catch (error) {
        console.error("Failed to initialize modal", error);
      } finally {
         setTimeout(() => setIsLoading(false), 300);
      }
    };

    initializeModal();

  }, [isOpen, modalTab, selectedDate, selectedProjectId, existingMemos, existingEods, initialProjectId, initialDate, initialTab, initialMemoContent, initialClientUpdate, initialInternalUpdate, mode, referenceDataFetcher]); // Dependencies might trigger re-runs, which is fine, it will show loading briefly

  // Remove the old separate useEffects by replacing them with this one block.
  // Note: I will need to target the lines carefully to replace BOTH old effects.
  
  // RENDER LOGIC UPDATE:
  // Inside the main content div:
  
  /* 
  <div className="flex-1 overflow-y-auto p-5 space-y-4">
     {isLoading ? (
       <div className="space-y-4 animate-in fade-in duration-300">
         <Skeleton className="h-10 w-full rounded-lg bg-slate-100" />
         {showProjectSelect && <Skeleton className="h-10 w-full rounded-lg bg-slate-100" />}
         {showDatePicker && <Skeleton className="h-10 w-full rounded-lg bg-slate-100" />}
         <Skeleton className="h-24 w-full rounded-lg bg-slate-100" />
         <Skeleton className="h-32 w-full rounded-lg bg-slate-100" />
       </div>
     ) : (
        ... existing form content ...
     )}
  </div>
  */

  // Handle Edit Click (Internal)
  const handleInternalEditClick = () => {
    const dateStr = selectedDate;
    let exists = false;
    
    if (modalTab === "memo") {
        exists = existingMemos.some(m => m.projectId === selectedProjectId && getLocalDateString(m.reportDate) === dateStr);
    } else {
        exists = existingEods.some(e => e.projectId === selectedProjectId && getLocalDateString(e.reportDate) === dateStr);
    }

    if (exists) {
        setLocalMode("edit");
    } else {
        toast.error("Not editable because not present");
    }
  };

  const handleSubmit = async () => {
    // Validate memo minimum length for projects that require 140 chars
    if (modalTab === "memo" && isMemoRequired && memoContent.length < 140) {
        toast.error(`This project requires a detailed memo (minimum 140 characters). Current: ${memoContent.length}/140`);
        return;
    }

    // Authority check for date manually entered or selected
    if (minDate && selectedDate && selectedDate < minDate) {
        toast.error(`Access Denied: You cannot submit updates for dates before your project allocation (${minDate}).`);
        return;
    }

    if (showDatePicker && selectedDate) {
        const isEditingSameEntry = 
            initialDate === selectedDate && 
            initialTab === modalTab && 
            initialProjectId === selectedProjectId &&
            localMode === mode; // mode check might be needed if switching view->edit without re-init

        // However, localMode switches to 'edit' when editing. 
        // We know we are 'updating' if we started with some content OR if we were in view mode initially.
        // Better check: If we are editing an EXISTING entry, we are allowed to save *to that same date*.
        // If we change the date, we must check if the NEW date is free.
        
        // A conflict exists if there is an entry for the SELECTED date AND SELECTED project, 
        // AND it's NOT the same record instance we are editing.

        const isMemo = modalTab === "memo";
        
        // Find ANY entry that matches the target criteria
        const conflictExists = isMemo
            ? existingMemos.some(m => 
                m.projectId === selectedProjectId && 
                getLocalDateString(m.reportDate) === selectedDate
              )
            : existingEods.some(e => 
                e.projectId === selectedProjectId && 
                getLocalDateString(e.reportDate) === selectedDate
              );
            
        // Check if we are editing the SAME record (heuristically)
        const isSameRecord = selectedDate === initialDate && modalTab === initialTab && selectedProjectId === initialProjectId;
        
        // If conflict exists and we switched context (date/type/project), we must block.
        if (conflictExists && !isSameRecord) {
             toast.error(`A ${modalTab === "memo" ? "Memo" : "EOD Report"} already exists for this date. Please edit that entry instead.`);
             return;
        }
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
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[85vh] flex flex-col gap-0 p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10 select-none">
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                {isViewMode
                  ? modalTab === "memo"
                    ? "View Memo"
                    : "View EOD Report"
                  : modalTab === "memo"
                    ? "Add Daily Memo"
                    : "Submit EOD Report"}
              </DialogTitle>
            </div>
            {/* Edit button moved to footer */}
          </div>
          <DialogDescription className="sr-only">
            Submit your {modalTab === "memo" ? "daily memo" : "end of day report"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {isLoading ? (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex gap-4 mb-2">
                    <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
                    <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    {showProjectSelect && (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20 bg-slate-100" />
                            <Skeleton className="h-11 w-full rounded-lg bg-slate-100" />
                        </div>
                    )}
                    {showDatePicker && (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16 bg-slate-100" />
                            <Skeleton className="h-11 w-full rounded-lg bg-slate-100" />
                        </div>
                    )}
                </div>
                
                <Skeleton className="h-28 w-full rounded-xl bg-slate-100" />
                
                <div className="space-y-2">
                     <Skeleton className="h-4 w-32 bg-slate-100" />
                     <Skeleton className="h-40 w-full rounded-xl bg-slate-100" />
                </div>
            </div>
          ) : (
            <>
          <Tabs
            value={modalTab}
            onValueChange={(val) => setModalTab(val as "memo" | "eod")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 p-1 rounded-lg h-10">
              <TabsTrigger 
                value="memo" 
                className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                Daily Memo
              </TabsTrigger>
              <TabsTrigger 
                value="eod" 
                className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all"
              >
                EOD Report
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {showProjectSelect && (
                <div className="space-y-1.5">
                  <Label htmlFor="project" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-0.5">
                    Project
                  </Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger id="project" className="w-full h-9 rounded-lg border-slate-200 bg-white focus:bg-white transition-colors text-sm shadow-sm">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="rounded-lg shadow-lg border-slate-100">
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id} className="cursor-pointer py-2.5 focus:bg-slate-50 text-sm">
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showDatePicker && (
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-0.5">
                    Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      id="date"
                      type="date"
                      value={selectedDate}
                      max={maxDate}
                      min={minDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}
          </div>

          {referenceData && (
            <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">ℹ️</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {referenceData.type}
                    </span>
                </div>
              <div className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-wrap max-h-40 overflow-y-auto pl-1">
                {referenceData.content}
              </div>
            </div>
          )}

          {isMemoRequired && !isViewMode && modalTab === "memo" && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800">
                <strong>Detailed Memo Required:</strong> This project requires a minimum of 140 characters in your memo.
              </AlertDescription>
            </Alert>
          )}

          {modalTab === "memo" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="memo" className="text-sm font-semibold text-slate-700 ml-1">
                    What are you working on today?
                </Label>
                <span className={`text-xs font-normal ${
                  isMemoRequired && memoContent.length < 140 && !isViewMode ? "text-amber-600 font-medium" : "text-slate-400"
                }`}>
                    {memoContent.length}/{MEMO_MAX_LENGTH}
                    {isMemoRequired && !isViewMode && (
                      <span className="ml-1">
                        (min: {MEMO_MIN_LENGTH})
                        {memoContent.length < 140 && (
                          <span className="ml-1 text-amber-600">⚠ {140 - memoContent.length} more</span>
                        )}
                      </span>
                    )}
                </span>
              </div>
              <Textarea
                id="memo"
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value.slice(0, MEMO_MAX_LENGTH))}
                placeholder={
                  isMemoRequired && !isViewMode
                    ? "• Provide detailed overview of tasks (min 140 chars)...&#10;• Meetings planned...&#10;• Blockers..."
                    : "• List your key tasks...&#10;• Meetings planned...&#10;• Blockers..."
                }
                className={`min-h-[200px] resize-none rounded-lg bg-slate-50/30 focus:bg-white focus:ring-2 transition-all p-4 leading-relaxed ${
                  isMemoRequired && memoContent.length < 140 && !isViewMode
                    ? "border-amber-300 focus:ring-amber-500/10"
                    : "border-slate-200 focus:ring-blue-500/10"
                }`}
                maxLength={MEMO_MAX_LENGTH}
                readOnly={isViewMode}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="client" className="text-sm font-semibold text-slate-700 ml-1">
                  Client Update
                </Label>
                <Textarea
                  id="client"
                  value={clientUpdate}
                  onChange={(e) => setClientUpdate(e.target.value)}
                  placeholder="Summary suitable for client review..."
                  className="min-h-[120px] rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition-all p-4 leading-relaxed"
                  readOnly={isViewMode}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="internal" className="text-sm font-semibold text-slate-700 ml-1">
                  Internal Update
                </Label>
                <Textarea
                  id="internal"
                  value={internalUpdate}
                  onChange={(e) => setInternalUpdate(e.target.value)}
                  placeholder="Detailed technical update for the team..."
                  className="min-h-[120px] rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition-all p-4 leading-relaxed"
                  readOnly={isViewMode}
                />
              </div>
            </div>
          )}
          </>
          )}
        </div>

        <DialogFooter className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-row justify-end gap-3 sticky bottom-0 z-10">
          <Button 
            variant="outline" 
            onClick={handleInternalEditClick}
            size="default" 
            className="flex-1 sm:flex-initial rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 text-slate-600"
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            size="default" 
            className="flex-1 sm:flex-initial rounded-lg border-slate-200 hover:bg-white hover:text-slate-700"
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="default"
              className="flex-1 sm:flex-initial rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md transition-all"
            >
              {isSubmitting ? "Saving..." : "Save Update"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
