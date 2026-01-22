"use client";

import { useState, useEffect, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, FolderKanban, X, Edit2, Trash2, MoreVertical, FileText, Circle, Flag, CalendarDays, ChevronRight, Mic, Send, Search, Loader2, Save } from "lucide-react";
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
import { toast } from "sonner";
import { taskCommentsApi } from "@/lib/api/client";

interface Project {
  id: string;
  name: string;
  clientName?: string;
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

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnId?: string;
  columnTitle?: string;
  columnColor?: string;
  onEdit?: (task: Task) => void; // Opens AddTaskModal
  onSave?: (task: Task) => Promise<void>; // Saves directly without opening modal
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
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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

  // Subtask states
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // User selection states
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Comment states
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Refs for click outside detection (not used anymore, kept for future reference)
  const descriptionEditRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || "");
      setSelectedPriority(task.priority);
      setSelectedDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setSelectedUsers(task.assignees || []);
      setHasChanges(false);
      setIsEditingDescription(false); // Exit edit mode when task changes
    }
  }, [task]);

  // Fetch project members only
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!task?.projectId) {
        setIsLoadingUsers(false);
        return;
      }

      try {
        const response = await fetch(`/api/projects/${task.projectId}`);
        if (response.ok) {
          const project = await response.json();
          setAvailableUsers(project.team || []);
        }
      } catch (error) {
        console.error("Failed to fetch project members:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchProjectMembers();
  }, [task?.projectId]);

  // Check for changes
  useEffect(() => {
    if (!task) return;

    const titleChanged = editedTitle !== task.title;
    const descriptionChanged = (editedDescription || "") !== (task.description || "");
    const priorityChanged = selectedPriority !== task.priority;
    const dateChanged = selectedDate
      ? format(selectedDate, "yyyy-MM-dd") !== task.dueDate
      : !!task.dueDate;
    const usersChanged = selectedUsers.length !== (task.assignees?.length || 0) ||
      selectedUsers.some(u => !task.assignees?.some(a => a.id === u.id));

    setHasChanges(titleChanged || descriptionChanged || priorityChanged || dateChanged || usersChanged);
  }, [task, editedTitle, editedDescription, selectedPriority, selectedDate, selectedUsers]);

  // Click outside detection removed - description stays in edit mode until saved or canceled
  // This allows users to click elsewhere without losing their edits

  // Fetch comments when task changes
  useEffect(() => {
    if (task?.id) {
      const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
          const fetchedComments = await taskCommentsApi.getByTaskId(task.id);
          setComments(fetchedComments);
        } catch (error) {
          console.error("Failed to fetch comments:", error);
          toast.error("Failed to load comments");
        } finally {
          setIsLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [task?.id]);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  // Fetch project details if projectId exists
  useEffect(() => {
    if (task?.projectId) {
      const fetchProject = async () => {
        setIsLoadingProject(true);
        try {
          // Fetch all projects and find the one with matching ID
          const response = await fetch(`/api/projects?limit=100&getAllProjects=true`);
          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.length > 0) {
              const foundProject = result.data.find((p: Project) => p.id === task.projectId);
              if (foundProject) {
                setProject(foundProject);
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch project:", error);
        } finally {
          setIsLoadingProject(false);
        }
      };
      fetchProject();
    } else {
      setProject(null);
    }
  }, [task?.projectId]);

  if (!task) return null;

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

  const getPriorityBorderColor = (p: Priority) => {
    switch (p) {
      case "high":
        return "border-red-300";
      case "medium":
        return "border-yellow-300";
      case "low":
        return "border-green-300";
    }
  };

  const getPriorityIconColor = (p: Priority) => {
    switch (p) {
      case "high":
        return "fill-red-500 text-red-500";
      case "medium":
        return "fill-yellow-500 text-yellow-500";
      case "low":
        return "fill-green-500 text-green-500";
    }
  };


  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
      setShowDeleteAlert(false);
      onClose();
    }
  };

  // Save title - just close edit mode, changes will be saved via top Save button
  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      setIsEditingTitle(false);
    }
  };

  // Cancel description edit - revert to original and close edit mode
  const handleCancelDescription = () => {
    if (task) {
      setEditedDescription(task.description || "");
    }
    setIsEditingDescription(false);
  };

  // User selection handlers
  const filteredUsers = availableUsers.filter(
    (u) =>
      !selectedUsers.some((su) => su.id === u.id) &&
      (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())),
  );

  const handleAddUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setUserSearch("");
    // Keep popover open to allow multiple selections
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  // Save all changes
  const handleSaveChanges = async () => {
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      title: editedTitle,
      description: editedDescription,
      priority: selectedPriority,
      dueDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      assignees: selectedUsers,
    };

    setIsSaving(true);
    try {
      if (onSave) {
        // Use the onSave callback which updates directly without opening modal
        await onSave(updatedTask);
      }
      setHasChanges(false);
      toast.success("Task updated successfully!");

      // Wait a moment for user to see the success state before closing
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to update task");
      setIsSaving(false);
    }
  };

  // Add subtask
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtask.trim(),
        completed: false,
      };
      setSubtasks([...subtasks, subtask]);
      setNewSubtask("");
      setIsAddingSubtask(false);
      // TODO: Save to database via API
      console.log("Adding subtask:", subtask);
    }
  };

  // Toggle subtask completion
  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st =>
      st.id === id ? { ...st, completed: !st.completed } : st
    ));
    // TODO: Update in database via API
  };

  // Delete subtask
  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
    // TODO: Delete from database via API
  };

  // Send comment
  const handleSendComment = async () => {
    if (!newComment.trim() || !task) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      user: {
        id: "current-user", // Will be replaced by real user from API
        name: "You",
        image: null,
      },
    };

    // 1. Show immediately in UI (optimistic update)
    setComments((prev) => [...prev, optimisticComment]);
    const commentText = newComment.trim();
    setNewComment("");

    // 2. Send to API in background
    setIsSendingComment(true);
    try {
      const savedComment = await taskCommentsApi.create(task.id, commentText);

      // Replace temporary comment with real one from API
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? savedComment : c))
      );
    } catch (error) {
      console.error("Failed to send comment:", error);
      toast.error("Failed to add comment");

      // Remove failed comment from UI
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setNewComment(commentText); // Restore the text
    } finally {
      setIsSendingComment(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1400px] rounded-lg overflow-hidden max-h-[85vh] p-0 gap-0 flex flex-col" showCloseButton={false}>
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">
          Task Details: {task.title}
        </DialogTitle>

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
            <span className="text-xs text-gray-500">Task ID: {task.id.slice(0, 8)}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Two Column Layout - Scrollable */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-0 w-full">
            {/* Left Side - Main Content (scrollable) */}
            <div className="px-6 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
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

              {/* Project Info - Fixed height to prevent jumping */}
              {task.projectId && (
                <div className="flex items-center gap-2 text-xs pb-3 border-b min-h-[32px]">
                  <FolderKanban className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 flex-shrink-0">Project:</span>
                  {isLoadingProject ? (
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-32"></div>
                  ) : project ? (
                    <span className="font-medium text-gray-900 truncate">
                      {project.name}
                      {project.clientName && (
                        <span className="text-gray-500 ml-1">({project.clientName})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">No project</span>
                  )}
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-3 border-b">
                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Circle className="h-3 w-3" />
                    Status
                  </label>
                  {columnTitle && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: columnColor || "#6B7280" }}
                      />
                      <span className="text-sm font-medium text-gray-900">{columnTitle}</span>
                    </div>
                  )}
                </div>

                {/* Assignees */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    Assignees
                  </label>
                  <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-8 text-sm font-normal"
                      >
                        {selectedUsers.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-1">
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
                          <span className="text-gray-500">Select assignees</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-3">
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="pl-9 h-8 text-sm"
                          />
                        </div>

                        {/* Selected users as chips */}
                        {selectedUsers.length > 0 && (
                          <div className="mb-2 pb-2 border-b">
                            <div className="text-xs font-medium text-gray-500 mb-1.5">Selected</div>
                            <div
                              className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                              style={{
                                overscrollBehavior: 'contain',
                                WebkitOverflowScrolling: 'touch'
                              }}
                              onWheel={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {selectedUsers.map((user) => (
                                <Badge
                                  key={user.id}
                                  variant="secondary"
                                  className="flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 h-6 bg-gray-100 hover:bg-gray-200"
                                >
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback className={`text-[8px] text-white ${getUserAvatarColor(user.id)}`}>
                                      {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs max-w-[120px] truncate">{user.name}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveUser(user.id);
                                    }}
                                    className="hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Available users */}
                        <div className="max-h-[180px] overflow-y-auto">
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
                                  className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-gray-100 transition-colors text-left"
                                >
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback className={`text-[10px] text-white ${getUserAvatarColor(user.id)}`}>
                                      {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{user.name}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-xs text-gray-500">
                              {userSearch ? "No users found" : "All users selected"}
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" />
                    Due Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-8 text-sm",
                          !selectedDate && "text-gray-500"
                        )}
                      >
                        <CalendarDays className="h-3.5 w-3.5 mr-2" />
                        {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Flag className="h-3 w-3" />
                    Priority
                  </label>
                  <Select
                    value={selectedPriority}
                    onValueChange={(value: Priority) => setSelectedPriority(value)}
                  >
                    <SelectTrigger className="w-full h-7 text-sm hover:bg-gray-100 px-2">
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

              {/* Description Section */}
              <div className="space-y-2 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-gray-500" />
                    <h3 className="text-xs font-semibold text-gray-700">Description</h3>
                  </div>
                  {isEditingDescription && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelDescription}
                      className="h-7 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="min-h-[150px] resize-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          handleCancelDescription();
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Esc</kbd> or click Cancel to revert. Use the <strong>Save Changes</strong> button above to save.
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-all min-h-[100px] whitespace-pre-wrap"
                  >
                    {editedDescription || task.description || (
                      <span className="text-gray-400 italic">Click to add a description...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Checklist Section */}
              <div className="pt-3 border-t space-y-2">
                <h3 className="text-xs font-semibold text-gray-700">Checklist</h3>

                {/* Existing subtasks */}
                {subtasks.length > 0 && (
                  <div className="space-y-2">
                    {subtasks.map((subtask, index) => (
                      <div key={subtask.id} className="flex items-center gap-2 group">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => handleToggleSubtask(subtask.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={cn(
                          "flex-1 text-sm",
                          subtask.completed && "line-through text-gray-400"
                        )}>
                          {index + 1}. {subtask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new checklist item */}
                {isAddingSubtask ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Enter checklist item..."
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddSubtask();
                        } else if (e.key === "Escape") {
                          setNewSubtask("");
                          setIsAddingSubtask(false);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddSubtask}
                      disabled={!newSubtask.trim()}
                      className="h-8"
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewSubtask("");
                        setIsAddingSubtask(false);
                      }}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-900 -ml-2"
                    onClick={() => setIsAddingSubtask(true)}
                  >
                    <span className="mr-2">+</span> Add item
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side - Activity Panel */}
            <div className="flex flex-col bg-white border-l min-h-0">
              {/* Activity Header - Sticky */}
              <div className="flex-shrink-0 sticky top-0 z-10 px-4 py-2.5 border-b bg-white/95 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
              </div>

              {/* Activity Content (scrollable independently) */}
              <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0" style={{ maxHeight: 'calc(85vh - 260px)' }}>
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
                    {/* Auto-scroll anchor */}
                    <div ref={commentsEndRef} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-600">No comments yet</p>
                      <p className="text-xs text-gray-400">Start the conversation</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment Input (Fixed at bottom) */}
              <div className="flex-shrink-0 p-3 bg-white border-t">
                <div className="border border-gray-200 rounded-lg hover:border-gray-300 focus-within:border-blue-400 transition-colors bg-white">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[70px] resize-none text-xs border-0 focus-visible:ring-0 rounded-lg px-3 pt-2"
                    onKeyDown={(e) => {
                      // Enter to send, Shift+Enter for new line
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-1 px-2 text-xs">
                        <FileText className="h-3 w-3" />
                        <span className="font-medium">Discuss</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 mr-1">Enter to send</span>
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
            </div>
          </div>
        </div>

        {/* Footer - Fixed with action buttons */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t bg-gray-50">
          <div>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteAlert(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 h-7 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Task
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="h-7 gap-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Task?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "<strong className="text-gray-900">{task.title}</strong>"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteAlert(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
