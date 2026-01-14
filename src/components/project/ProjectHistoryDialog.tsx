"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        memosApi.getByFilters(userId),
        eodsApi.getByFilters(userId),
      ]);

      setProject(projectData);
      setUserAssignment(assignmentData);
      
      const allMemos = Array.isArray(memosData) ? memosData : [];
      const allEods = Array.isArray(eodsData) ? eodsData : [];

      console.log(`🔍 [HistoryDialog] Logged-in UserID: ${userId}`);
      console.log(`🔍 [HistoryDialog] Total user memos: ${allMemos.length}. URL projectId: ${projectId}`);
      
      // Filter by projectId and userId locally (Strict ownership check)
      const filteredMemos = allMemos.filter(m => {
          const mProjId = String(m.projectId).toLowerCase().trim();
          const pId = String(projectId).toLowerCase().trim();
          const match = mProjId === pId && String(m.userId) === String(userId);
          
          if (getLocalDateString(m.reportDate) === "2026-01-14") {
              console.log(`🔍 [HistoryDialog] Jan 14 Memo tracing: match=${match}, MemoUser=${m.userId}, AppUser=${userId}`);
          }
          return match;
      });
      const filteredEods = allEods.filter(e => {
          const mProjId = String(e.projectId).toLowerCase().trim();
          const pId = String(projectId).toLowerCase().trim();
          const match = mProjId === pId && String(e.userId) === String(userId);
          return match;
      });
      
      setMemos(filteredMemos);
      setEods(filteredEods);
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
    // If we have an assignment date, that is the ONLY valid start date for authority
    if (userAssignment?.assignedAt) {
        const assignedDate = new Date(userAssignment.assignedAt);
        assignedDate.setHours(0, 0, 0, 0);
        console.log(`🔍 [HistoryDialog] SETTING validStartDate to Assignment Date: ${format(assignedDate, "yyyy-MM-dd")}`);
        return assignedDate;
    }
    
    // Fallback ONLY if loading or not found
    if (isLoading) {
        return new Date(); // Restricted while loading
    }

    if (project?.createdAt) {
        const createdDate = new Date(project.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        console.log(`🔍 [HistoryDialog] SETTING validStartDate to Project Creation: ${format(createdDate, "yyyy-MM-dd")}`);
        return createdDate;
    }

    return new Date();
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
      const isValidDate = dateTime >= validStartDate && dateTime <= today;

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
    const thisMonth = currentMonth.getMonth();
    const thisYear = currentMonth.getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const memosThisMonth = memos.filter((m) => {
      const date = new Date(m.reportDate);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    const eodsThisMonth = eods.filter((e) => {
      const date = new Date(e.reportDate);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const validDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((date) => {
      const dateTime = new Date(date);
      dateTime.setHours(0, 0, 0, 0);
      return dateTime >= validStartDate && dateTime <= today;
    }).length;

    return {
      memosThisMonth,
      eodsThisMonth,
      completionRate: validDays > 0 ? Math.round((eodsThisMonth / validDays) * 100) : 0,
    };
  }, [memos, eods, currentMonth, validStartDate]);

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
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            Update History: <span className="text-blue-600">{project?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-6">
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
        />
      </DialogContent>
    </Dialog>
  );
}
