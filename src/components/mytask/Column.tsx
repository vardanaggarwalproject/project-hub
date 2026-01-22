"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { MoreVertical, Plus, Trash2, Edit2 } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { Column as ColumnType, Task } from "./dummy-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ColumnProps {
  column: ColumnType;
  onAddTask?: (columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onRenameColumn?: (columnId: string, newTitle: string) => void;
  onEditColumn?: (column: ColumnType) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onViewDetailTask?: (task: Task) => void;
  children?: React.ReactNode;
}

export function Column({
  column,
  onAddTask,
  onDeleteColumn,
  onRenameColumn,
  onEditColumn,
  onEditTask,
  onDeleteTask,
  onViewDetailTask,
  children,
}: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      onRenameColumn?.(column.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditTitle(column.title);
      setIsEditing(false);
    }
  };

  // Get header background color style (subtle)
  const getHeaderStyle = () => {
    if (!column.color) return {};
    return {
      backgroundColor: `${column.color}18`, // 18 = subtle but visible opacity for header
    };
  };

  // Get title badge style with solid column color
  const getTitleBadgeStyle = () => {
    if (!column.color) {
      return {
        backgroundColor: "#6B7280",
      };
    }
    return {
      backgroundColor: column.color,
    };
  };

  // Get count badge border style with column color
  const getCountBadgeBorderStyle = () => {
    if (!column.color) {
      return {
        borderColor: "#D1D5DB", // gray-300
      };
    }
    return {
      borderColor: column.color,
    };
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={`flex flex-col min-w-[280px] overflow-hidden max-w-[280px] h-[calc(100vh-200px)] bg-app-card rounded-lg border shadow-sm transition-colors ${
          isOver ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""
        }`}
      >
        {/* Column Header - Compact with Colored Background */}
        <div
          className="flex-shrink-0 px-3 py-2.5 border-b"
          style={getHeaderStyle()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={handleKeyDown}
                  className="h-6 text-sm font-semibold px-2"
                  autoFocus
                />
              ) : (
                <>
                  <div
                    className="px-2.5 py-1 rounded-md text-white text-xs font-bold uppercase tracking-wide shadow-sm"
                    style={getTitleBadgeStyle()}
                  >
                    {column.title}
                  </div>
                  <div
                    className="flex items-center justify-center w-6 h-6 px-1 text-center
                     rounded-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-semibold border border-dashed"
                    style={getCountBadgeBorderStyle()}
                  >
                    {column.tasks.length}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Add Task Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onAddTask?.(column.id)}
                title="Add task"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onEditColumn?.(column)}
                    className="cursor-pointer text-sm"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit Column
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer text-sm"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteAlert(true)}
                    className="cursor-pointer text-sm text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tasks Container with Vertical Scroll */}
        <div className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden">
          <div className="space-y-2">
            {children ? (
              children
            ) : (
              <>
                {column.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No tasks
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onViewDetail={onViewDetailTask}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Minimal Add Task Button */}
        <div className="flex-shrink-0 px-3 py-2 border-t">
          <button
            onClick={() => onAddTask?.(column.id)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors w-full"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add item</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{column.title}"? This will also
              delete all {column.tasks.length} task(s). This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteColumn?.(column.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
