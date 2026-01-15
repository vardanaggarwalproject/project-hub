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
        memosApi.getByFilters(userId, projectId, 1000),
        eodsApi.getByFilters(userId, projectId, 1000),
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
    // Standardize: Earlier of assignment and project creation
    // This ensure we catch all days the user might be responsible for
    const assignedDate = userAssignment?.assignedAt ? new Date(userAssignment.assignedAt) : null;
    const projectCreatedDate = project?.createdAt ? new Date(project.createdAt) : null;

    let validStart: Date;
    if (assignedDate && projectCreatedDate) {
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
      const memo = memos.find((m) => getLocalDateString(m.reportDate) === dateStr);
      const eod = eods.find((e) => getLocalDateString(e.reportDate) === dateStr);

      const dateTime = new Date(date);
      dateTime.setHours(0, 0, 0, 0);
      // Valid date for "Missing/Pending" indicators ONLY if project is active
      const isValidDate = dateTime >= validStartDate &&
        dateTime <= today &&
        (userAssignment ? userAssignment.isActive : true);

      days.push({
        date,
        hasMemo: !!memo,
        hasEOD: !!eod,
        isToday: isSameDay(date, new Date()),
        isOtherMonth: false,
        memo,
        eod,
        isValidDate,
      } as DayStatus & { isValidDate: boolean });
    });

    const lastDay = monthDays[monthDays.length - 1].getDay();
    for (let i = 1; i <= 6 - lastDay; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      days.push({ date, hasMemo: false, hasEOD: false, isToday: false, isOtherMonth: true });
    }

    return days;
  }, [currentMonth, memos, eods, validStartDate]);

  const stats = useMemo(() => {
    // Current month/year for filtering
    const targetMonthStr = format(currentMonth, "yyyy-MM");

    // Today's date string for range capping
    const todayStr = getLocalDateString(new Date());
    const validStartStr = getLocalDateString(validStartDate);

    // Use Sets to count unique days with updates (ignoring legacy duplicates)
    const uniqueMemoDays = new Set<string>();
    const uniqueEodDays = new Set<string>();

    memos.forEach(m => {
      const dateStr = getLocalDateString(m.reportDate);
      if (dateStr.startsWith(targetMonthStr) && dateStr <= todayStr) {
        uniqueMemoDays.add(dateStr);
      }
    });

    eods.forEach(e => {
      const dateStr = getLocalDateString(e.reportDate);
      if (dateStr.startsWith(targetMonthStr) && dateStr <= todayStr) {
        uniqueEodDays.add(dateStr);
      }
    });

    const memosThisMonth = uniqueMemoDays.size;
    const eodsThisMonth = uniqueEodDays.size;

    // Count theoretical working days in this month within assignment period
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const validDaysList = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((date) => {
      const dateStr = getLocalDateString(date);
      return dateStr >= validStartStr && dateStr <= todayStr;
    });
    const validDaysCount = validDaysList.length;

    // Completion rate refinement:
    // If project isMemoRequired: day is complete if BOTH uniqueMemoDays and uniqueEodDays have it.
    // If not isMemoRequired: day is complete if uniqueEodDays has it.
    let completedDaysCount = 0;
    validDaysList.forEach(day => {
      const dateStr = getLocalDateString(day);
      const hasMemo = uniqueMemoDays.has(dateStr);
      const hasEod = uniqueEodDays.has(dateStr);

      if (project?.isMemoRequired) {
        if (hasMemo && hasEod) completedDaysCount++;
      } else {
        if (hasEod) completedDaysCount++;
      }
    });

    const completionRate = validDaysCount > 0
      ? Math.min(100, Math.round((completedDaysCount / validDaysCount) * 100))
      : 0;

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

    // If it's a future date, block everything
    if (day.date > today) {
      toast.error("Cannot add or view updates for future dates");
      return;
    }

    // AUTH CHECK: If no existing update AND date is before assignment, block addition
    if (!hasExistingUpdate && day.date < validStartDate) {
      toast.error(`Access Denied: You were assigned to this project on ${format(validStartDate, "MMM d, yyyy")}. You cannot add backdated updates.`);
      return;
    }

    // PROJECT ACTIVITY CHECK: If project is inactive, block adding new updates
    if (!hasExistingUpdate && userAssignment && !userAssignment.isActive) {
      toast.error("Access Denied: This project is currently inactive for you. You cannot add new updates.");
      return;
    }

    setInitialDate(day.date);
    setInitialModalTab(type);

    if (type === "memo" && day.hasMemo && day.memo) {
      setSelectedMemo(day.memo);
      setInitialMemoContent(day.memo.memoContent || "");
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
    if (!userId) return null;
    try {
      if (type === "memo") {
        const memosData = await memosApi.getByFilters(userId, pid) as Memo[];
        const memo = Array.isArray(memosData) ? memosData.find((m) => getLocalDateString(m.reportDate) === date) : null;
        return {
          type: `Memo for ${format(new Date(date), "MMMM d, yyyy")}`,
          content: memo?.memoContent || "No memo submitted for this date",
        };
      } else {
        const eodsData = await eodsApi.getByFilters(userId, pid) as EOD[];
        const eod = Array.isArray(eodsData) ? eodsData.find((e) => getLocalDateString(e.reportDate) === date) : null;
        return {
          type: `EOD for ${format(new Date(date), "MMMM d, yyyy")}`,
          content: eod?.actualUpdate || "No EOD submitted for this date",
        };
      }
    } catch (error) {
      handleApiError(error, "Fetch reference data");
      return null;
    }
  };

  const handleSubmit = async (data: {
    type: "memo" | "eod";
    projectId: string;
    date: string;
    memoContent?: string;
    clientUpdate?: string;
    internalUpdate?: string;
  }) => {
    try {
      if (data.type === "memo") {
        if (!data.memoContent?.trim()) {
          toast.error("Please enter your memo");
          return;
        }
        if (selectedMemo) {
          await memosApi.update(selectedMemo.id, {
            memoContent: data.memoContent,
            projectId,
            userId,
            reportDate: data.date,
          });
        } else {
          await memosApi.create({
            memoContent: data.memoContent,
            projectId,
            userId,
            reportDate: data.date,
          });
        }
        toast.success(`Memo ${selectedMemo ? "updated" : "saved"} successfully!`);
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
  };

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
          minDate={validStartDate ? format(validStartDate, "yyyy-MM-dd") : ""}
          initialMemoContent={initialMemoContent}
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
