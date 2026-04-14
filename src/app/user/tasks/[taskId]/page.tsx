"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { tasksApi } from "@/lib/api/client";
import { Task } from "@/components/mytask/dummy-data";
import { TaskDetailView } from "@/components/mytask/TaskDetailView";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { getUserAvatarColor } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/mytask/ConfirmationDialog";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tasks/lookup/${taskId}`, {
          cache: "no-store",
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

        setTask(mappedTask);
      } catch (error) {
        console.error("Failed to fetch task:", error);
        toast.error("Failed to load task");
        router.push("/user/tasks");
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId, router]);

  const handleSave = async (updatedTask: Task) => {
    try {
      // Just update local state - the component already saved via API
      setTask(updatedTask);
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error; // Let the component handle the error
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    try {
      await tasksApi.delete(task.id);
      toast.success("Task deleted successfully");
      setShowDeleteAlert(false);
      router.push("/user/tasks");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <>
      <div className="h-[87vh] bg-white flex flex-col overflow-hidden">
        {/* Back Button + Three-dot menu */}
        <div className="shrink-0 border-b bg-white">
          <div className="max-w-350 mx-auto px-6 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()} className="h-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={() => setShowDeleteAlert(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Unified Task Detail View */}
        <div className="flex-1 max-w-350 mx-auto w-full overflow-hidden">
          <TaskDetailView task={task} onSave={handleSave} onDelete={handleDelete} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        onConfirm={handleDelete}
        title="Delete Task?"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
