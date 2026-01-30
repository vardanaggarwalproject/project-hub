"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

interface EmptyColumnDropZoneProps {
  columnId: string;
}

export function EmptyColumnDropZone({ columnId }: EmptyColumnDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${columnId}-empty`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`text-center py-6 px-3 text-gray-400 text-xs flex items-center justify-center gap-1 rounded border-2 border-dashed transition-colors ${
        isOver ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200"
      }`}
    >
      Create your task by Clicking on <Plus className="w-3.5 h-3.5"/>
    </div>
  );
}
