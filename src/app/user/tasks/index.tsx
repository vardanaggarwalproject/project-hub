"use client";

import { KanbanBoard } from "@/components/mytask";
import { TaskDetailModal } from "@/components/mytask/TaskDetailModal";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Task } from "@/components/mytask/dummy-data";
import { tasksApi } from "@/lib/api/client";
import { toast } from "sonner";

export function TasksPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewTaskId = searchParams.get("viewtask");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  // Fetch task when viewtask param is present
  useEffect(() => {
    if (viewTaskId) {
      const fetchTask = async () => {
        setIsLoadingTask(true);
        try {
          const response = await fetch(`/api/tasks/lookup/${viewTaskId}`, {
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error("Task not found");
          }

          const fetchedTask = await response.json();
          const mappedTask = {
            ...fetchedTask,
            title: fetchedTask.name,
            dueDate: fetchedTask.deadline, // Map deadline to dueDate
            subtasks: fetchedTask.subtasks?.map((st: any) => ({
              ...st,
              title: st.name,
              dueDate: st.deadline, // Map deadline to dueDate for subtasks
            })),
          };

          setSelectedTask(mappedTask);
        } catch (error) {
          console.error("Failed to fetch task:", error);
          toast.error("Task not found");
          handleCloseModal();
        } finally {
          setIsLoadingTask(false);
        }
      };

      fetchTask();
    } else {
      setSelectedTask(null);
    }
  }, [viewTaskId]);

  const handleCloseModal = () => {
    // Remove query param to close modal
    const params = new URLSearchParams(searchParams.toString());
    params.delete("viewtask");
    router.push(`/user/tasks${params.toString() ? `?${params.toString()}` : ""}`);
    setSelectedTask(null);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      // Just update local state - the component already saved via API
      setSelectedTask(updatedTask);
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error; // Let the component handle the error
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksApi.delete(taskId);
      toast.success("Task deleted successfully");
      handleCloseModal();
      // Refresh the board
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="h-full w-full">
      <KanbanBoard />

      {/* Task Detail Modal - Controlled by URL query param */}
      {selectedTask && !isLoadingTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={handleCloseModal}
          task={selectedTask}
          columnId={selectedTask.columnId}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
