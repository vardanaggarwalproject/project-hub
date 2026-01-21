"use client";

import { Calendar, MoreVertical, Trash2, Edit, Circle } from "lucide-react";
import { Task, getPriorityColor, formatDate } from "./dummy-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, isDragging }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      className={`group bg-app-card border rounded px-2.5 py-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-700 ${
        isDragging ? "opacity-50 rotate-1 scale-105" : ""
      }`}
    >
      {/* Task Title with Status Icon */}
      <div className="flex items-start gap-2 mb-1.5">
        <Circle className="h-3.5 w-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
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
              onClick={() => onDelete?.(task.id)}
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

        {/* Assignee - Smaller Avatar */}
        {task.assignee && (
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {task.assignee.initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
