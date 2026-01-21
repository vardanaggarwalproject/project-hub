"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Task, Priority } from "./dummy-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assigneeName: z.string().optional(),
  assigneeInitials: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, "id">) => void;
  columnId?: string;
  editTask?: Task;
}

export function AddTaskModal({
  isOpen,
  onClose,
  onSubmit,
  columnId,
  editTask,
}: AddTaskModalProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: editTask?.title || "",
      description: editTask?.description || "",
      priority: editTask?.priority || "medium",
      dueDate: editTask?.dueDate || "",
      assigneeName: editTask?.assignee?.name || "",
      assigneeInitials: editTask?.assignee?.initials || "",
    },
  });

  const handleSubmit = (data: TaskFormData) => {
    const newTask: Omit<Task, "id"> = {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      dueDate: data.dueDate || undefined,
      assignee:
        data.assigneeName && data.assigneeInitials
          ? {
              name: data.assigneeName,
              initials: data.assigneeInitials,
            }
          : undefined,
    };

    onSubmit(newTask);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editTask ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {editTask
              ? "Update the task details below"
              : "Create a new task with the details below"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description (optional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Priority <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Low
                        </span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="high">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          High
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignee Name */}
            <FormField
              control={form.control}
              name="assigneeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assignee name (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignee Initials */}
            <FormField
              control={form.control}
              name="assigneeInitials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Initials</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., JD"
                      maxLength={3}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editTask ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
