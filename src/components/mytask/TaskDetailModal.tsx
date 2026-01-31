"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "./dummy-data";
import { TaskDetailView } from "./TaskDetailView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Maximize2, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnId?: string;
  columnTitle?: string;
  columnColor?: string;
  onEdit?: (task: Task) => void;
  onSave?: (task: Task) => Promise<void>;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  columnId,
  columnTitle,
  columnColor,
  onEdit,
  onSave,
  onDelete,
}: TaskDetailModalProps) {
  const router = useRouter();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Maximize task - navigate to dedicated page
  const handleMaximize = () => {
    if (task) {
      const shortId = (task as any).shortId || task.id.slice(0, 8);
      onClose();
      router.push(`/user/tasks/${shortId}`);
    }
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      setShowDeleteAlert(false);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-[90vw] !w-[1400px] h-[85vh] p-0 gap-0 flex flex-col" showCloseButton={false}>
          <DialogTitle className="sr-only">{task.title}</DialogTitle>
          <DialogDescription className="sr-only">
            View and edit task details
          </DialogDescription>

          {/* Header - Fixed */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b bg-white">
            <div className="flex items-center gap-2">
              {columnTitle && (
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 font-medium text-xs text-white rounded"
                  style={{ backgroundColor: columnColor || "#6B7280" }}
                >
                  {columnTitle}
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                Task ID: {(task as any).shortId || task.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMaximize}
                className="h-7 w-7"
                title="Open in new page"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>

              {/* Three-dot menu */}
              {onDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3.5 w-3.5" />
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
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Unified Task Detail View */}
          <div className="flex-1 overflow-hidden" style={{ height: 'calc(85vh - 50px)' }}>
            <TaskDetailView task={task} onSave={onSave} onDelete={onDelete} />
          </div>
        </DialogContent>
      </Dialog>

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
