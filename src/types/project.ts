/**
 * Project-related type definitions
 */

export interface TeamMember {
  id: string;
  name: string;
  image: string | null;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  progress?: number;
  isActive?: boolean;
  team?: TeamMember[];
}

export interface ProjectStatus {
  projectId: string;
  projectName: string;
  hasTodayMemo: boolean;
  hasTodayEod: boolean;
  hasYesterdayEod: boolean;
  yesterdayEodDate?: string;
}

export interface ProjectAssignment {
  projectId: string;
  assignedAt: string;
  createdAt: string;
  isActive: boolean;
}
