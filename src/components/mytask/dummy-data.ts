export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  assignee?: {
    name: string;
    avatar?: string;
    initials: string;
  };
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

// Dummy data for the Kanban board
export const dummyBoard: Board = {
  id: "board-1",
  title: "My Project Board",
  columns: [
    {
      id: "column-1",
      title: "To Do",
      color: "#3B82F6",
      tasks: [
        {
          id: "task-1",
          title: "Design landing page mockup",
          description: "Create high-fidelity mockups for the new landing page with updated branding",
          priority: "high",
          dueDate: "2026-01-25",
          assignee: {
            name: "Alice Johnson",
            initials: "AJ",
            avatar: undefined,
          },
        },
        {
          id: "task-2",
          title: "Set up CI/CD pipeline",
          description: "Configure GitHub Actions for automated testing and deployment",
          priority: "medium",
          dueDate: "2026-01-28",
          assignee: {
            name: "Bob Smith",
            initials: "BS",
          },
        },
        {
          id: "task-3",
          title: "Write API documentation",
          description: "Document all REST API endpoints with examples",
          priority: "low",
          dueDate: "2026-02-01",
          assignee: {
            name: "Charlie Davis",
            initials: "CD",
          },
        },
        {
          id: "task-4",
          title: "Update dependencies",
          description: "Update all npm packages to latest stable versions",
          priority: "low",
          assignee: {
            name: "Bob Smith",
            initials: "BS",
          },
        },
      ],
    },
    {
      id: "column-2",
      title: "In Progress",
      color: "#F59E0B",
      tasks: [
        {
          id: "task-5",
          title: "Implement user authentication",
          description: "Add JWT-based authentication with refresh tokens",
          priority: "high",
          dueDate: "2026-01-23",
          assignee: {
            name: "Diana Evans",
            initials: "DE",
          },
        },
        {
          id: "task-6",
          title: "Fix mobile responsiveness issues",
          description: "Resolve layout problems on tablet and mobile devices",
          priority: "high",
          dueDate: "2026-01-24",
          assignee: {
            name: "Alice Johnson",
            initials: "AJ",
          },
        },
        {
          id: "task-7",
          title: "Optimize database queries",
          description: "Add indexes and optimize slow queries identified in production",
          priority: "medium",
          dueDate: "2026-01-26",
          assignee: {
            name: "Eve Martinez",
            initials: "EM",
          },
        },
      ],
    },
    {
      id: "column-3",
      title: "Complete",
      color: "#10B981",
      tasks: [
        {
          id: "task-8",
          title: "Set up project repository",
          description: "Initialize Git repository with proper .gitignore and README",
          priority: "high",
          assignee: {
            name: "Bob Smith",
            initials: "BS",
          },
        },
        {
          id: "task-9",
          title: "Create project wireframes",
          description: "Low-fidelity wireframes for all main pages",
          priority: "medium",
          assignee: {
            name: "Alice Johnson",
            initials: "AJ",
          },
        },
        {
          id: "task-10",
          title: "Define database schema",
          description: "Create ERD and migration files for initial database structure",
          priority: "high",
          assignee: {
            name: "Charlie Davis",
            initials: "CD",
          },
        },
      ],
    },
  ],
};

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
