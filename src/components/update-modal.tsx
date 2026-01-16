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
import { Calendar, Copy } from "lucide-react";
import type { Project } from "@/types/project";
import type { Memo, EOD } from "@/types/report";
import { MEMO_MAX_LENGTH } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  initialShortMemoContent?: string;
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
    shortMemoContent?: string;
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
  initialShortMemoContent = "",
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
  const [shortMemoContent, setShortMemoContent] = useState(initialShortMemoContent);
  const [clientUpdate, setClientUpdate] = useState(initialClientUpdate);
  const [internalUpdate, setInternalUpdate] = useState(initialInternalUpdate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceData, setReferenceData] = useState<{
    type: string;
    content: string;
  } | null>(null);
  const [localMode, setLocalMode] = useState<"view" | "edit">(mode);
  const [isLoading, setIsLoading] = useState(false);

  // Helper for localStorage keys
  const getDraftKey = (projectId: string, date: string, type: "memo" | "eod") => 
    `update_draft_${projectId}_${date}_${type}`;

  // Get selected project info
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const isMemoRequired = selectedProject?.isMemoRequired;

  // Track previous open state and context to detect transitions
  const wasOpen = useRef(isOpen);
  const prevContext = useRef({ projectId: selectedProjectId, date: selectedDate });

  // Persistence: Save drafts as user types
  useEffect(() => {
    if (!isOpen || localMode === "view" || !selectedProjectId || !selectedDate) return;

    const saveDraft = () => {
      if (modalTab === "memo") {
        const key = getDraftKey(selectedProjectId, selectedDate, "memo");
        if (memoContent || shortMemoContent) {
          localStorage.setItem(key, JSON.stringify({ memoContent, shortMemoContent }));
        } else {
          localStorage.removeItem(key);
        }
      } else {
        const key = getDraftKey(selectedProjectId, selectedDate, "eod");
        if (clientUpdate || internalUpdate) {
          localStorage.setItem(key, JSON.stringify({ clientUpdate, internalUpdate }));
        } else {
          localStorage.removeItem(key);
        }
      }
    };

    saveDraft();
  }, [memoContent, shortMemoContent, clientUpdate, internalUpdate, selectedProjectId, selectedDate, modalTab, localMode, isOpen]);

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
          setShortMemoContent(initialShortMemoContent);
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
        let foundContent: { memo?: string; shortMemo?: string; client?: string; internal?: string } | null = null;
        let exists = false;

        if (targetTab === "memo") {
            const matches = existingMemos.filter(m => m.projectId === targetProjectId && getLocalDateString(m.reportDate) === dateStr);
            if (matches.length > 0) {
                exists = true;
                const universal = matches.find(m => m.memoType === 'universal') || matches.find(m => m.memoType === 'short' && !isMemoRequired);
                const short = matches.find(m => m.memoType === 'short' && isMemoRequired);
                foundContent = { 
                    memo: universal?.memoContent,
                    shortMemo: short?.memoContent
                };
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
                setShortMemoContent(foundContent.shortMemo || "");
            } else {
                setClientUpdate(foundContent.client || "");
                setInternalUpdate(foundContent.internal || "");
            }
        } else {
            // Default to Edit mode (Add)
            setLocalMode("edit");
            
            // 3. Try to Load Draft from localStorage
            const draftKey = getDraftKey(targetProjectId, targetDate, targetTab);
            const savedDraft = localStorage.getItem(draftKey);
            let draftFound = false;

            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    if (targetTab === "memo") {
                        setMemoContent(draft.memoContent || "");
                        setShortMemoContent(draft.shortMemoContent || "");
                    } else {
                        setClientUpdate(draft.clientUpdate || "");
                        setInternalUpdate(draft.internalUpdate || "");
                    }
                    draftFound = true;
                } catch (e) {
                    console.error("Failed to parse draft", e);
                }
            }

            // 4. Initial content from props (only if just opening and no draft)
            if (!draftFound && isOpening) {
                if (targetTab === "memo") {
                     setMemoContent(initialMemoContent);
                     setShortMemoContent(initialShortMemoContent);
                } else {
                     setClientUpdate(initialClientUpdate);
                     setInternalUpdate(initialInternalUpdate);
                }
            } 
            
            // 5. Clear if context (Project or Date) changed and no draft/initial content
            if (!draftFound && !isOpening) {
                const contextChanged = prevContext.current.projectId !== targetProjectId || 
                                     prevContext.current.date !== targetDate;
                
                if (contextChanged) {
                    if (targetTab === "memo") {
                         setMemoContent("");
                         setShortMemoContent("");
                    } else {
                         setClientUpdate("");
                         setInternalUpdate("");
                    }
                }
            }
        }

        // Update prevContext after processing
        prevContext.current = { projectId: targetProjectId, date: targetDate };

      } catch (error) {
        console.error("Failed to initialize modal", error);
      } finally {
         setTimeout(() => setIsLoading(false), 300);
      }
    };

    initializeModal();

  }, [isOpen, modalTab, selectedDate, selectedProjectId, existingMemos, existingEods, initialProjectId, initialDate, initialTab, initialMemoContent, initialShortMemoContent, initialClientUpdate, initialInternalUpdate, mode, referenceDataFetcher, isMemoRequired]);

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
    // Authority check for date manually entered or selected
    if (minDate && selectedDate && selectedDate < minDate) {
        toast.error(`Access Denied: You cannot submit updates for dates before your project allocation (${minDate}).`);
        return;
    }

    if (showDatePicker && selectedDate) {
        const isMemo = modalTab === "memo";
        
        // Find ANY entry that matches the target criteria
        // For memos, we now might have multiple. Conflict if ANY exist for a DIFFERENT context?
        // Actually, if ANY exists, we are "editing" or "switching".
        
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
        shortMemoContent,
        clientUpdate,
        internalUpdate,
      });
      // Clear drafts on success
      localStorage.removeItem(getDraftKey(selectedProjectId, selectedDate, "memo"));
      localStorage.removeItem(getDraftKey(selectedProjectId, selectedDate, "eod"));
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

  const hasExistingRecord = modalTab === "memo"
    ? existingMemos.some(m => m.projectId === selectedProjectId && getLocalDateString(m.reportDate) === selectedDate)
    : existingEods.some(e => e.projectId === selectedProjectId && getLocalDateString(e.reportDate) === selectedDate);

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
                  : (hasExistingRecord ? "Edit " : "Add ") + (modalTab === "memo" ? "Daily Memo" : "EOD Report")}
              </DialogTitle>
            </div>
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

          {modalTab === "memo" ? (
            <div className="space-y-6">
              {/* Universal Memo - Required for all */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="universal-memo" className="text-sm font-semibold text-slate-700 ml-1">
                      Universal Memo (Required)
                  </Label>
                  {!isViewMode && isMemoRequired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMemoContent(shortMemoContent)}
                      className="h-7 px-2.5 text-[11px] font-semibold text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 hover:text-blue-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
                    >
                      <Copy className="h-3 w-3" />
                      Same as 140chars Memo
                    </Button>
                  )}
                </div>
                <Textarea
                  id="universal-memo"
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  placeholder="Universal memo content for all team members..."
                  className="min-h-[150px] resize-none rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all p-4 leading-relaxed"
                  readOnly={isViewMode}
                />
              </div>

              {/* 140 Char Memo - Only if project requires it */}
              {isMemoRequired && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="short-memo" className="text-sm font-semibold text-slate-700 ml-1">
                            140chars Memo (Required for this project)
                        </Label>
                        {!isViewMode && (
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShortMemoContent(memoContent.slice(0, 140))}
                            className="h-7 px-2.5 text-[11px] font-semibold text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 hover:text-blue-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
                            >
                            <Copy className="h-3 w-3" />
                            Same as Universal Memo
                            </Button>
                        )}
                    </div>
                    <span className={cn(
                        "text-xs font-normal",
                        shortMemoContent.length > MEMO_MAX_LENGTH ? "text-red-500" : "text-slate-400"
                    )}>
                        {shortMemoContent.length}/{MEMO_MAX_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    id="short-memo"
                    value={shortMemoContent}
                    onChange={(e) => setShortMemoContent(e.target.value.slice(0, 140))}
                    placeholder="Short 140char summary..."
                    className="min-h-[100px] resize-none rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all p-4 leading-relaxed"
                    maxLength={140}
                    readOnly={isViewMode}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="client" className="text-sm font-semibold text-slate-700 ml-1">
                    Client Update
                    </Label>
                    {!isViewMode && (
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClientUpdate(internalUpdate)}
                        className="h-7 px-2.5 text-[11px] font-semibold text-purple-600 border-purple-100 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-200 hover:text-purple-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
                        >
                        <Copy className="h-3 w-3" />
                        Same as Internal Update
                        </Button>
                    )}
                </div>
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
                <div className="flex items-center justify-between">
                    <Label htmlFor="internal" className="text-sm font-semibold text-slate-700 ml-1">
                    Internal Update
                    </Label>
                    {!isViewMode && (
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInternalUpdate(clientUpdate)}
                        className="h-7 px-2.5 text-[11px] font-semibold text-purple-600 border-purple-100 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-200 hover:text-purple-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
                        >
                        <Copy className="h-3 w-3" />
                        Same as Client Update
                        </Button>
                    )}
                </div>
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

        <DialogFooter className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-row justify-end gap-3 sticky bottom-0 z-10 transition-all">
          {isViewMode && hasExistingRecord && (
            <Button 
              variant="outline" 
              onClick={handleInternalEditClick}
              size="default" 
              className="flex-1 sm:flex-initial rounded-lg border-blue-200 hover:bg-blue-50 hover:text-blue-700 text-blue-600 font-medium"
            >
              Edit
            </Button>
          )}
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
