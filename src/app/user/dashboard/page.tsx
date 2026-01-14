"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { UpdateModal } from "@/components/update-modal";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProjectsSection } from "@/components/dashboard/ProjectsSection";
import { MissingUpdatesSection } from "@/components/dashboard/MissingUpdatesSection";
import type { Project, ProjectStatus, ProjectAssignment } from "@/types/project";
import type { MissingUpdate, Memo, EOD } from "@/types/report";
import type { Session } from "@/types";
import { getTodayDate, getYesterdayDate, getLocalDateString, formatDisplayDate } from "@/lib/utils/date";
import { handleApiError } from "@/lib/utils/error-handler";
import { projectsApi, memosApi, eodsApi } from "@/lib/api/client";
import { MISSING_UPDATES_DAYS_TO_CHECK } from "@/lib/constants";

export default function UserDashboardPage() {
  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();
  const session = sessionData as Session | null;
  const router = useRouter();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<
    ProjectAssignment[]
  >([]);
  const [missingUpdates, setMissingUpdates] = useState<MissingUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Modal state - ONLY for controlling if modal is open/closed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState<"memo" | "eod">(
    "memo"
  );
  const [initialProjectId, setInitialProjectId] = useState<string>("");
  const [initialDate, setInitialDate] = useState<string>("");

  useEffect(() => {
    const socket = getSocket();

    const onProjectDeleted = (data: { projectId: string }) => {
      setMyProjects((prev) => prev.filter((p) => p.id !== data.projectId));

      if (session?.user?.role !== "admin") {
        toast.error("Project deleted by admin - you are no longer a member");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    const onProjectCreated = (data: {
      projectId: string;
      project: Project;
      assignedUserIds: string[];
    }) => {
      if (
        data.assignedUserIds &&
        session?.user?.id &&
        data.assignedUserIds.includes(session.user.id)
      ) {
        toast.success(`You have been assigned to: ${data.project.name}`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    if (socket) {
      socket.on("project-deleted", onProjectDeleted);
      socket.on("project-created", onProjectCreated);
      return () => {
        socket.off("project-deleted", onProjectDeleted);
        socket.off("project-created", onProjectCreated);
      };
    }
  }, [session]);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const userId = session.user.id;
      const today = getTodayDate();
      const yesterday = getYesterdayDate();

      // Fetch user's projects, memos, and EODs
      const [projectsData, memosData, eodsData] = await Promise.all([
        projectsApi.getAll(),
        memosApi.getByFilters(userId),
        eodsApi.getByFilters(userId),
      ]);

      // Get all user's projects
      const userProjects = projectsData.data || [];

      // Fetch assignment dates for all projects and filter by is_active
      const assignmentPromises = userProjects.map(async (project: Project) => {
        try {
          const assignmentData = await projectsApi.getAssignment(project.id, userId);
            return {
              projectId: project.id,
              assignedAt: new Date(assignmentData.assignedAt),
              createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
              isActive: assignmentData.isActive,
            };
        } catch (error) {
          console.error(
            `Failed to fetch assignment for project ${project.id}`,
            error
          );
          // Fallback: use project creation date if no assignment found
          return {
            projectId: project.id,
            assignedAt: project.createdAt ? new Date(project.createdAt) : new Date(),
            createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
            isActive: false,
          };
        }
      });

      const assignments = await Promise.all(assignmentPromises);
      setProjectAssignments(assignments);

      // Filter to show only active projects on dashboard
      const activeProjects = userProjects.filter((project: Project) => {
        const assignment = assignments.find(
          (a) => a.projectId === project.id
        );
        return assignment?.isActive === true;
      });
      setMyProjects(activeProjects);

      // Calculate project statuses (only for active projects)
      const statuses: ProjectStatus[] = activeProjects.map(
        (project: Project) => {
          const todayMemos = Array.isArray(memosData)
            ? memosData.filter((m: Memo) => {
                const memoDate = m.reportDate
                  ? getLocalDateString(m.reportDate)
                  : "";
                return m.projectId === project.id && memoDate === today;
              })
            : [];

          const todayEods = Array.isArray(eodsData)
            ? eodsData.filter((e: EOD) => {
                const eodDate = e.reportDate
                  ? getLocalDateString(e.reportDate)
                  : "";
                return e.projectId === project.id && eodDate === today;
              })
            : [];

          const yesterdayEods = Array.isArray(eodsData)
            ? eodsData.filter((e: EOD) => {
                const eodDate = e.reportDate
                  ? getLocalDateString(e.reportDate)
                  : "";
                return e.projectId === project.id && eodDate === yesterday;
              })
            : [];

          return {
            projectId: project.id,
            projectName: project.name,
            hasTodayMemo: todayMemos.length > 0,
            hasTodayEod: todayEods.length > 0,
            hasYesterdayEod: yesterdayEods.length > 0,
            yesterdayEodDate: new Date(yesterday),
          };
        }
      );

      setProjectStatuses(statuses);

      // Find missing updates
      const missing: MissingUpdate[] = [];
      const daysToCheck = MISSING_UPDATES_DAYS_TO_CHECK;

      for (let i = 1; i <= daysToCheck; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        const dateStr = checkDate.toISOString().split("T")[0];

        activeProjects.forEach((project: Project) => {
          // Get the assignment info for this project
          const assignment = assignments.find(
            (a: ProjectAssignment) => a.projectId === project.id
          );

          if (assignment) {
            // Calculate valid start date (later of project creation or assignment)
            const assignedDate = assignment.assignedAt;
            assignedDate.setHours(0, 0, 0, 0);

            const createdDate = assignment.createdAt;
            createdDate.setHours(0, 0, 0, 0);

            const validStartDate =
              assignedDate > createdDate ? assignedDate : createdDate;

            // Only check for missing updates if the date is after assignment/creation
            if (checkDate < validStartDate) {
              return; // Skip this date for this project
            }
          }

          // Check for missing memo
          const hasMemo =
            Array.isArray(memosData) &&
            memosData.some(
              (m: Memo) =>
                m.projectId === project.id &&
                getLocalDateString(m.reportDate) === dateStr
            );

          if (!hasMemo) {
            missing.push({
              id: `${project.id}-${dateStr}-memo`,
              date: new Date(dateStr),
              projectId: project.id,
              projectName: project.name,
              type: "memo",
            });
          }

          // Check for missing EOD
          const hasEod =
            Array.isArray(eodsData) &&
            eodsData.some(
              (e: EOD) =>
                e.projectId === project.id &&
                getLocalDateString(e.reportDate) === dateStr
            );

          if (!hasEod) {
            missing.push({
              id: `${project.id}-${dateStr}-eod`,
              date: new Date(dateStr),
              projectId: project.id,
              projectName: project.name,
              type: "eod",
            });
          }
        });
      }

      // Set all missing updates (will be scrollable in UI)
      setMissingUpdates(missing);
    } catch (error) {
      handleApiError(error, "Dashboard data fetch");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const openModal = async (
    type: "memo" | "eod",
    projectId: string,
    date?: string
  ) => {
    const targetDate = date || getTodayDate();
    setInitialModalTab(type);
    setInitialProjectId(projectId);
    setInitialDate(targetDate);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  /**
   * Toggle project active/inactive status
   */
  const handleToggleActive = async (
    projectId: string,
    currentStatus: boolean
  ) => {
    if (!session?.user?.id) return;

    try {
      await projectsApi.toggleActive(projectId, session.user.id, !currentStatus);
      toast.success(
        !currentStatus
          ? "Project marked as active"
          : "Project marked as inactive"
      );
      // Refetch dashboard data to update UI
      await fetchDashboardData();
    } catch (error) {
      handleApiError(error, "Toggle project status");
    }
  };

  /**
   * Fetch reference data for modal (yesterday's EOD or selected date's memo)
   */
  const referenceDataFetcher = async (
    type: "memo" | "eod",
    projectId: string,
    date: string
  ) => {
    if (!session?.user?.id) return null;

    try {
      if (type === "memo") {
        // Show yesterday's EOD
        const yesterday = getYesterdayDate();
        const eods = await eodsApi.getByFilters(session.user.id, projectId) as EOD[];
        const yesterdayEod = Array.isArray(eods)
          ? eods.find((e) => getLocalDateString(e.reportDate) === yesterday)
          : null;

        if (yesterdayEod) {
          return {
            type: "Yesterday's EOD",
            content:
              yesterdayEod.actualUpdate ||
              yesterdayEod.clientUpdate ||
              "No EOD available",
          };
        } else {
          return {
            type: "Yesterday's EOD",
            content: "No EOD submitted yesterday",
          };
        }
      } else {
        // Show memo for the selected date
        const memos = await memosApi.getByFilters(session.user.id, projectId) as Memo[];
        const selectedDateMemo = Array.isArray(memos)
          ? memos.find((m) => getLocalDateString(m.reportDate) === date)
          : null;

        const isToday = date === getTodayDate();
        const dateLabel = isToday
          ? "Today's Memo"
          : `Memo for ${formatDisplayDate(date).split(",")[0]}`;

        if (selectedDateMemo) {
          return {
            type: dateLabel,
            content: selectedDateMemo.memoContent || "No memo available",
          };
        } else {
          return {
            type: dateLabel,
            content: isToday
              ? "No memo submitted today"
              : "No memo submitted for this date",
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

        await memosApi.create({
          memoContent: data.memoContent,
          projectId: data.projectId,
          userId: session.user.id,
          reportDate: data.date,
        });

        toast.success("Memo saved successfully!");
        await fetchDashboardData();
      } else {
        if (!data.internalUpdate?.trim()) {
          toast.error("Please enter internal update");
          return;
        }

        await eodsApi.create({
          clientUpdate: data.clientUpdate || "",
          actualUpdate: data.internalUpdate,
          projectId: data.projectId,
          userId: session.user.id,
          reportDate: data.date,
        });

        toast.success("EOD report saved successfully!");
        await fetchDashboardData();
      }
    } catch (error) {
      handleApiError(error, "Submit update");
      throw error; // Re-throw to keep modal open on error
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const todayMemoCount = projectStatuses.filter((p) => p.hasTodayMemo).length;
  const todayEodCount = projectStatuses.filter((p) => p.hasTodayEod).length;
  const totalProjects = myProjects.length;

  return (
    <ErrorBoundary>
      <div className="p-4 md:p-6 space-y-5 max-w-300">
        {/* Header */}
        <div className="space-y-0.5">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Hello, {session?.user.name} 👋
          </h1>
          <p className="text-xs text-slate-500">
            {formatDisplayDate(getTodayDate())}
          </p>
        </div>

        {/* Stats Grid */}
        <StatsCards
          todayMemoCount={todayMemoCount}
          todayEodCount={todayEodCount}
          totalProjects={totalProjects}
        />

        {/* Projects Section */}
        <ProjectsSection
          projects={myProjects}
          projectStatuses={projectStatuses}
          onOpenModal={openModal}
          onToggleActive={handleToggleActive}
        />

        {/* Missing Updates */}
        <MissingUpdatesSection
          missingUpdates={missingUpdates}
          onOpenModal={openModal}
        />

      {/* Update Modal */}
      <UpdateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        projects={myProjects}
        showDatePicker={true}
        maxDate={getTodayDate()}
        showProjectSelect={true}
        initialTab={initialModalTab}
        initialProjectId={initialProjectId}
        initialDate={initialDate}
        referenceDataFetcher={referenceDataFetcher}
        onSubmit={handleSubmit}
      />
      </div>
    </ErrorBoundary>
  );
}
