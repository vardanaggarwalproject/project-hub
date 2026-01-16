"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { UpdateModal } from "@/components/update-modal";
import { ErrorBoundary } from "@/components/error-boundary";
import { StatsCards } from "@/components/update-history/StatsCards";
import { CalendarHeader } from "@/components/update-history/CalendarHeader";
import { CalendarGrid } from "@/components/update-history/CalendarGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Project, ProjectAssignment } from "@/types/project";
import type { Memo, EOD, DayStatus } from "@/types/report";
import { getLocalDateString } from "@/lib/utils/date";
import { handleApiError } from "@/lib/utils/error-handler";
import { projectsApi, memosApi, eodsApi } from "@/lib/api/client";

interface ProjectHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
}

export function ProjectHistoryDialog({
  isOpen,
  onClose,
  projectId,
  userId,
}: ProjectHistoryDialogProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [userAssignment, setUserAssignment] = useState<ProjectAssignment | null>(
    null
  );
  const [memos, setMemos] = useState<Memo[]>([]);
  const [eods, setEods] = useState<EOD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [initialModalTab, setInitialModalTab] = useState<"memo" | "eod">(
    "memo"
  );
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [initialMemoContent, setInitialMemoContent] = useState("");
  const [initialShortMemoContent, setInitialShortMemoContent] = useState("");
  const [initialClientUpdate, setInitialClientUpdate] = useState("");
  const [initialInternalUpdate, setInitialInternalUpdate] = useState("");
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [selectedEOD, setSelectedEOD] = useState<EOD | null>(null);

  const fetchData = async () => {
    if (!userId || !projectId) return;

    setIsLoading(true);
    try {
      const [projectData, assignmentData, memosData, eodsData] = await Promise.all([
        projectsApi.getById(projectId),
        projectsApi.getAssignment(projectId, userId).catch(() => null),
        memosApi.getByFilters(userId, projectId, 1000, true),
        eodsApi.getByFilters(userId, projectId, 1000, true),
      ]);

      setProject(projectData);
      setUserAssignment(assignmentData);

      const allMemos = Array.isArray(memosData) ? memosData : [];
      const allEods = Array.isArray(eodsData) ? eodsData : [];

      setMemos(allMemos.filter(m => String(m.projectId) === String(projectId) && String(m.userId) === String(userId)));
      setEods(allEods.filter(e => String(e.projectId) === String(projectId) && String(e.userId) === String(userId)));
    } catch (error) {
      handleApiError(error, "Fetch project history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, userId, projectId]);

  const validStartDate = useMemo(() => {
    const assignedDate = userAssignment?.assignedAt ? new Date(userAssignment.assignedAt) : null;
    const lastActivatedDate = userAssignment?.lastActivatedAt ? new Date(userAssignment.lastActivatedAt) : null;
    const projectCreatedDate = project?.createdAt ? new Date(project.createdAt) : null;

    // Use lastActivatedDate if available, otherwise fallback to assignedDate or creationDate
    let validStart: Date;
    if (lastActivatedDate) {
      validStart = lastActivatedDate;
    } else if (assignedDate && projectCreatedDate) {
      validStart = assignedDate < projectCreatedDate ? assignedDate : projectCreatedDate;
    } else {
      validStart = assignedDate || projectCreatedDate || new Date();
    }

    validStart.setHours(0, 0, 0, 0);
    return validStart;
  }, [project, userAssignment, isLoading]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days: DayStatus[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthDays = eachDayOfInterval({ start, end });
    const firstDay = monthDays[0].getDay();
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      days.push({ date, hasMemo: false, hasEOD: false, isToday: false, isOtherMonth: true });
    }

    monthDays.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayMemos = memos.filter((m) => getLocalDateString(m.reportDate) === dateStr);
      const eod = eods.find((e) => getLocalDateString(e.reportDate) === dateStr);

      const hasUniversal = dayMemos.some(m => m.memoType === 'universal') || 
                         (!project?.isMemoRequired && dayMemos.some(m => m.memoType === 'short'));
      const hasShort = dayMemos.some(m => m.memoType === 'short');
      
      const hasMemo = hasUniversal && (!project?.isMemoRequired || hasShort);

      const dateTime = new Date(date);
      dateTime.setHours(0, 0, 0, 0);
      
      // A date is "valid for updates" only if it's after activation and before today
      // AND it's a weekday (Mon-Fri) OR there is existing data (to allow viewing history)
      const hasAnyData = dayMemos.length > 0 || !!eod;
      const isWeekend = dateTime.getDay() === 0 || dateTime.getDay() === 6;
      const isValidDate = hasAnyData || (dateTime >= validStartDate && dateTime <= today && !isWeekend);

      days.push({
        date,
        hasMemo,
        hasUniversal,
        hasShort,
        hasEOD: !!eod,
        isToday: isSameDay(date, new Date()),
        isOtherMonth: false,
        memo: dayMemos[0],
        eod,
        isValidDate,
      } as any);
    });

    const lastDay = monthDays[monthDays.length - 1].getDay();
    for (let i = 1; i <= 6 - lastDay; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      days.push({ date, hasMemo: false, hasEOD: false, isToday: false, isOtherMonth: true });
    }

    return days;
  }, [currentMonth, memos, eods, validStartDate, project]);

  const stats = useMemo(() => {
    const targetMonthStr = format(currentMonth, "yyyy-MM");
    const todayStr = getLocalDateString(new Date());
    const validStartStr = getLocalDateString(validStartDate);

    // Map<dateStr, {hasUniversal, hasShort}>
    const memoStatusMap = new Map<string, {uni: boolean, short: boolean}>();
    const uniqueEodDays = new Set<string>();

    memos.forEach(m => {
      const dateStr = getLocalDateString(m.reportDate);
      if (dateStr.startsWith(targetMonthStr) && dateStr <= todayStr) {
        if (!memoStatusMap.has(dateStr)) memoStatusMap.set(dateStr, {uni: false, short: false});
        const status = memoStatusMap.get(dateStr)!;
        if (m.memoType === 'universal') status.uni = true;
        if (m.memoType === 'short') status.short = true;
      }
    });

    eods.forEach(e => {
      const dateStr = getLocalDateString(e.reportDate);
      if (dateStr.startsWith(targetMonthStr) && dateStr <= todayStr) {
        uniqueEodDays.add(dateStr);
      }
    });

    // Count a day as "having memo" if all required types exist
    let memosThisMonth = 0;
    memoStatusMap.forEach((status, dateStr) => {
        const hasUniversal = status.uni || (!project?.isMemoRequired && status.short);
        const hasShort = status.short;
        if (hasUniversal && (!project?.isMemoRequired || hasShort)) {
            memosThisMonth++;
        }
    });

    const eodsThisMonth = uniqueEodDays.size;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Filter valid days (since start, until today) and EXCLUDE weekends
    const validDaysList = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((date) => {
      const dateStr = getLocalDateString(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      return dateStr >= validStartStr && dateStr <= todayStr && !isWeekend;
    });
    const validDaysCount = validDaysList.length;

    // Calculate completion rates separately for Memos and EODs
    const memoRate = validDaysCount > 0 ? (memosThisMonth / validDaysCount) : 0;
    const eodRate = validDaysCount > 0 ? (eodsThisMonth / validDaysCount) : 0;
    
    // Final completion rate is the average of Memo and EOD completion
    // This gives partial credit if only one is done
    const completionRate = Math.min(100, Math.round(((memoRate + eodRate) / 2) * 100));

    return {
      memosThisMonth,
      eodsThisMonth,
      completionRate,
    };
  }, [memos, eods, currentMonth, validStartDate, project]);

  const handleDayClick = (day: DayStatus, type: "memo" | "eod") => {
    if (day.isOtherMonth || isLoading) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasExistingUpdate = (type === "memo" && day.hasMemo) || (type === "eod" && day.hasEOD);

    if (day.date > today) {
      toast.error("Cannot add or view updates for future dates");
      return;
    }

    const hasAnyUpdate = day.hasMemo || day.hasEOD;

    if (!hasAnyUpdate && day.date < validStartDate) {
      toast.error(`Access Denied: You were assigned to this project on ${format(validStartDate, "MMM d, yyyy")}. You cannot add backdated updates.`);
      return;
    }

    if (!hasExistingUpdate && userAssignment && !userAssignment.isActive) {
      toast.error("Access Denied: This project is currently inactive for you. You cannot add new updates.");
      return;
    }

    setInitialDate(day.date);
    setInitialModalTab(type);

    if (type === "memo" && day.hasMemo) {
      const dateStr = format(day.date, "yyyy-MM-dd");
      const dayMemos = memos.filter(m => getLocalDateString(m.reportDate) === dateStr);
      
      const universal = dayMemos.find(m => m.memoType === 'universal') || 
                      (!project?.isMemoRequired ? dayMemos.find(m => m.memoType === 'short') : undefined);
      const short = dayMemos.find(m => m.memoType === 'short' && project?.isMemoRequired);
      
      setInitialMemoContent(universal?.memoContent || "");
      setInitialShortMemoContent(short?.memoContent || "");
      setSelectedMemo(universal || dayMemos[0] || null);
      setModalMode("view");
    } else if (type === "eod" && day.hasEOD && day.eod) {
      setSelectedEOD(day.eod);
      setInitialClientUpdate(day.eod.clientUpdate || "");
      setInitialInternalUpdate(day.eod.actualUpdate || "");
      setModalMode("view");
    } else {
      setSelectedMemo(null);
      setSelectedEOD(null);
      setInitialMemoContent("");
      setInitialShortMemoContent("");
      setInitialClientUpdate("");
      setInitialInternalUpdate("");
      setModalMode("edit");
    }

    setIsUpdateModalOpen(true);
  };

  const handleEditClick = () => {
    if (!initialDate) return;

    if (initialDate < validStartDate) {
      toast.error("This update is from before your allocation date and is Read-Only.");
      return;
    }

    if (userAssignment && !userAssignment.isActive) {
      toast.error("Access Denied: You cannot edit updates for an inactive project.");
      return;
    }
    setModalMode("edit");
  };

  const referenceDataFetcher = async (type: "memo" | "eod", pid: string, date: string) => {
    return null; // Dashboard optimization: use local data or skip
  };

  const handleSubmit = async (data: {
    type: "memo" | "eod";
    projectId: string;
    date: string;
    memoContent?: string;
    shortMemoContent?: string;
    clientUpdate?: string;
    internalUpdate?: string;
  }) => {
    try {
      if (data.type === "memo") {
        if (!data.memoContent?.trim()) {
          toast.error("Universal memo is required");
          return;
        }
        
        if (project?.isMemoRequired && !data.shortMemoContent?.trim()) {
            toast.error("140chars memo is required for this project");
            return;
        }

        const memoList = [];
        memoList.push({
            memoContent: data.memoContent,
            memoType: 'universal',
            projectId: data.projectId,
            userId,
            reportDate: data.date
        });

        if (project?.isMemoRequired && data.shortMemoContent) {
            memoList.push({
                memoContent: data.shortMemoContent,
                memoType: 'short',
                projectId: data.projectId,
                userId,
                reportDate: data.date
            });
        }

        await memosApi.create({
            memos: memoList,
            projectId: data.projectId,
            userId,
            reportDate: data.date
        });

        toast.success(`Memo saved successfully!`);
      } else {
        if (!data.internalUpdate?.trim()) {
          toast.error("Please enter internal update");
          return;
        }
        if (selectedEOD) {
          await eodsApi.update(selectedEOD.id, {
            clientUpdate: data.clientUpdate || "",
            actualUpdate: data.internalUpdate,
            projectId,
            userId,
            reportDate: data.date,
          });
        } else {
          await eodsApi.create({
            clientUpdate: data.clientUpdate || "",
            actualUpdate: data.internalUpdate,
            projectId,
            userId,
            reportDate: data.date,
          });
        }
        toast.success(`EOD ${selectedEOD ? "updated" : "saved"} successfully!`);
      }
      await fetchData();
    } catch (error) {
      handleApiError(error, "Submit update");
      throw error;
    }
  };;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3 text-slate-900">
            Update History <span className="text-slate-300 font-light">|</span> <span className="text-blue-600 font-semibold">{project?.name}</span>
            {userAssignment && !userAssignment.isActive && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 uppercase text-[10px] font-bold py-0.5 px-2">
                Inactive / Read-Only
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <ErrorBoundary>
              <div className="space-y-6">
                <StatsCards stats={stats} />
                <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                  <CalendarHeader
                    currentMonth={currentMonth}
                    projectName={project?.name}
                    onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  />
                  <CalendarGrid
                    calendarDays={calendarDays}
                    onDayClick={handleDayClick}
                  />
                </div>
              </div>
            </ErrorBoundary>
          )}
        </div>

        <UpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          projects={project ? [project] : []}
          mode={modalMode}
          onEditClick={handleEditClick}
          initialTab={initialModalTab}
          initialProjectId={projectId}
          initialDate={initialDate ? format(initialDate, "yyyy-MM-dd") : ""}
          minDate={userAssignment?.assignedAt ? format(new Date(userAssignment.assignedAt), "yyyy-MM-dd") : ""}
          initialMemoContent={initialMemoContent}
          initialShortMemoContent={initialShortMemoContent}
          initialClientUpdate={initialClientUpdate}
          initialInternalUpdate={initialInternalUpdate}
          onSubmit={handleSubmit}
          showDatePicker={true}
          maxDate={format(new Date(), "yyyy-MM-dd")}
          showProjectSelect={false}
          referenceDataFetcher={referenceDataFetcher}
          existingMemos={memos}
          existingEods={eods}
        />
      </DialogContent>
    </Dialog>
  );
}
