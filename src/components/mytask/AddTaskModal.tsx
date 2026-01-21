"use client";

import { useState, useEffect, useRef } from "react";
import { Task, Priority } from "./dummy-data";
import { User } from "./UserSelectInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Calendar, Users, Flag, X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  clientName?: string;
}

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
  const [title, setTitle] = useState(editTask?.title || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [priority, setPriority] = useState<Priority>(
    editTask?.priority || "medium",
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    editTask?.dueDate
      ? { from: new Date(editTask.dueDate), to: new Date(editTask.dueDate) }
      : undefined,
  );
  const [selectedUsers, setSelectedUsers] = useState<User[]>(
    editTask?.assignees || [],
  );
  const [selectedProject, setSelectedProject] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [userSearch, setUserSearch] = useState("");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);

  // Fetch ALL projects (using getAllProjects flag to bypass role filtering)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects?limit=1000&page=1&getAllProjects=true");
        if (response.ok) {
          const result = await response.json();
          setProjects(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users?limit=100");
        if (response.ok) {
          const result = await response.json();
          setAvailableUsers(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = availableUsers.filter(
    (u) =>
      !selectedUsers.some((su) => su.id === u.id) &&
      (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())),
  );

  const handleAddUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setUserSearch("");
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const newTask: Omit<Task, "id"> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      assignees: selectedUsers,
      tags: editTask?.tags || [],
    };

    onSubmit(newTask);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDateRange(undefined);
    setSelectedUsers([]);
    setSelectedProject("");
    setUserSearch("");
    onClose();
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[70vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editTask ? "Edit Task" : "Create a new task"}
            </DialogTitle>
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Status:</span>
              <Badge
                variant="secondary"
                className={cn(
                  "px-3 py-1 font-semibold uppercase text-xs tracking-wide",
                  columnId === "column-1" && "bg-blue-100 text-blue-700",
                  columnId === "column-2" && "bg-yellow-100 text-yellow-700",
                  columnId === "column-3" && "bg-green-100 text-green-700",
                )}
              >
                {columnId === "column-1" && "TO DO"}
                {columnId === "column-2" && "IN PROGRESS"}
                {columnId === "column-3" && "COMPLETE"}
                {!columnId && "TO DO"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Task Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Task Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Task Name or type '/' for commands"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Description
            </label>
            <Textarea
              placeholder="Add description, or write with AI"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-none border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 text-sm min-h-[140px]"
            />
          </div>

          {/* Selected Assignees as Tags */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="flex items-center gap-2 pl-1 pr-2 py-1"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{user.name}</span>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {/* Project Selector */}
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
              disabled={isLoadingProjects}
            >
              <SelectTrigger className="w-[150px] h-9 hover:bg-gray-100 bg-white text-xs">
                <SelectValue
                  placeholder={
                    isLoadingProjects ? "Loading..." : "Select Project"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ WebkitOverflowScrolling: 'touch' }}>
                {isLoadingProjects ? (
                  <div className="p-4 space-y-2">
                    <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No projects found
                  </div>
                )}
              </SelectContent>
            </Select>

            {/* Assignee Button */}
            <Popover
              open={assigneePopoverOpen}
              onOpenChange={setAssigneePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 hover:bg-gray-100 bg-white text-xs px-3"
                >
                  <Users className="h-3.5 w-3.5" />
                  Assignee
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <div className="p-3">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search or enter email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="max-h-[250px] overflow-y-auto pr-1 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      <div className="space-y-1">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleAddUser(user)}
                            className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100 transition-colors text-left"
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={user.image || ""} />
                              <AvatarFallback className="text-xs bg-blue-500 text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        {userSearch ? "No users found" : "All users selected"}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Range Picker */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Due date"
              className="w-[200px]"
              fromDate={new Date(new Date().setHours(0, 0, 0, 0))}
              disableFuture={false}
            />

            {/* Priority */}
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger className="h-9 w-[130px] gap-1.5 hover:bg-gray-100 bg-white text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      priority === "high" && "bg-red-500",
                      priority === "medium" && "bg-yellow-500",
                      priority === "low" && "bg-green-500",
                    )}
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    High
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Low
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()} size="sm">
              {editTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
