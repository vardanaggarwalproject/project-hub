"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { UpdateModal } from "@/components/update-modal";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProjectsSection } from "@/components/dashboard/ProjectsSection";
import { ProjectHistoryDialog } from "@/components/project/ProjectHistoryDialog";
import { ProjectDetailsModal } from "@/common/ProjectDetailsModal";
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Details modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewProjectId, setViewProjectId] = useState<string | null>(null);

  const [allMemos, setAllMemos] = useState<Memo[]>([]);
  const [allEods, setAllEods] = useState<EOD[]>([]);

  // Update Modal State
  const [initialMemoContent, setInitialMemoContent] = useState("");
  const [initialShortMemoContent, setInitialShortMemoContent] = useState("");
  const [initialClientUpdate, setInitialClientUpdate] = useState("");
  const [initialInternalUpdate, setInitialInternalUpdate] = useState("");

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

    const onProjectUpdated = (data: { projectId: string; project: Project }) => {
      // Check if this project is assigned to the current user
      setMyProjects((prev) => {
        const index = prev.findIndex((p) => p.id === data.projectId);
        if (index === -1) {
          // If not in current active projects, it might have become active or been updated elsewhere
          // For safety and correctness of stats/missing updates, just refetch
          fetchDashboardData();
          return prev;
        }
        
        const newProjects = [...prev];
        newProjects[index] = { ...newProjects[index], ...data.project };
        
        // If status changed to non-active, it should be removed from dashboard
        if (data.project.status !== 'active') {
          return newProjects.filter(p => p.id !== data.projectId);
        }
        
        return newProjects;
      });
      
      // Always refresh to ensure statuses and missing updates are correct
      fetchDashboardData();
    };

    const onAssignmentUpdated = (data: { projectId: string; userId: string; isActive: boolean }) => {
      if (data.userId === session?.user?.id) {
        // If the toggle was for the current user, refresh everything
        fetchDashboardData();
      }
    };

    if (socket) {
      socket.on("project-deleted", onProjectDeleted);
      socket.on("project-created", onProjectCreated);
      socket.on("project-updated", onProjectUpdated);
      socket.on("assignment-updated", onAssignmentUpdated);
      return () => {
        socket.off("project-deleted", onProjectDeleted);
        socket.off("project-created", onProjectCreated);
        socket.off("project-updated", onProjectUpdated);
        socket.off("assignment-updated", onAssignmentUpdated);
      };
    }
  }, [session]);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const userId = session.user.id;
      const today = getTodayDate();

      // Fetch user's projects, memos, and EODs - USE SUMMARY MODE for performance
      const [projectsData, memosData, eodsData] = await Promise.all([
        projectsApi.getAll(),
        memosApi.getByFilters(userId, undefined, 3000, true),
        eodsApi.getByFilters(userId, undefined, 3000, false),
      ]);

      // Store raw data for duplicate checking
      setAllMemos(Array.isArray(memosData) ? memosData : []);
      setAllEods(Array.isArray(eodsData) ? eodsData : []);

      // Use already mapped project data
      const userProjects = projectsData.data || [];

      const assignments = Array.isArray(projectsData.data)
        ? projectsData.data
            .filter((p: any) => p.assignedAt)
            .map((p: any) => ({
              projectId: p.id,
              assignedAt: new Date(p.assignedAt),
              lastActivatedAt: p.lastActivatedAt ? new Date(p.lastActivatedAt) : undefined,
              createdAt: new Date(p.createdAt || new Date()),
              isActive: p.isActive || false,
            }))
        : [];
      setProjectAssignments(assignments);

      // Filter to show only "Actively Working" projects on dashboard that are also globally active
      const activeProjects = userProjects.filter((p: Project) => p.isActive === true && p.status === 'active');
      setMyProjects(activeProjects);

      // Calculate project statuses (only for active projects)
      const statuses: ProjectStatus[] = activeProjects.map(
        (project: Project) => {
          const projectMemos = Array.isArray(memosData)
            ? memosData.filter((m: Memo) => {
              const memoDate = m.reportDate
                ? getLocalDateString(m.reportDate)
                : "";
              return m.projectId === project.id && memoDate === today;
            })
            : [];

          const hasUniversalToday = projectMemos.some(m => m.memoType === 'universal') || 
                            (!project.isMemoRequired && projectMemos.some(m => m.memoType === 'short'));
          const hasShortToday = projectMemos.some(m => m.memoType === 'short');

          const todayEods = Array.isArray(eodsData)
            ? eodsData.filter((e: EOD) => {
              const eodDate = e.reportDate
                ? getLocalDateString(e.reportDate)
                : "";
              return e.projectId === project.id && eodDate === today;
            })
            : [];


          return {
            projectId: project.id,
            projectName: project.name,
            hasUniversalToday,
            hasShortToday,
            hasEodToday: todayEods.length > 0,
          };
        }
      );

      setProjectStatuses(statuses);

      // Find missing updates
      const missing: MissingUpdate[] = [];
      const daysToCheck = 2;
      const memoLimitDays = 2;

      // Map<projectId, Map<dateStr, {hasUniversal, hasShort}>>
      const memoStatusMap = new Map<string, Map<string, {uni: boolean, short: boolean}>>();
      const eodMap = new Map<string, Set<string>>();

      if (Array.isArray(memosData)) {
        memosData.forEach(m => {
          if (!memoStatusMap.has(m.projectId)) memoStatusMap.set(m.projectId, new Map());
          const dateStr = getLocalDateString(m.reportDate);
          if (!memoStatusMap.get(m.projectId)!.has(dateStr)) {
              memoStatusMap.get(m.projectId)!.set(dateStr, {uni: false, short: false});
          }
          const status = memoStatusMap.get(m.projectId)!.get(dateStr)!;
          if (m.memoType === 'universal') status.uni = true;
          if (m.memoType === 'short') status.short = true;
        });
      }

      if (Array.isArray(eodsData)) {
        eodsData.forEach(e => {
          if (!eodMap.has(e.projectId)) eodMap.set(e.projectId, new Set());
          eodMap.get(e.projectId)?.add(getLocalDateString(e.reportDate));
        });
      }

      for (let i = 1; i <= daysToCheck; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = getLocalDateString(checkDate);
        
        // Skip weekends for missing updates
        const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
        if (isWeekend) continue;

        activeProjects.forEach((project: Project) => {
          const assignment = assignments.find(
            (a) => a.projectId === project.id
          );

          const mStatus = memoStatusMap.get(project.id)?.get(dateStr);
          const hasUniversal = mStatus?.uni || (!project.isMemoRequired && mStatus?.short);
          const hasShort = mStatus?.short || false;
          const hasEod = eodMap.get(project.id)?.has(dateStr) || false;

          // Determine if we should check this day for this project
          let shouldCheck = false;
          if (assignment) {
            const validStartStr = getLocalDateString(assignment.assignedAt);
            const activeFromStr = assignment.lastActivatedAt 
              ? getLocalDateString(assignment.lastActivatedAt) 
              : validStartStr;
            
            if (dateStr >= activeFromStr) {
              shouldCheck = true;
            }
          }

          // If they sent an EOD, they were definitely working, so we should expect a memo
          if (hasEod) {
            shouldCheck = true;
          }

          if (!shouldCheck) return;

          // Universal is required if we check back memoLimitDays
          const universalMissing = i <= memoLimitDays && !hasUniversal;
          // Short is required only for specific projects
          const shortMissing = i <= memoLimitDays && project.isMemoRequired && !hasShort;
          // EOD is missing if no EOD found
          const eodMissing = !hasEod;

          if (universalMissing || shortMissing || eodMissing) {
            missing.push({
              id: `${project.id}-${dateStr}`,
              date: new Date(dateStr + "T12:00:00"), // mid-day to avoid TZ shifts
              projectId: project.id,
              projectName: project.name,
              isUniversalMissing: universalMissing,
              isShortMissing: shortMissing,
              isEodMissing: eodMissing,
            });
          }
        });
      }

      // Sort missing updates by date (newest first)
      missing.sort((a, b) => b.date.getTime() - a.date.getTime());
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

  const handleOpenModal = async (
    type: "memo" | "eod",
    projectId: string,
    date?: string
  ) => {
    const targetDate = date || getTodayDate();
    setInitialModalTab(type);
    setInitialProjectId(projectId);
    setInitialDate(targetDate);
    
    // Default values if no existing report (will be overwritten if exists)
    setInitialMemoContent("");
    setInitialShortMemoContent(""); 
    setInitialClientUpdate(""); 
    setInitialInternalUpdate("");

    // Find existing report if any
    const dateStr = targetDate;
    if (type === "memo") {
        const existingMemo = allMemos.find(m => m.projectId === projectId && getLocalDateString(new Date(m.reportDate)) === dateStr);
        if (existingMemo) {
             setInitialMemoContent(existingMemo.memoContent || "");
             // find short memo too
             const shortMemo = allMemos.find(m => m.projectId === projectId && m.memoType === 'short' && getLocalDateString(new Date(m.reportDate)) === dateStr);
             setInitialShortMemoContent(shortMemo?.memoContent || "");
        }
    } else {
         const existingEod = allEods.find(e => e.projectId === projectId && getLocalDateString(new Date(e.reportDate)) === dateStr);
         if (existingEod) {
             setInitialClientUpdate(existingEod.clientUpdate || "");
             setInitialInternalUpdate(existingEod.actualUpdate || "");
         }
    }
    
    setIsModalOpen(true);
  };

  const handleViewProject = (projectId: string) => {
    setViewProjectId(projectId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = (open: boolean) => {
    setIsDetailsModalOpen(open);
    if (!open) {
      setViewProjectId(null);
    }
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

    // Check project status first
    // Note: myProjects in dashboard is ALREADY filtered to only isActive=true projects (lines 136-137)
    // However, if we want to support toggling OFFLINE projects ON, we might need allProjects soon?
    // Wait, line 136 says: setMyProjects(activeProjects); 
    // This means the user CANNOT see inactive projects on the dashboard currently?
    // Let's verify... ProjectsSection uses `myProjects` which is `activeProjects`.
    // BUT the toggle allows turning them OFF. This logic is fine for turning off.
    // What about turning ON? The dashboard seems to ONLY show active projects.
    // IF the user uses "View All" (UserProjectsPage), they can see inactive ones.
    // BUT wait, ProjectsSection HAS a switch. If I turn it OFF, it stays in the list until refresh?
    // Or it might disappear. 
    
    // Regardless, I should add the safety check here just in case.
    // But I might not have access to the full project object if it was filtered out?
    // Actually, `myProjects` contains the state. 

    // The logic requested is: "if the project is on hold ... restricted ... toggle"
    // Since dashboard implementation is:
    // const activeProjects = userProjects.filter((p: Project) => p.isActive === true);
    // setMyProjects(activeProjects);
    
    // Effectively, the dashboard projects ARE active. 
    // BUT, what if the project ITSELF (admin status) is 'On Hold', but assignment is 'Active'?
    // That's the edge case. Admin sets it to 'On Hold', but user still has it 'Active'.
    // User tries to toggle it off (or on if it was effectively confusing).
    // Actually, if Admin sets to On Hold, user shouldn't be work on it.
    // If user tries to toggle it, we should check status.
    
    // We need to find the project in `userProjects` (which we don't have in scope here, only `myProjects`).
    // `myProjects` serves the UI.
    // Let's rely on `myProjects` since it comes from API.
    
    const project = myProjects.find(p => p.id === projectId);
    if (project && project.status !== 'active') { // Admin status check
         const capitalizedStatus = project.status.charAt(0).toUpperCase() + project.status.slice(1);
         toast.error(`Cannot activate project. Status is currently "${capitalizedStatus}".`);
         return;
    }

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
   * Fetch reference data for modal (not used much anymore as we use local state)
   */
  const referenceDataFetcher = useCallback(async (
    type: "memo" | "eod",
    projectId: string,
    date: string
  ) => {
    // We already have all data in allMemos and allEods, but this prop 
    // is also used for the logic in UpdateModal to decide mode.
    // Let's keep it simple and just return the latest from local state if needed.
    return null; 
  }, []);

  /**
   * Handle memo/EOD submission from modal
   */
  const handleUpdateSubmit = async (data: {
    type: "memo" | "eod";
    projectId: string;
    date: string;
    memoContent?: string;
    shortMemoContent?: string;
    clientUpdate?: string;
    internalUpdate?: string;
  }) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to submit updates");
      router.push("/login");
      return;
    }

    try {
      const savePromises = [];
      const project = myProjects.find((p) => p.id === data.projectId);

      // Check for Memo content
      const hasMemoContent = data.memoContent?.trim() || (project?.isMemoRequired && data.shortMemoContent?.trim());
      
      if (hasMemoContent) {
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
          memoType: "universal",
          projectId: data.projectId,
          userId: session.user.id,
          reportDate: data.date,
        });

        if (project?.isMemoRequired && data.shortMemoContent) {
          memoList.push({
            memoContent: data.shortMemoContent,
            memoType: "short",
            projectId: data.projectId,
            userId: session.user.id,
            reportDate: data.date,
          });
        }

        savePromises.push(
          memosApi.create({
            memos: memoList,
            projectId: data.projectId,
            userId: session.user.id,
            reportDate: data.date,
          })
        );
      }

      // Check for EOD content
      const hasEodContent = data.internalUpdate?.trim() || data.clientUpdate?.trim();
      
      if (hasEodContent) {
        if (!data.internalUpdate?.trim()) {
          toast.error("Please enter internal update");
          return;
        }

        savePromises.push(
          eodsApi.create({
            clientUpdate: data.clientUpdate || "",
            actualUpdate: data.internalUpdate,
            projectId: data.projectId,
            userId: session.user.id,
            reportDate: data.date,
          })
        );
      }

      if (savePromises.length === 0) {
        toast.error("No content to save");
        return;
      }

      await Promise.all(savePromises);
      toast.success("Update(s) saved successfully!");
      await fetchDashboardData();
    } catch (error) {
      handleApiError(error, "Submit update");
      throw error; // Re-throw to keep modal open on error
    }
  };

  const handleUpdateSubmitWrapper = async (data: {
    type: "memo" | "eod";
    projectId: string;
    date: string;
    memoContent?: string;
    shortMemoContent?: string;
    clientUpdate?: string;
    internalUpdate?: string;
  }) => {
    // For simplicity, we use the optimized create API which handles updates on backend now
    await handleUpdateSubmit(data);
  };

  /**
   * Handle memo/EOD deletion
   */
  const handleUpdateDelete = async (
    type: "memo" | "eod",
    projectId: string,
    date: string
  ) => {
    if (!session?.user?.id) return;

    try {
      if (type === "memo") {
        const memosToDelete = allMemos.filter(
          (m) =>
            m.projectId === projectId &&
            getLocalDateString(new Date(m.reportDate)) === date
        );

        if (memosToDelete.length === 0) {
          toast.error("No memo found to delete");
          return;
        }

        await Promise.all(memosToDelete.map((m) => memosApi.delete(m.id)));
      } else {
        const eodToDelete = allEods.find(
          (e) =>
            e.projectId === projectId &&
            getLocalDateString(new Date(e.reportDate)) === date
        );

        if (!eodToDelete) {
          toast.error("No EOD report found to delete");
          return;
        }

        await eodsApi.delete(eodToDelete.id);
      }

      await fetchDashboardData();
    } catch (error) {
      handleApiError(error, "Delete update");
      throw error;
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

  const todayMemoCount = projectStatuses.filter((p) => {
    const project = myProjects.find(mp => mp.id === p.projectId);
    return p.hasUniversalToday && (!project?.isMemoRequired || p.hasShortToday);
  }).length;
  const todayEodCount = projectStatuses.filter((p) => p.hasEodToday).length;
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

        <ProjectsSection
          projects={myProjects}
          projectStatuses={projectStatuses}
          onOpenModal={(type, pid, date) => handleOpenModal(type, pid, date)}
          onToggleActive={handleToggleActive}
          onHistoryClick={(pid) => {
            setSelectedProjectId(pid);
            setIsHistoryOpen(true);
          }}
          onViewProject={handleViewProject}
        />

        {/* Missing Updates */}
        <MissingUpdatesSection
          missingUpdates={missingUpdates}
          onOpenModal={(type, pid, date) => handleOpenModal(type, pid, date)}
        />

        {/* Update Modal */}
        <UpdateModal
          isOpen={isModalOpen}
          onClose={closeModal}
          projects={myProjects}
          showDatePicker={true}
          maxDate={getTodayDate()}
          minDate={(() => {
            if (!initialProjectId) return undefined;
            const assignment = projectAssignments.find(a => a.projectId === initialProjectId);
            if (!assignment) return undefined;

            const assignedDate = new Date(assignment.assignedAt);
            const createdDate = new Date(assignment.createdAt);
            const validStart = assignedDate < createdDate ? assignedDate : createdDate;

            return getLocalDateString(validStart);
          })()}
          showProjectSelect={true}
          initialTab={initialModalTab}
          initialProjectId={initialProjectId}
          initialDate={initialDate}
          referenceDataFetcher={referenceDataFetcher}
          onSubmit={handleUpdateSubmitWrapper}
          existingMemos={allMemos}
          existingEods={allEods}

          initialMemoContent={initialMemoContent}
          initialShortMemoContent={initialShortMemoContent}
          initialClientUpdate={initialClientUpdate}
          initialInternalUpdate={initialInternalUpdate}
          onDelete={handleUpdateDelete}
        />

        <ProjectHistoryDialog
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          projectId={selectedProjectId || ""}
          userId={session?.user?.id || ""}
        />

        <ProjectDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={handleCloseDetailsModal}
          projectId={viewProjectId}
          userRole={session?.user?.role}
        />
      </div>
    </ErrorBoundary>
  );
}
