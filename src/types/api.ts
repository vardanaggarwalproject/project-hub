/**
 * API response type definitions
 */

import type { Project, ProjectAssignment } from "./project";
import type { Memo, EOD } from "./report";

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Specific API response types
 */
export interface ProjectsResponse {
  data: Project[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProjectResponse extends Project {}

export interface AssignmentResponse extends ProjectAssignment {}

export interface ToggleActiveResponse {
  success: boolean;
  isActive: boolean;
}

export interface MemosResponse extends Array<Memo> {}

export interface MemoResponse extends Memo {}

export interface EODsResponse extends Array<EOD> {}

export interface EODResponse extends EOD {}
