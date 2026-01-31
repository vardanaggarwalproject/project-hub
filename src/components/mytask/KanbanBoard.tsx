"use client";

import { useState, useEffect } from "react";
import { Board } from "./Board";
import { BoardSkeleton } from "./BoardSkeleton";
import { Column as ColumnType } from "./dummy-data";
import { projectsApi, tasksApi, columnsApi } from "@/lib/api/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Network } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

export function KanbanBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await projectsApi.getAll();
        setProjects(result.data || []);
        if (result.data && result.data.length > 0) {
          setSelectedProjectId(result.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError("Failed to load projects");
      }
    };
    fetchProjects();
  }, []);

  // Fetch columns and tasks when project changes
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchBoardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          projectId: selectedProjectId,
          includeSubtasks: 'true' // ⚡ Fetch subtasks too!
        });

        // Fetch columns and tasks in parallel
        const [columnsData, tasksData] = await Promise.all([
          columnsApi.getAll(new URLSearchParams({ projectId: selectedProjectId })),
          tasksApi.getAll(params),
        ]);

        // Group tasks by column
        const columnsWithTasks: ColumnType[] = columnsData.map((col: any) => ({
          id: col.id,
          title: col.title,
          color: col.color,
          tasks: tasksData
            .filter((t: any) => t.columnId === col.id && !t.parentTaskId) // Only show parent tasks
            .map((t: any) => ({
              id: t.id,
              shortId: t.shortId,
              title: t.name,
              description: t.description || "",
              priority: t.priority || "medium",
              dueDate: t.deadline ? new Date(t.deadline).toISOString() : undefined,
              assignees: t.assignees || [],
              projectId: t.projectId,
              columnId: t.columnId,
              // Include subtasks
              subtasks: tasksData
                .filter((st: any) => st.parentTaskId === t.id)
                .map((st: any) => ({
                  id: st.id,
                  shortId: st.shortId,
                  title: st.name,
                  description: st.description || "",
                  priority: st.priority || "medium",
                  dueDate: st.deadline ? new Date(st.deadline).toISOString() : undefined,
                  assignees: st.assignees || [],
                  projectId: st.projectId,
                  columnId: st.columnId,
                  parentTaskId: st.parentTaskId,
                })),
            })),
        }));

        setColumns(columnsWithTasks);
      } catch (err) {
        console.error("Failed to fetch board data:", err);
        setError("Failed to load board data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, [selectedProjectId]);

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Board Header */}
      <div className="border-b bg-app-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-app-heading">My Tasks</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{columns.length} columns</span>
              <span>•</span>
              <span>
                {columns.reduce((acc, col) => acc + col.tasks.length, 0)} tasks
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={showSubtasks ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="h-8 gap-2"
            >
              <Network className="h-4 w-4" />
              {showSubtasks ? "Hide" : "Show"} Subtasks
            </Button>
            {projects.length > 0 && (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="min-w-50">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Board Content */}
      {isLoading ? (
        <BoardSkeleton />
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <Board
          columns={columns}
          onColumnsChange={setColumns}
          projectId={selectedProjectId}
          showSubtasks={showSubtasks}
        />
      )}
    </div>
  );
}
