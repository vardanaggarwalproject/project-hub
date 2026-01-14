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
  createdAt: Date;
  updatedAt?: Date;
  progress?: number;
  isActive?: boolean;
  team?: TeamMember[];
}

export interface ProjectStatus {
  projectId: string;
  projectName: string;
  hasTodayMemo: boolean;
  hasTodayEod: boolean;
}

export interface ProjectAssignment {
  projectId: string;
  assignedAt: Date;
  createdAt: Date;
  isActive: boolean;
}
