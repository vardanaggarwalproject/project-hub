"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Task, Priority } from "./dummy-data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Users,
  FolderKanban,
  X,
  Flag,
  CalendarDays,
  Circle,
  Loader2,
  Save,
  Send,
  FileText,
  MoreVertical,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getUserAvatarColor } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { User } from "./UserSelectInput";
import { AddTaskModal } from "./AddTaskModal";
import { toast } from "sonner";
import { taskCommentsApi, tasksApi } from "@/lib/api/client";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface Column {
  id: string;
  title: string;
  color: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface TaskDetailViewProps {
  task: Task;
  onSave?: (task: Task) => Promise<void>;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailView({ task, onSave, onDelete }: TaskDetailViewProps) {
  const router = useRouter();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Column/Status info
  const [column, setColumn] = useState<Column | null>(null);
  const [isLoadingColumn, setIsLoadingColumn] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // Inline editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task?.description || "");
  const [selectedPriority, setSelectedPriority] = useState<Priority>(task?.priority || "medium");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [selectedUsers, setSelectedUsers] = useState<User[]>(task?.assignees || []);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with task prop changes
  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || "");
      setSelectedPriority(task.priority || "medium");
      setSelectedDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setSelectedUsers(task.assignees || []);
    }
  }, [task]);

  // Users for assignee selection
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);

  // Subtasks - ensure initial subtasks are properly mapped
  const [subtasks, setSubtasks] = useState<Task[]>(
    task?.subtasks?.map((st: any) => ({
      ...st,
      dueDate: st.dueDate || st.deadline, // Handle both formats
    })) || []
  );
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<string>>(new Set());

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Fetch all columns for the project
  useEffect(() => {
    const fetchColumns = async () => {
      if (!task?.projectId) return;

      setIsLoadingColumns(true);
      try {
        const response = await fetch(`/api/columns?projectId=${task.projectId}`);
        if (response.ok) {
          const columnsData = await response.json();
          setColumns(Array.isArray(columnsData) ? columnsData : []);

          // Set current column from the fetched columns
          if (task.columnId) {
            const currentColumn = columnsData.find((col: Column) => col.id === task.columnId);
            if (currentColumn) {
              setColumn(currentColumn);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch columns:", error);
        setColumns([]);
      } finally {
        setIsLoadingColumns(false);
      }
    };

    fetchColumns();
  }, [task?.projectId, task?.columnId]);

  // Fetch users assigned to the current project
  useEffect(() => {
    const fetchProjectUsers = async () => {
      if (!task?.projectId) return;

      setIsLoadingUsers(true);
      try {
        // Fetch project details to get team members
        const response = await fetch(`/api/projects/${task.projectId}`);
        console.log('👥 Project API response:', response.status);
        if (response.ok) {
          const projectData = await response.json();
          console.log('👥 Project team:', projectData.team);
          // Use team members from project
          setUsers(Array.isArray(projectData.team) ? projectData.team : []);
        } else {
          console.error('❌ Project API failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch project users:", error);
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchProjectUsers();
  }, [task?.projectId]);

  // Fetch subtasks
  useEffect(() => {
    const fetchSubtasks = async () => {
      if (!task?.id) return;

      setIsLoadingSubtasks(true);
      try {
        const response = await fetch(`/api/tasks/${task.id}/subtasks`);
        if (response.ok) {
          const data = await response.json();
          const mappedSubtasks = data.map((st: any) => ({
            ...st,
            title: st.name,
            dueDate: st.deadline, // Map deadline to dueDate
          }));
          setSubtasks(mappedSubtasks);
        }
      } catch (error) {
        console.error("Failed to fetch subtasks:", error);
      } finally {
        setIsLoadingSubtasks(false);
      }
    };

    fetchSubtasks();
  }, [task?.id]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!task?.id) return;

      setIsLoadingComments(true);
      try {
        const fetchedComments = await taskCommentsApi.getByTaskId(task.id);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [task?.id]);

  // Auto-scroll to latest comment
  useEffect(() => {
    if (comments.length > 0 && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  // Track changes
  const hasChanges =
    editedTitle !== task?.title ||
    editedDescription !== (task?.description || "") ||
    selectedPriority !== task?.priority ||
    selectedDate?.toISOString() !== task?.dueDate ||
    JSON.stringify(selectedUsers.map(u => u.id).sort()) !==
      JSON.stringify((task?.assignees || []).map(u => u.id).sort());

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || editedTitle === task.title) {
      setIsEditingTitle(false);
      return;
    }
    await handleSaveChanges();
    setIsEditingTitle(false);
  };

  const handleCancelDescription = () => {
    setEditedDescription(task?.description || "");
    setIsEditingDescription(false);
  };

  const handleSaveChanges = async () => {
    if (!task) return;

    setIsSaving(true);
    try {
      // Update via API
      const response = await tasksApi.update(task.id, {
        name: editedTitle,
        description: editedDescription,
        priority: selectedPriority,
        deadline: selectedDate?.toISOString(),
        assignedUserIds: selectedUsers.map(u => u.id),
      });

      // Update local task object with the response from server
      const updatedTask: Task = {
        ...task,
        title: editedTitle,
        description: editedDescription,
        priority: selectedPriority,
        dueDate: response.deadline || selectedDate?.toISOString(), // Use server response
        assignees: selectedUsers,
      };

      // Call parent's onSave if provided (updates parent state)
      if (onSave) {
        await onSave(updatedTask);
      }

      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !task) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      content: newComment,
      createdAt: new Date().toISOString(),
      user: {
        id: "current-user",
        name: "You",
        image: null,
      },
    };

    setComments((prev) => [...prev, optimisticComment]);
    const commentText = newComment;
    setNewComment("");
    setIsSendingComment(true);

    try {
      const savedComment = await taskCommentsApi.create(task.id, commentText);

      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? savedComment : c))
      );
    } catch (error) {
      console.error("Failed to send comment:", error);
      toast.error("Failed to send comment");
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setNewComment(commentText);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleCreateSubtask = async (subtaskData: any) => {
    if (!task) return;

    try {
      const newSubtask = await tasksApi.create({
        name: subtaskData.title,
        description: subtaskData.description,
        priority: subtaskData.priority,
        deadline: subtaskData.dueDate,
        projectId: task.projectId!,
        columnId: task.columnId!,
        parentTaskId: task.id,
        assignedUserIds: subtaskData.assignees?.map((a: User) => a.id),
      });

      const mappedSubtask = {
        ...newSubtask,
        title: newSubtask.name,
      };

      setSubtasks([...subtasks, mappedSubtask]);
      toast.success("Subtask created successfully");
    } catch (error) {
      console.error("Failed to create subtask:", error);
      toast.error("Failed to create subtask");
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const subtask = subtasks.find(st => st.id === subtaskId);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Subtask?",
      description: `Are you sure you want to delete "${subtask?.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await tasksApi.delete(subtaskId);
          setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
          toast.success("Subtask deleted");
        } catch (error) {
          console.error("Failed to delete subtask:", error);
          toast.error("Failed to delete subtask");
        }
      },
    });
  };

  const handleToggleSubtaskSelection = (subtaskId: string) => {
    const newSelected = new Set(selectedSubtasks);
    if (newSelected.has(subtaskId)) {
      newSelected.delete(subtaskId);
    } else {
      newSelected.add(subtaskId);
    }
    setSelectedSubtasks(newSelected);
  };

  const handleSelectAllSubtasks = () => {
    if (selectedSubtasks.size === subtasks.length) {
      setSelectedSubtasks(new Set());
    } else {
      setSelectedSubtasks(new Set(subtasks.map(st => st.id)));
    }
  };

  const handleBulkDeleteSubtasks = () => {
    if (selectedSubtasks.size === 0) return;

    const count = selectedSubtasks.size;
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${count} Subtask${count > 1 ? 's' : ''}?`,
      description: `Are you sure you want to delete ${count} selected subtask${count > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await Promise.all(
            Array.from(selectedSubtasks).map(id => tasksApi.delete(id))
          );
          setSubtasks(subtasks.filter(st => !selectedSubtasks.has(st.id)));
          setSelectedSubtasks(new Set());
          toast.success(`Deleted ${count} subtask(s)`);
        } catch (error) {
          console.error("Failed to delete subtasks:", error);
          toast.error("Failed to delete subtasks");
        }
      },
    });
  };

  const handleBulkCompleteSubtasks = async () => {
    if (selectedSubtasks.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedSubtasks).map(id =>
          tasksApi.update(id, { status: "done" })
        )
      );
      setSubtasks(subtasks.map(st =>
        selectedSubtasks.has(st.id) ? { ...st, status: "done" } : st
      ));
      setSelectedSubtasks(new Set());
      toast.success(`Completed ${selectedSubtasks.size} subtask(s)`);
    } catch (error) {
      console.error("Failed to complete subtasks:", error);
      toast.error("Failed to complete subtasks");
    }
  };

  const handleOpenSubtask = (subtask: Task) => {
    const shortId = (subtask as any).shortId || subtask.id.slice(0, 8);
    router.push(`/user/tasks/${shortId}`);
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(
    (user) =>
      !selectedUsers.find((u) => u.id === user.id) &&
      user.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getPriorityIconColor = (priority: Priority) => {
    switch (priority) {
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

  if (!task) return null;

  return (
    <div className="flex h-full w-full">
      {/* Left Side - Main Content */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto border-r">
        {/* Task Title */}
        <div>
          {isEditingTitle ? (
            <div className="space-y-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditedTitle(task.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="text-2xl font-semibold border-0 border-b-2 border-blue-500 rounded-none px-0 focus-visible:ring-0"
              />
            </div>
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-2xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 -mx-2 rounded transition-colors"
            >
              {task.title}
            </h1>
          )}
        </div>

        {/* Task ID */}
        <div className="text-xs text-gray-500 pb-3 border-b">
          Task ID: {(task as any).shortId || task.id.slice(0, 8)}
        </div>

        {/* Metadata Grid - ClickUp 2-Column Style */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 py-3 border-b">
          {/* Status */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 w-28 flex-shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              Status
            </label>
            <div className="flex-1">
              {isLoadingColumns ? (
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              ) : columns.length > 0 ? (
                <Select
                  value={task.columnId}
                  onValueChange={(value) => {
                    const newColumn = columns.find(col => col.id === value);
                    if (newColumn) {
                      setColumn(newColumn);
                      // Update task column - this will trigger save if onSave is provided
                      const updatedTask = { ...task, columnId: value };
                      if (onSave) {
                        onSave(updatedTask);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-auto h-7 text-xs hover:bg-gray-100 px-2 border-0">
                    <SelectValue>
                      {column ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: column.color || "#6B7280" }}
                          />
                          <span>{column.title}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Select status</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: col.color || "#6B7280" }}
                          />
                          <span>{col.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-gray-400">No columns available</span>
              )}
            </div>
          </div>

          {/* Assignees */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 w-28 flex-shrink-0">
              <Users className="h-3 w-3" />
              Assignees
            </label>
            <div className="flex-1">
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-auto justify-start h-7 text-sm font-normal hover:bg-gray-100 px-2"
                  >
                    {selectedUsers.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {selectedUsers.slice(0, 3).map((user) => (
                            <Avatar key={user.id} className="h-5 w-5 border-2 border-white">
                              <AvatarImage src={user.image || ""} />
                              <AvatarFallback className={`text-[10px] text-white ${getUserAvatarColor(user.id)}`}>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs">
                          {selectedUsers.length === 1
                            ? selectedUsers[0].name
                            : `${selectedUsers.length} assigned`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Empty</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-3" align="start" side="bottom">
                  {/* User selection UI */}
                  <div className="space-y-2">
                    {/* Search Input */}
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-8 text-xs"
                    />
                    {selectedUsers.length > 0 && (
                      <div className="pb-2 border-b">
                        <div className="text-xs font-medium text-gray-500 mb-1.5">Selected</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUsers.map((user) => (
                            <Badge
                              key={user.id}
                              variant="secondary"
                              className="flex items-center gap-1.5 pl-1 pr-1.5 py-0.5"
                            >
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={user.image || ""} />
                                <AvatarFallback className={`text-[8px] text-white ${getUserAvatarColor(user.id)}`}>
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{user.name}</span>
                              <button
                                onClick={() => handleRemoveUser(user.id)}
                                className="hover:bg-gray-300 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="max-h-[180px] overflow-y-auto">
                      {isLoadingUsers ? (
                        <div className="text-xs text-gray-500 text-center py-4">Loading users...</div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="text-xs text-gray-500 text-center py-4">
                          {users.length === 0 ? 'No users found' : 'No matching users'}
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleAddUser(user)}
                            className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-gray-100"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={user.image || ""} />
                              <AvatarFallback className={`text-[10px] text-white ${getUserAvatarColor(user.id)}`}>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{user.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 w-28 flex-shrink-0">
              <CalendarDays className="h-3 w-3" />
              Due Date
            </label>
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-auto justify-start text-left font-normal h-7 text-xs hover:bg-gray-100 px-2",
                      !selectedDate && "text-gray-400"
                    )}
                  >
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Empty"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 w-28 flex-shrink-0">
              <Flag className="h-3 w-3" />
              Priority
            </label>
            <div className="flex-1">
              <Select
                value={selectedPriority}
                onValueChange={(value: Priority) => setSelectedPriority(value)}
              >
                <SelectTrigger className="w-auto h-7 text-xs hover:bg-gray-100 px-2 border-0">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Circle className={cn("h-2.5 w-2.5", getPriorityIconColor(selectedPriority))} />
                      <span className="capitalize">{selectedPriority}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                      <span>Low</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-2 pt-3 pb-1">
          {!isEditingDescription ? (
            <div
              onClick={() => setIsEditingDescription(true)}
              className="cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-xs font-medium text-gray-700">Description</h3>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap px-0 py-1 rounded hover:bg-gray-50 -mx-2 px-2 transition-colors">
                {editedDescription || task.description || (
                  <span className="text-gray-400">Add a description...</span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-gray-700">Description</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelDescription}
                  className="h-6 text-xs text-gray-500 hover:text-gray-700 px-2"
                >
                  Cancel
                </Button>
              </div>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add a description..."
                className="min-h-[120px] resize-none text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleCancelDescription();
                  }
                }}
              />
              <p className="text-xs text-gray-400">
                Press Esc to cancel • Save Changes button to save
              </p>
            </div>
          )}
        </div>

        {/* Subtasks Section - ClickUp Style Table */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-gray-700">Subtasks</h3>
              {subtasks.length > 0 && (
                <span className="text-xs text-gray-400">
                  {subtasks.filter(st => st.status === "done").length}/{subtasks.length}
                </span>
              )}
            </div>
            {selectedSubtasks.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{selectedSubtasks.size} selected</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleBulkCompleteSubtasks}
                >
                  <Circle className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleBulkDeleteSubtasks}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {isLoadingSubtasks ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_100px_100px_100px_120px_40px] gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={subtasks.length > 0 && selectedSubtasks.size === subtasks.length}
                    onChange={handleSelectAllSubtasks}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                </div>
                <div>Name</div>
                <div>Status</div>
                <div>Assignee</div>
                <div>Priority</div>
                <div>Due date</div>
                <div></div>
              </div>

              {/* Subtasks Rows */}
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="grid grid-cols-[40px_1fr_100px_100px_100px_120px_40px] gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer group items-center"
                  onClick={() => handleOpenSubtask(subtask)}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedSubtasks.has(subtask.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSubtaskSelection(subtask.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {subtask.status === "done" && (
                      <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm truncate",
                      subtask.status === "done" ? "text-gray-500 line-through" : "text-gray-900"
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {subtask.columnId ? (
                      <span className="capitalize">{subtask.status || "To Do"}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {subtask.assignees && subtask.assignees.length > 0 ? (
                      <div className="flex -space-x-1">
                        {subtask.assignees.slice(0, 2).map((user) => (
                          <Avatar key={user.id} className="h-5 w-5 border border-white">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback className={`text-[8px] text-white ${getUserAvatarColor(user.id)}`}>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                  <div className="text-sm">
                    {subtask.priority ? (
                      <div className="flex items-center gap-1">
                        <Circle className={cn("h-2 w-2", getPriorityIconColor(subtask.priority))} />
                        <span className="text-xs capitalize">{subtask.priority}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {subtask.dueDate ? (
                      <span className="text-xs">{format(new Date(subtask.dueDate), "MMM d")}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubtask(subtask.id);
                      }}
                    >
                      <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add Subtask Button */}
              <button
                onClick={() => setIsAddSubtaskModalOpen(true)}
                className="w-full px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span>+</span> Add Task
              </button>
            </div>
          )}
        </div>

        {/* Save Changes Button */}
        {hasChanges && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Save className="h-4 w-4" />
              Save Changes
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </Button>
          </div>
        )}
      </div>

      {/* Right Side - Activity Panel */}
      <div className="w-[400px] flex-shrink-0 flex flex-col bg-white h-full">
        {/* Activity Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b bg-white">
          <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
        </div>

        {/* Activity Content */}
        <div className="flex-1 px-4 py-3 overflow-y-auto min-h-0">
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user.image || ""} />
                    <AvatarFallback className={`text-xs text-white ${getUserAvatarColor(comment.user.id)}`}>
                      {comment.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-12">
              <p className="font-medium text-gray-600">No comments yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="flex-shrink-0 p-3 bg-white border-t">
          <div className="border border-gray-200 rounded-lg hover:border-gray-300 focus-within:border-blue-400 transition-colors bg-white">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[70px] resize-none text-xs border-0 focus-visible:ring-0 rounded-lg px-3 pt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
            />
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] text-gray-400">Enter to send</span>
              <Button
                size="icon"
                className="h-7 w-7 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                onClick={handleSendComment}
                disabled={!newComment.trim() || isSendingComment}
              >
                {isSendingComment ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Subtask Modal */}
      <AddTaskModal
        isOpen={isAddSubtaskModalOpen}
        onClose={() => setIsAddSubtaskModalOpen(false)}
        onSubmit={handleCreateSubtask}
        projectId={task.projectId}
        columnId={task.columnId}
        parentTaskId={task.id}
        parentTaskName={task.title}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
