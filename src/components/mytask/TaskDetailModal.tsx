"use client";

import { useState, useEffect } from "react";
import { Task, Priority } from "./dummy-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, FolderKanban, X, Edit2, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  clientName?: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnId?: string;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  columnId,
  onEdit,
  onDelete,
}: TaskDetailModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Fetch project details if projectId exists
  useEffect(() => {
    if (task?.projectId) {
      const fetchProject = async () => {
        setIsLoadingProject(true);
        try {
          const response = await fetch(`/api/projects?limit=1&search=${task.projectId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.length > 0) {
              setProject(result.data[0]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch project:", error);
        } finally {
          setIsLoadingProject(false);
        }
      };
      fetchProject();
    } else {
      setProject(null);
    }
  }, [task?.projectId]);

  if (!task) return null;

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
    }
  };

  const getPriorityIcon = (p: Priority) => {
    switch (p) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
    }
  };

  const getStatusInfo = () => {
    switch (columnId) {
      case "column-1":
        return { label: "TO DO", color: "bg-blue-100 text-blue-700" };
      case "column-2":
        return { label: "IN PROGRESS", color: "bg-yellow-100 text-yellow-700" };
      case "column-3":
        return { label: "COMPLETE", color: "bg-green-100 text-green-700" };
      default:
        return { label: "TO DO", color: "bg-blue-100 text-blue-700" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-5 border-b">
          <div className="flex items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Task Details
              </DialogTitle>
              <Badge
                variant="secondary"
                className={cn(
                  "px-3 py-1 font-semibold uppercase text-xs tracking-wide",
                  statusInfo.color
                )}
              >
                {statusInfo.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          onEdit(task);
                          onClose();
                        }}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Edit Task</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onDelete && (
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          onDelete(task.id);
                          onClose();
                        }}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Delete Task</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Task Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Task Name
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-semibold text-gray-900">
                {task.title}
              </h2>
              <Badge
                variant="secondary"
                className={cn(
                  "px-3 py-1.5 font-semibold text-sm capitalize",
                  getPriorityColor(task.priority)
                )}
              >
                <span className="mr-1.5">{getPriorityIcon(task.priority)}</span>
                {task.priority}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </label>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Due Date */}
            {task.dueDate && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Due Date
                </label>
                <div className="text-sm font-medium text-gray-900">
                  {format(new Date(task.dueDate), "MMMM dd, yyyy")}
                </div>
              </div>
            )}

            {/* Project */}
            {task.projectId && (
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5" />
                  Project
                </label>
                {isLoadingProject ? (
                  <div className="h-6 bg-gray-100 rounded animate-pulse w-48"></div>
                ) : project ? (
                  <div className="text-sm font-medium text-gray-900">
                    {project.name}
                    {project.clientName && (
                      <span className="text-gray-500 ml-2">
                        ({project.clientName})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No project assigned</div>
                )}
              </div>
            )}
          </div>

          {/* Assignees */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Assignees ({task.assignees.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="text-xs bg-blue-500 text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500 uppercase">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-2.5 py-1 text-xs font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
