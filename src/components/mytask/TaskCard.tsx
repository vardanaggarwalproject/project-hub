"use client";

import { useState } from "react";
import { Calendar, MoreVertical, Trash2, Edit, Circle } from "lucide-react";
import { Task, getPriorityColor, formatDate } from "./dummy-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserAvatarColor } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onViewDetail?: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onViewDetail, isDragging }: TaskCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on dropdown menu or buttons
    if ((e.target as HTMLElement).closest('[role="menu"]') ||
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    onViewDetail?.(task);
  };

  const handleDelete = () => {
    onDelete?.(task.id);
    setShowDeleteAlert(false);
  };

  // Get priority circle color
  const getPriorityCircleColor = () => {
    switch (task.priority) {
      case "high":
        return "fill-red-500 text-red-500";
      case "medium":
        return "fill-yellow-500 text-yellow-500";
      case "low":
        return "fill-green-500 text-green-500";
      default:
        return "fill-gray-400 text-gray-400";
    }
  };

  return (
    <>
    <div
      onClick={handleCardClick}
      className={`group bg-app-card border rounded px-2.5 py-2 cursor-pointer transition-all hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-700 ${
        isDragging ? "opacity-50 rotate-1 scale-105" : ""
      }`}
    >
      {/* Task Title with Status Icon */}
      <div className="flex items-start gap-2 mb-1.5">
        <Circle className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${getPriorityCircleColor()}`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm leading-tight text-app-heading font-normal truncate">
            {task.title}
          </h4>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit?.(task)}
              className="cursor-pointer text-sm"
            >
              <Edit className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteAlert(true);
              }}
              className="cursor-pointer text-sm text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description - Only if exists */}
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-1 mb-2 ml-5">
          {task.description}
        </p>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between gap-2 ml-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority Badge - Smaller */}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-4 capitalize font-normal ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </Badge>

          {/* Due Date */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[10px] ${
                isOverdue
                  ? "text-red-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Assignees - Smaller Avatars */}
        {task.assignees && task.assignees.length > 0 && (
          <TooltipProvider>
            <div className="flex items-center -space-x-2">
              {task.assignees.slice(0, 3).map((assignee) => (
                <Tooltip key={assignee.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-5 w-5 border border-white shadow-sm">
                      <AvatarImage src={assignee.image || ""} />
                      <AvatarFallback className={`text-[10px] text-white ${getUserAvatarColor(assignee.id)}`}>
                        {assignee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{assignee.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {task.assignees.length > 3 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-5 w-5 rounded-full bg-gray-200 border border-white shadow-sm flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-600">
                        +{task.assignees.length - 3}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {task.assignees.slice(3).map((assignee) => (
                        <p key={assignee.id} className="text-xs">{assignee.name}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Task?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "<strong className="text-gray-900">{task.title}</strong>"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteAlert(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
