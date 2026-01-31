export type Priority = "low" | "medium" | "high";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

export interface Task {
  id: string;
  shortId?: string;
  title: string;
  description?: string;
  priority: Priority;
  status?: string;
  dueDate?: string;
  assignees: User[];
  tags?: string[];
  projectId?: string;
  columnId?: string;
  parentTaskId?: string;
  subtasks?: Task[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Column {
  id: string;
  title: string;
  color?: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
}

// Available colors for columns
export const COLUMN_COLORS = [
  { name: "Gray", value: "#6B7280", light: "#F3F4F6" },
  { name: "Blue", value: "#3B82F6", light: "#DBEAFE" },
  { name: "Green", value: "#10B981", light: "#D1FAE5" },
  { name: "Yellow", value: "#F59E0B", light: "#FEF3C7" },
  { name: "Orange", value: "#F97316", light: "#FFEDD5" },
  { name: "Red", value: "#EF4444", light: "#FEE2E2" },
  { name: "Purple", value: "#8B5CF6", light: "#EDE9FE" },
  { name: "Pink", value: "#EC4899", light: "#FCE7F3" },
];

// Note: Dummy data removed - application now uses real data from API

// Helper function to get priority color
export const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50 border-red-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays <= 7) {
    return `${diffDays}d left`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
};
