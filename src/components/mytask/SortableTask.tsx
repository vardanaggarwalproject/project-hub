"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import { Task } from "./dummy-data";

interface SortableTaskProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onViewDetail?: (task: Task) => void;
  isSubtask?: boolean;
}

export function SortableTask({ task, onEdit, onDelete, onViewDetail, isSubtask = false }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetail={onViewDetail}
        isDragging={isDragging}
        isSubtask={isSubtask}
      />
    </div>
  );
}
