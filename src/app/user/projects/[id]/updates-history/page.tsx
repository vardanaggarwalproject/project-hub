"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import type { Project, ProjectAssignment } from "@/types/project";
import type { Memo, EOD, DayStatus } from "@/types/report";
import type { Session } from "@/types";
import { getLocalDateString } from "@/lib/utils/date";
import { handleApiError } from "@/lib/utils/error-handler";
import { projectsApi, memosApi, eodsApi } from "@/lib/api/client";

export default function UpdatesHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();
  const session = sessionData as Session | null;

  const [project, setProject] = useState<Project | null>(null);
  const [userAssignment, setUserAssignment] = useState<ProjectAssignment | null>(
    null
  );
  const [memos, setMemos] = useState<Memo[]>([]);
  const [eods, setEods] = useState<EOD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal state - ONLY for controlling open/close
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  /**
   * Fetch project data, assignments, memos, and EODs
   */
  const fetchData = async () => {
    if (!session?.user?.id || !projectId) return;

    setIsLoading(true);
    try {
      const [projectData, assignmentData, memosData, eodsData] = await Promise.all([
        projectsApi.getById(projectId as string),
        projectsApi.getAssignment(projectId as string, session.user.id).catch(() => null),
        memosApi.getByFilters(session.user.id, projectId as string),
        eodsApi.getByFilters(session.user.id, projectId as string),
      ]);

      setProject(projectData);
      // Assignment might not exist yet, that's okay
      setUserAssignment(assignmentData);
      setMemos(Array.isArray(memosData) ? memosData : []);
      setEods(Array.isArray(eodsData) ? eodsData : []);
    } catch (error) {
      handleApiError(error, "Fetch updates history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, projectId]);

  // Calculate the valid start date (later of project creation or user assignment)
  const validStartDate = useMemo(() => {
    const dates: Date[] = [];

    if (project?.createdAt) {
      const createdDate = new Date(project.createdAt);
      createdDate.setHours(0, 0, 0, 0);
      dates.push(createdDate);
    }

    if (userAssignment?.assignedAt) {
      const assignedDate = new Date(userAssignment.assignedAt);
      assignedDate.setHours(0, 0, 0, 0);
      dates.push(assignedDate);
    }

    // If no dates available, return a very old date (show all history)
    if (dates.length === 0) {
      const oldDate = new Date("2020-01-01");
      oldDate.setHours(0, 0, 0, 0);
      return oldDate;
    }

    // Return the latest date (most recent start)
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }, [project, userAssignment]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days: DayStatus[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all days in the month
    const monthDays = eachDayOfInterval({ start, end });

    // Add previous month days to fill the first week
    const firstDay = monthDays[0].getDay();
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      days.push({
        date,
        hasMemo: false,
        hasEOD: false,
        isToday: false,
        isOtherMonth: true,
      });
    }

    // Add current month days
    monthDays.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const memo = memos.find(
        (m) => getLocalDateString(m.reportDate) === dateStr
      );
      const eod = eods.find(
        (e) => getLocalDateString(e.reportDate) === dateStr
      );

      // Check if date is in valid range (between start date and today)
      const dateTime = new Date(date);
      dateTime.setHours(0, 0, 0, 0);

      // Always show dates from validStartDate to today (inclusive)
      const isValidDate = dateTime >= validStartDate && dateTime <= today;

      days.push({
        date,
        hasMemo: !!memo,
        hasEOD: !!eod,
        isToday: isSameDay(date, new Date()),
        isOtherMonth: false,
        memo,
        eod,
        isValidDate, // Add this to track if we should show missing badges
      } as DayStatus & { isValidDate: boolean });
    });

    // Add next month days to fill the last week
    const lastDay = monthDays[monthDays.length - 1].getDay();
    for (let i = 1; i <= 6 - lastDay; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        hasMemo: false,
        hasEOD: false,
        isToday: false,
        isOtherMonth: true,
      });
    }

    return days;
  }, [currentMonth, memos, eods, validStartDate]);

  const stats = useMemo(() => {
    const thisMonth = currentMonth.getMonth();
    const thisYear = currentMonth.getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const memosThisMonth = memos.filter((m) => {
      // Convert UTC timestamp to local date for comparison
      const date = new Date(m.reportDate);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    const eodsThisMonth = eods.filter((e) => {
      // Convert UTC timestamp to local date for comparison
      const date = new Date(e.reportDate);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    // Calculate valid days in month (only days that should have updates)
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const validDays = monthDays.filter((date) => {
      const dateTime = new Date(date);
      dateTime.setHours(0, 0, 0, 0);

      // Count only days within valid range
      return dateTime >= validStartDate && dateTime <= today;
    }).length;

    const completionRate =
      validDays > 0 ? Math.round((eodsThisMonth / validDays) * 100) : 0;

    return { memosThisMonth, eodsThisMonth, completionRate };
  }, [memos, eods, currentMonth, validStartDate]);

  const handleDayClick = (day: DayStatus, type: "memo" | "eod") => {
    if (day.isOtherMonth || !day.isValidDate) return;

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
      // Add mode
      setSelectedMemo(null);
      setSelectedEOD(null);
      setInitialMemoContent("");
      setInitialClientUpdate("");
      setInitialInternalUpdate("");
      setModalMode("edit");
    }

    setIsModalOpen(true);
  };

  /**
   * Fetch reference data for modal (memo or EOD for selected date)
   */
  const referenceDataFetcher = async (
    type: "memo" | "eod",
    projectId: string,
    date: string
  ) => {
    if (!session?.user?.id) return null;

    try {
      if (type === "memo") {
        // Show the memo for this date
        const memosData = await memosApi.getByFilters(session.user.id, projectId) as Memo[];
        const memo = Array.isArray(memosData)
          ? memosData.find((m) => getLocalDateString(m.reportDate) === date)
          : null;

        if (memo) {
          return {
            type: `Memo for ${format(new Date(date), "MMMM d, yyyy")}`,
            content: memo.memoContent || "No content",
          };
        } else {
          return {
            type: `Memo for ${format(new Date(date), "MMMM d, yyyy")}`,
            content: "No memo submitted for this date",
          };
        }
      } else {
        // Show the EOD for this date
        const eodsData = await eodsApi.getByFilters(session.user.id, projectId) as EOD[];
        const eod = Array.isArray(eodsData)
          ? eodsData.find((e) => getLocalDateString(e.reportDate) === date)
          : null;

        if (eod) {
          return {
            type: `EOD for ${format(new Date(date), "MMMM d, yyyy")}`,
            content: eod.actualUpdate || "No content",
          };
        } else {
          return {
            type: `EOD for ${format(new Date(date), "MMMM d, yyyy")}`,
            content: "No EOD submitted for this date",
          };
        }
      }
    } catch (error) {
      handleApiError(error, "Fetch reference data");
      return null;
    }
  };

  /**
   * Handle memo/EOD submission from modal
   */
  const handleSubmit = async (data: {
    type: "memo" | "eod";
    projectId: string;
    date: string;
    memoContent?: string;
    clientUpdate?: string;
    internalUpdate?: string;
  }) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to submit updates");
      router.push("/login");
      return;
    }

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
            userId: session.user.id,
            reportDate: data.date,
          });
        } else {
          await memosApi.create({
            memoContent: data.memoContent,
            projectId,
            userId: session.user.id,
            reportDate: data.date,
          });
        }

        toast.success(
          `Memo ${selectedMemo ? "updated" : "saved"} successfully!`
        );
        await fetchData();
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
            userId: session.user.id,
            reportDate: data.date,
          });
        } else {
          await eodsApi.create({
            clientUpdate: data.clientUpdate || "",
            actualUpdate: data.internalUpdate,
            projectId,
            userId: session.user.id,
            reportDate: data.date,
          });
        }

        toast.success(`EOD ${selectedEOD ? "updated" : "saved"} successfully!`);
        await fetchData();
      }
    } catch (error) {
      handleApiError(error, "Submit update");
      throw error; // Re-throw to keep modal open on error
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-4 md:p-6 space-y-4 max-w-350">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Updates Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your daily memos and EOD submissions -{" "}
            {format(new Date(), "MMMM d, yyyy")}
          </p>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Calendar */}
        <Card className="border border-slate-200 rounded-xl overflow-hidden">
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
        </Card>

        {/* Modal */}
        <UpdateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projects={project ? [project] : []}
          mode={modalMode}
          initialTab={initialModalTab}
          initialDate={initialDate ? format(initialDate, "yyyy-MM-dd") : ""}
          initialMemoContent={initialMemoContent}
          initialClientUpdate={initialClientUpdate}
          initialInternalUpdate={initialInternalUpdate}
          onSubmit={handleSubmit}
          showDatePicker={true}
          maxDate={format(new Date(), "yyyy-MM-dd")}
          showProjectSelect={false}
          onEditClick={() => setModalMode("edit")}
          referenceDataFetcher={referenceDataFetcher}
          existingMemos={memos}
          existingEods={eods}
        />
      </div>
    </ErrorBoundary>
  );
}
