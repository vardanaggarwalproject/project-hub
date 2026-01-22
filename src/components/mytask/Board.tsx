"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Column } from "./Column";
import { ColumnSkeleton } from "./ColumnSkeleton";
import { TaskCard } from "./TaskCard";
import { SortableTask } from "./SortableTask";
import { EmptyColumnDropZone } from "./EmptyColumnDropZone";
import { AddColumnButton } from "./AddColumnButton";
import { AddTaskModal } from "./AddTaskModal";
import { EditColumnModal } from "./EditColumnModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { Column as ColumnType, Task } from "./dummy-data";
import { tasksApi, columnsApi } from "@/lib/api/client";
import { toast } from "sonner";

interface BoardProps {
  columns: ColumnType[];
  onColumnsChange: (columns: ColumnType[]) => void;
  projectId: string;
}

export function Board({ columns, onColumnsChange, projectId }: BoardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<ColumnType | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [draggedTaskOriginalColumn, setDraggedTaskOriginalColumn] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevColumnCountRef = useRef(columns.length);
  const lastOverIdRef = useRef<string | null>(null);
  const dragOverFrameRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Auto-scroll to the right when a new column is added
  useEffect(() => {
    if (columns.length > prevColumnCountRef.current) {
      // A new column was added, scroll to the right
      if (scrollContainerRef.current) {
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({
            left: scrollContainerRef.current.scrollWidth,
            behavior: "smooth",
          });
        }, 100);
      }
    }
    prevColumnCountRef.current = columns.length;
  }, [columns.length]);

  // Add new column
  const handleAddColumn = async (
    title: string,
    color: string,
    description?: string,
  ) => {
    setIsAddingColumn(true);
    try {
      const newColumn = await columnsApi.create({
        title,
        color,
        projectId,
      });

      onColumnsChange([
        ...columns,
        { ...newColumn, tasks: [] },
      ]);
      toast.success("Column created successfully");
    } catch (error) {
      console.error("Failed to create column:", error);
      toast.error("Failed to create column");
    } finally {
      setIsAddingColumn(false);
    }
  };

  // Delete column
  const handleDeleteColumn = async (columnId: string) => {
    try {
      await columnsApi.delete(columnId);
      onColumnsChange(columns.filter((col) => col.id !== columnId));
      toast.success("Column deleted successfully");
    } catch (error) {
      console.error("Failed to delete column:", error);
      toast.error("Failed to delete column");
    }
  };

  // Rename column
  const handleRenameColumn = (columnId: string, newTitle: string) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === columnId ? { ...col, title: newTitle } : col,
      ),
    );
  };

  // Open edit column modal
  const handleEditColumn = (column: ColumnType) => {
    setEditingColumn(column);
    setIsEditColumnModalOpen(true);
  };

  // Update column (title, color, description)
  const handleUpdateColumn = async (
    columnId: string,
    title: string,
    color: string,
    description?: string,
  ) => {
    try {
      await columnsApi.update(columnId, { title, color });
      onColumnsChange(
        columns.map((col) =>
          col.id === columnId ? { ...col, title, color } : col,
        ),
      );
      toast.success("Column updated successfully");
    } catch (error) {
      console.error("Failed to update column:", error);
      toast.error("Failed to update column");
    }
  };

  // Open add task modal
  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Open edit task modal
  const handleEditTask = (task: Task) => {
    // Find which column contains this task
    const column = columns.find((col) =>
      col.tasks.some((t) => t.id === task.id),
    );
    if (column) {
      setSelectedColumnId(column.id);
      setEditingTask(task);
      setIsTaskModalOpen(true);
    }
  };

  // Add or update task
  const handleSubmitTask = async (taskData: Omit<Task, "id">) => {
    if (!selectedColumnId) return;

    try {
      if (editingTask) {
        // Update existing task
        const updated = await tasksApi.update(editingTask.id, {
          name: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          deadline: taskData.dueDate,
          assignedUserIds: taskData.assignees?.map((a) => a.id) || [],
        });

        onColumnsChange(
          columns.map((col) =>
            col.id === selectedColumnId
              ? {
                  ...col,
                  tasks: col.tasks.map((t) =>
                    t.id === editingTask.id ? { ...taskData, id: t.id } : t,
                  ),
                }
              : col,
          ),
        );
        toast.success("Task updated successfully");
      } else {
        // Add new task
        const newTask = await tasksApi.create({
          name: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          deadline: taskData.dueDate,
          projectId,
          columnId: selectedColumnId,
          assignedUserIds: taskData.assignees?.map((a) => a.id) || [],
        });

        const taskToAdd: Task = {
          id: newTask.id,
          title: newTask.name,
          description: newTask.description || "",
          priority: newTask.priority,
          dueDate: newTask.deadline,
          assignees: newTask.assignees || [],
          projectId: newTask.projectId,
        };

        onColumnsChange(
          columns.map((col) =>
            col.id === selectedColumnId
              ? { ...col, tasks: [...col.tasks, taskToAdd] }
              : col,
          ),
        );
        toast.success("Task created successfully");
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error("Failed to save task");
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksApi.delete(taskId);
      onColumnsChange(
        columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        })),
      );
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  // View task detail
  const handleViewTaskDetail = (task: Task) => {
    // Find which column contains this task
    const column = columns.find((col) =>
      col.tasks.some((t) => t.id === task.id),
    );
    if (column) {
      setSelectedColumnId(column.id);
      setSelectedTask(task);
      setIsTaskDetailModalOpen(true);
    }
  };

  // Save task from detail modal (without opening AddTaskModal)
  const handleSaveTaskFromDetail = async (updatedTask: Task) => {
    if (!selectedColumnId) return;

    try {
      // Update task via API
      await tasksApi.update(updatedTask.id, {
        name: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        deadline: updatedTask.dueDate,
        assignedUserIds: updatedTask.assignees?.map((a) => a.id) || [],
      });

      // Update local state
      onColumnsChange(
        columns.map((col) =>
          col.id === selectedColumnId
            ? {
                ...col,
                tasks: col.tasks.map((t) =>
                  t.id === updatedTask.id ? updatedTask : t
                ),
              }
            : col
        )
      );

      // Update selected task to reflect changes in the modal
      setSelectedTask(updatedTask);

      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
      throw error; // Re-throw so the modal can handle it
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    const originalColumn = findColumnByTaskId(active.id as string);
    setActiveTask(task);
    setDraggedTaskOriginalColumn(originalColumn?.id || null);
    lastOverIdRef.current = null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      lastOverIdRef.current = null;
      if (dragOverFrameRef.current) {
        cancelAnimationFrame(dragOverFrameRef.current);
        dragOverFrameRef.current = null;
      }
      return;
    }

    const activeId = active.id as string;
    let overId = over.id as string;

    // Handle empty column drop zone (ID format: "columnId-empty")
    if (overId.endsWith("-empty")) {
      overId = overId.replace("-empty", "");
    }

    if (activeId === overId) return;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = findColumnByTaskId(overId) || findColumnById(overId);

    if (!activeColumn || !overColumn) return;

    // Only process if moving to a different column
    if (activeColumn.id !== overColumn.id) {
      const activeTask = activeColumn.tasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      // Check if task is already in the destination column to prevent infinite updates
      const isAlreadyInColumn = overColumn.tasks.some((t) => t.id === activeId);
      if (isAlreadyInColumn) return;

      const overTask = overColumn.tasks.find((t) => t.id === overId);
      const overIndex = overTask
        ? overColumn.tasks.indexOf(overTask)
        : overColumn.tasks.length;

      // Create a unique key including column IDs and index to prevent redundant updates
      const overKey = `${activeId}-${activeColumn.id}-${overColumn.id}-${overIndex}`;
      if (lastOverIdRef.current === overKey) return;
      lastOverIdRef.current = overKey;

      // Cancel any pending frame
      if (dragOverFrameRef.current) {
        cancelAnimationFrame(dragOverFrameRef.current);
      }

      // Use requestAnimationFrame to batch state updates
      dragOverFrameRef.current = requestAnimationFrame(() => {
        onColumnsChange(
          columns.map((col) => {
            if (col.id === activeColumn.id) {
              return {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== activeId),
              };
            }
            if (col.id === overColumn.id) {
              const newTasks = [...col.tasks];
              newTasks.splice(overIndex, 0, activeTask);
              return { ...col, tasks: newTasks };
            }
            return col;
          }),
        );
        dragOverFrameRef.current = null;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;

    // Cancel any pending animation frame
    if (dragOverFrameRef.current) {
      cancelAnimationFrame(dragOverFrameRef.current);
      dragOverFrameRef.current = null;
    }

    // Reset refs
    lastOverIdRef.current = null;

    if (!over) {
      setActiveTask(null);
      setDraggedTaskOriginalColumn(null);
      return;
    }

    let overId = over.id as string;

    // Handle empty column drop zone (ID format: "columnId-empty")
    if (overId.endsWith("-empty")) {
      overId = overId.replace("-empty", "");
    }

    // Get destination column (where we're dropping)
    let destinationColumn = findColumnByTaskId(overId) || findColumnById(overId);

    // Use the original column we saved in handleDragStart
    const sourceColumnId = draggedTaskOriginalColumn;

    setActiveTask(null);
    setDraggedTaskOriginalColumn(null);

    if (!destinationColumn || !sourceColumnId) {
      return;
    }

    // If dropped in the same column as original, handle reordering
    if (sourceColumnId === destinationColumn.id) {
      const column = columns.find((c) => c.id === sourceColumnId);
      if (!column) return;

      const oldIndex = column.tasks.findIndex((t) => t.id === activeId);
      const newIndex = column.tasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        try {
          await tasksApi.reorder({
            taskId: activeId,
            sourceColumnId,
            destinationColumnId: sourceColumnId,
            position: newIndex,
          });
        } catch (error) {
          console.error("Failed to reorder task:", error);
          toast.error("Failed to save task order");
        }
      }
    } else {
      // Moving to different column
      const task = findTaskById(activeId);
      if (!task) return;

      const newIndex = destinationColumn.tasks.findIndex((t) => t.id === overId);
      const position = newIndex !== -1 ? newIndex : destinationColumn.tasks.length;

      // UI already updated by handleDragOver, just persist to database
      try {
        await tasksApi.reorder({
          taskId: activeId,
          sourceColumnId,
          destinationColumnId: destinationColumn.id,
          position,
        });
        toast.success(`Moved to ${destinationColumn.title}`);
      } catch (error) {
        console.error("Failed to move task:", error);
        toast.error("Failed to move task");
        // Reload from server on error
        window.location.reload();
      }
    }
  };

  // Helper functions
  const findTaskById = (taskId: string): Task | null => {
    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return null;
  };

  const findColumnByTaskId = (taskId: string): ColumnType | null => {
    return (
      columns.find((col) => col.tasks.some((t) => t.id === taskId)) || null
    );
  };

  const findColumnById = (columnId: string): ColumnType | null => {
    return columns.find((col) => col.id === columnId) || null;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Board Container - Horizontal Scroll Only */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden p-3"
        >
          <div className="flex gap-3 h-full">
            {/* Render Columns */}
            {columns.map((column) => (
              <SortableContext
                key={column.id}
                items={column.tasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <Column
                  column={column}
                  onAddTask={handleAddTask}
                  onDeleteColumn={handleDeleteColumn}
                  onRenameColumn={handleRenameColumn}
                  onEditColumn={handleEditColumn}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onViewDetailTask={handleViewTaskDetail}
                >
                  {column.tasks.length === 0 ? (
                    <EmptyColumnDropZone columnId={column.id} />
                  ) : (
                    <div className="space-y-2">
                      {column.tasks.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onViewDetail={handleViewTaskDetail}
                        />
                      ))}
                    </div>
                  )}
                </Column>
              </SortableContext>
            ))}

            {/* Loading Skeleton for Adding Column */}
            {isAddingColumn && <ColumnSkeleton />}

            {/* Add Column Button */}
            <div className="flex-shrink-0">
              <AddColumnButton onAddColumn={handleAddColumn} />
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setSelectedColumnId(null);
        }}
        onSubmit={handleSubmitTask}
        columnId={selectedColumnId || undefined}
        columnTitle={
          selectedColumnId
            ? columns.find((col) => col.id === selectedColumnId)?.title
            : undefined
        }
        columnColor={
          selectedColumnId
            ? columns.find((col) => col.id === selectedColumnId)?.color
            : undefined
        }
        editTask={editingTask || undefined}
        projectId={projectId}
      />

      {/* Edit Column Modal */}
      <EditColumnModal
        isOpen={isEditColumnModalOpen}
        onClose={() => {
          setIsEditColumnModalOpen(false);
          setEditingColumn(null);
        }}
        onSubmit={handleUpdateColumn}
        column={editingColumn}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
          setSelectedColumnId(null);
        }}
        task={selectedTask}
        columnId={selectedColumnId || undefined}
        columnTitle={
          selectedColumnId
            ? columns.find((col) => col.id === selectedColumnId)?.title
            : undefined
        }
        columnColor={
          selectedColumnId
            ? columns.find((col) => col.id === selectedColumnId)?.color
            : undefined
        }
        onEdit={handleEditTask}
        onSave={handleSaveTaskFromDetail}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
