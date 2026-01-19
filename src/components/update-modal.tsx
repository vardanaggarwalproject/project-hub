"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { AlertCircle, Copy, Clock, Calendar, Pencil, Trash2, X, Check } from "lucide-react";
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
  onDelete?: (
    type: "memo" | "eod",
    projectId: string,
    date: string
  ) => Promise<void>;
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
  onDelete,
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
  const [cachedReferenceData, setCachedReferenceData] = useState<Record<string, {type: string; content: string} | null>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Simplified logic to find the most recent previous update
  const previousUpdate = useMemo(() => {
    if (!selectedProjectId || !selectedDate) return null;

    const projectMemos = existingMemos
        .filter(m => m.projectId === selectedProjectId && getLocalDateString(m.reportDate) < selectedDate)
        .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

    const projectEods = existingEods
        .filter(e => e.projectId === selectedProjectId && getLocalDateString(e.reportDate) < selectedDate)
        .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

    if (modalTab === "memo") {
        if (projectMemos.length === 0) return null;
        
        const lastDate = getLocalDateString(projectMemos[0].reportDate);
        const dayMemos = projectMemos.filter(m => getLocalDateString(m.reportDate) === lastDate);
        
        return {
            date: lastDate,
            universal: dayMemos.find(m => m.memoType === 'universal')?.memoContent || 
                       (!projects.find(p => p.id === selectedProjectId)?.isMemoRequired ? dayMemos.find(m => m.memoType === 'short')?.memoContent : ""),
            short: dayMemos.find(m => m.memoType === 'short')?.memoContent || ""
        };
    } else {
        if (projectEods.length === 0) return null;
        return {
            date: getLocalDateString(projectEods[0].reportDate),
            client: projectEods[0].clientUpdate,
            internal: projectEods[0].actualUpdate
        };
    }
  }, [modalTab, selectedProjectId, selectedDate, existingMemos, existingEods, projects]);

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

  // Combined Effect to handle initialization
  useEffect(() => {
    if (!isOpen) {
        wasOpen.current = false;
        return;
    }

    const initializeModal = async () => {
      const isOpening = !wasOpen.current;
      wasOpen.current = true;

      const targetProjectId = isOpening ? initialProjectId : selectedProjectId;
      const targetDate = isOpening ? initialDate : selectedDate;
      const targetTab = isOpening ? initialTab : modalTab;

      const contextChanged = prevContext.current.projectId !== targetProjectId || 
                           prevContext.current.date !== targetDate;
      
      if (isOpening || contextChanged) {
        setIsLoading(true);
      }
      
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
        const cacheKey = `${targetProjectId}_${targetDate}_${targetTab}`;
        if (referenceDataFetcher && targetProjectId && targetDate) {
           if (!cachedReferenceData[cacheKey]) {
                const data = await referenceDataFetcher(
                    targetTab,
                    targetProjectId,
                    targetDate
                );
                setReferenceData(data);
                setCachedReferenceData(prev => ({ ...prev, [cacheKey]: data }));
           } else {
                setReferenceData(cachedReferenceData[cacheKey]);
           }
        }

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
            setLocalMode("edit");
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

            if (!draftFound && isOpening) {
                if (targetTab === "memo") {
                     setMemoContent(initialMemoContent);
                     setShortMemoContent(initialShortMemoContent);
                } else {
                     setClientUpdate(initialClientUpdate);
                     setInternalUpdate(initialInternalUpdate);
                }
            } 
            
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

        prevContext.current = { projectId: targetProjectId, date: targetDate };

      } catch (error) {
        console.error("Failed to initialize modal", error);
      } finally {
         setIsLoading(false);
      }
    };

    initializeModal();

  }, [isOpen, modalTab, selectedDate, selectedProjectId, existingMemos, existingEods, initialProjectId, initialDate, initialTab, initialMemoContent, initialShortMemoContent, initialClientUpdate, initialInternalUpdate, mode, referenceDataFetcher, isMemoRequired]);

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
    if (modalTab === "memo" && isMemoRequired && memoContent.length > 140) {
        toast.error(`This project requires a memo within 140 characters (maximum). Current: ${memoContent.length}/140`);
        return;
    }

    if (minDate && selectedDate && selectedDate < minDate) {
        toast.error(`Access Denied: You cannot submit updates for dates before your project allocation (${minDate}).`);
        return;
    }

    if (showDatePicker && selectedDate) {
        const isMemo = modalTab === "memo";
        
        const conflictExists = isMemo
            ? existingMemos.some(m => 
                m.projectId === selectedProjectId && 
                getLocalDateString(m.reportDate) === selectedDate
              )
            : existingEods.some(e => 
                e.projectId === selectedProjectId && 
                getLocalDateString(e.reportDate) === selectedDate
              );
            
        const isSameRecord = selectedDate === initialDate && modalTab === initialTab && selectedProjectId === initialProjectId;
        
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
      localStorage.removeItem(getDraftKey(selectedProjectId, selectedDate, "memo"));
      localStorage.removeItem(getDraftKey(selectedProjectId, selectedDate, "eod"));
      onClose();
    } catch (error) {
      console.error("Failed to submit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !selectedProjectId || !selectedDate) return;
    
    setIsDeleting(true);
    try {
      await onDelete(modalTab, selectedProjectId, selectedDate);
      toast.success(`${modalTab === "memo" ? "Memo" : "EOD Report"} deleted successfully`);
      onClose();
    } catch (error) {
      console.error("Failed to delete", error);
      toast.error("Failed to delete update");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

          {/* Action Row for View Mode */}
          {isViewMode && hasExistingRecord && !isLoading && (
            <div className="flex items-center justify-between px-1 mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Actions
                </span>
                <div className="h-px w-8 bg-slate-100" />
              </div>
              
              <div className="flex items-center gap-2">
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg p-1 animate-in zoom-in-95 duration-200">
                    <span className="text-[10px] font-bold text-red-600 px-2 uppercase">Confirm?</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                      title="Confirm Delete"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-8 w-8 text-slate-400 hover:bg-white hover:text-slate-600 rounded-md"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleInternalEditClick}
                      size="icon" 
                      className="h-9 w-9 rounded-lg border-blue-100 bg-blue-50/30 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                      title="Edit Entry"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="h-9 w-9 rounded-lg border-red-100 bg-red-50/30 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6 animate-in fade-in duration-300">
                <Skeleton className="h-28 w-full rounded-xl bg-slate-100" />
                <div className="space-y-2">
                     <Skeleton className="h-4 w-32 bg-slate-100" />
                     <Skeleton className="h-40 w-full rounded-xl bg-slate-100" />
                </div>
            </div>
          ) : (
            <>
              {previousUpdate === null && !isViewMode && (
                <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-5 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <AlertCircle className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 tracking-tight mb-1">Previous update not present</h4>
                        <p className="text-xs text-slate-500/90 leading-relaxed max-w-sm">
                            No history found for this project before {selectedDate}.
                        </p>
                    </div>
                </div>
              )}

              {referenceData && referenceData.type.toLowerCase().includes("reference") && (
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
                  {/* Universal Memo */}
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
                          className="h-7 px-2.5 text-[10px] font-semibold text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 hover:text-blue-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
                        >
                          <Copy className="h-3 w-3" />
                          Same as 140chars Memo
                        </Button>
                      )}
                    </div>
                    {previousUpdate && !isViewMode && (
                      <div className="mb-3 px-4 py-3 bg-blue-50/40 border border-blue-100/40 rounded-xl relative group transition-all hover:bg-blue-50/60 shadow-sm/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-blue-400" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                    Previous Universal Memo
                                </span>
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                                {previousUpdate.date}
                            </span>
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-normal italic pl-1 border-l-2 border-blue-100/50 ml-0.5">
                            "{previousUpdate.universal || "No content found"}"
                        </div>
                      </div>
                    )}
                    <Textarea
                      id="universal-memo"
                      value={memoContent}
                      onChange={(e) => setMemoContent(e.target.value)}
                      placeholder="Universal memo content for all team members..."
                      className="min-h-[150px] resize-none rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all p-4 leading-relaxed"
                      readOnly={isViewMode}
                    />
                  </div>

                  {/* 140 Char Memo */}
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
                                className="h-7 px-2.5 text-[10px] font-semibold text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 hover:text-blue-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
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
                      {previousUpdate && !isViewMode && (
                        <div className="mb-3 px-4 py-3 bg-blue-50/40 border border-blue-100/40 rounded-xl relative group transition-all hover:bg-blue-50/60 shadow-sm/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-blue-400" />
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                        Previous 140chars Memo
                                    </span>
                                </div>
                                <span className="text-[9px] font-semibold text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                                    {previousUpdate.date}
                                </span>
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal italic pl-1 border-l-2 border-blue-100/50 ml-0.5">
                                "{previousUpdate.short || "No content recorded"}"
                            </div>
                        </div>
                      )}
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
                  {/* Client Update */}
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
                            className="h-7 px-2.5 text-[10px] font-semibold text-purple-600 border-purple-100 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-200 hover:text-purple-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
                            >
                            <Copy className="h-3 w-3" />
                            Same as Internal Update
                            </Button>
                        )}
                    </div>
                    {previousUpdate && !isViewMode && (
                      <div className="mb-3 px-4 py-3 bg-purple-50/40 border border-purple-100/40 rounded-xl relative group transition-all hover:bg-purple-50/60 shadow-sm/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-purple-400" />
                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                                    Previous Client Update
                                </span>
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                                {previousUpdate.date}
                            </span>
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-normal italic pl-1 border-l-2 border-purple-100/50 ml-0.5">
                            "{previousUpdate.client || "No content recorded"}"
                        </div>
                      </div>
                    )}
                    <Textarea
                      id="client"
                      value={clientUpdate}
                      onChange={(e) => setClientUpdate(e.target.value)}
                      placeholder="Summary suitable for client review..."
                      className="min-h-[120px] rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition-all p-4 leading-relaxed"
                      readOnly={isViewMode}
                    />
                  </div>

                  {/* Internal Update */}
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
                            className="h-7 px-2.5 text-[10px] font-semibold text-purple-600 border-purple-100 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-200 hover:text-purple-700 transition-all rounded-md flex items-center gap-1.5 shadow-sm"
                            >
                            <Copy className="h-3 w-3" />
                            Same as Client Update
                            </Button>
                        )}
                    </div>
                    {previousUpdate && !isViewMode && (
                      <div className="mb-3 px-4 py-3 bg-purple-50/40 border border-purple-100/40 rounded-xl relative group transition-all hover:bg-purple-50/60 shadow-sm/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-purple-400" />
                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                                    Previous Internal Update
                                </span>
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                                {previousUpdate.date}
                            </span>
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-normal italic pl-1 border-l-2 border-purple-100/50 ml-0.5">
                            "{previousUpdate.internal || "No content recorded"}"
                        </div>
                      </div>
                    )}
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

        <DialogFooter className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-row items-center justify-end gap-3 sticky bottom-0 z-10 transition-all">
          <Button 
            variant="outline" 
            onClick={onClose} 
            size="default" 
            className="flex-1 sm:flex-initial h-10 rounded-lg border-slate-200 hover:bg-white hover:text-slate-700 font-medium"
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="default"
              className={cn(
                "flex-1 sm:flex-initial h-10 rounded-lg font-semibold shadow-md transition-all px-6",
                modalTab === "memo" 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200" 
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200"
              )}
            >
              {isSubmitting ? "Saving..." : (hasExistingRecord ? "Update Record" : "Save Update")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
