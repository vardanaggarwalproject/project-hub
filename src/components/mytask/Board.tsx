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
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { SortableTask } from "./SortableTask";
import { AddColumnButton } from "./AddColumnButton";
import { AddTaskModal } from "./AddTaskModal";
import { EditColumnModal } from "./EditColumnModal";
import { Column as ColumnType, Task } from "./dummy-data";

interface BoardProps {
  columns: ColumnType[];
  onColumnsChange: (columns: ColumnType[]) => void;
}

export function Board({ columns, onColumnsChange }: BoardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<ColumnType | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevColumnCountRef = useRef(columns.length);

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
  const handleAddColumn = (
    title: string,
    color: string,
    description?: string,
  ) => {
    const newColumn: ColumnType = {
      id: `column-${Date.now()}`,
      title,
      color,
      tasks: [],
    };
    onColumnsChange([...columns, newColumn]);
  };

  // Delete column
  const handleDeleteColumn = (columnId: string) => {
    onColumnsChange(columns.filter((col) => col.id !== columnId));
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
  const handleUpdateColumn = (
    columnId: string,
    title: string,
    color: string,
    description?: string,
  ) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === columnId ? { ...col, title, color } : col,
      ),
    );
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
  const handleSubmitTask = (taskData: Omit<Task, "id">) => {
    if (!selectedColumnId) return;

    if (editingTask) {
      // Update existing task
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
    } else {
      // Add new task
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
      };

      onColumnsChange(
        columns.map((col) =>
          col.id === selectedColumnId
            ? { ...col, tasks: [...col.tasks, newTask] }
            : col,
        ),
      );
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    onColumnsChange(
      columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      })),
    );
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = findColumnByTaskId(overId) || findColumnById(overId);

    if (!activeColumn || !overColumn) return;

    // Moving task to a different column
    if (activeColumn.id !== overColumn.id) {
      const activeTask = activeColumn.tasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      const overTask = overColumn.tasks.find((t) => t.id === overId);
      const overIndex = overTask
        ? overColumn.tasks.indexOf(overTask)
        : overColumn.tasks.length;

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
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = findColumnByTaskId(overId) || findColumnById(overId);

    if (!activeColumn) return;

    // Reordering within the same column
    if (activeColumn.id === overColumn?.id) {
      const oldIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
      const newIndex = activeColumn.tasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        onColumnsChange(
          columns.map((col) => {
            if (col.id === activeColumn.id) {
              return {
                ...col,
                tasks: arrayMove(col.tasks, oldIndex, newIndex),
              };
            }
            return col;
          }),
        );
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
        collisionDetection={closestCorners}
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
                >
                  {column.tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      Drop tasks here
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {column.tasks.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </Column>
              </SortableContext>
            ))}

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
        editTask={editingTask || undefined}
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
    </div>
  );
}
