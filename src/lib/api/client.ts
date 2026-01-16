import { CACHE_REVALIDATE } from "@/lib/constants";
import type {
  ProjectsResponse,
  ProjectResponse,
  AssignmentResponse,
  ToggleActiveResponse,
  MemosResponse,
  MemoResponse,
  EODsResponse,
  EODResponse,
} from "@/types/api";
import type { Project } from "@/types/project";
import type { Memo, EOD } from "@/types/report";

/**
 * Centralized API client for consistent data fetching across the application
 */

/**
 * Base API configuration
 */
const API_CONFIG = {
  baseUrl: "/api",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Centralized API error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Handle API response and errors consistently
 * @param response - Fetch Response object
 * @returns Parsed JSON data
 * @throws ApiError if response is not ok
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Response is not JSON
    }
    throw new ApiError(response.status, errorMessage);
  }
  return response.json();
}

/**
 * Helper to map project dates from string to Date
 */
function mapProject(project: any): Project {
  return {
    ...project,
    createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
    updatedAt: project.updatedAt ? new Date(project.updatedAt) : undefined,
    assignedAt: project.assignedAt ? new Date(project.assignedAt) : undefined,
    isActive: project.isActive ?? false,
    yesterdayEodDate: project.yesterdayEodDate ? new Date(project.yesterdayEodDate) : undefined,
  };
}

/**
 * Helper to map memo dates from string to Date
 */
function mapMemo(memo: any): Memo {
  return {
    ...memo,
    reportDate: new Date(memo.reportDate),
    createdAt: memo.createdAt ? new Date(memo.createdAt) : undefined,
  };
}

/**
 * Helper to map EOD dates from string to Date
 */
function mapEOD(eod: any): EOD {
  return {
    ...eod,
    reportDate: new Date(eod.reportDate),
    createdAt: eod.createdAt ? new Date(eod.createdAt) : undefined,
  };
}

/**
 * Projects API methods
 */
export const projectsApi = {
  /**
   * Get all projects with optional filters
   */
  async getAll(params?: URLSearchParams): Promise<ProjectsResponse> {
    const url = params
      ? `/api/projects?${params.toString()}`
      : "/api/projects";

    const response = await fetch(url, {
      next: { revalidate: CACHE_REVALIDATE.NONE },
    });
    const result = await handleResponse<ProjectsResponse>(response);
    return {
      ...result,
      data: result.data.map(mapProject)
    };
  },

  /**
   * Get a single project by ID
   */
  async getById(id: string): Promise<ProjectResponse> {
    const response = await fetch(`/api/projects/${id}`, {
      next: { revalidate: CACHE_REVALIDATE.NONE },
    });
    const data = await handleResponse<any>(response);
    return mapProject(data);
  },

  /**
   * Get project assignment for a user
   */
  async getAssignment(projectId: string, userId: string): Promise<AssignmentResponse> {
    const response = await fetch(
      `/api/projects/${projectId}/assignment?userId=${userId}`,
      { next: { revalidate: CACHE_REVALIDATE.NONE } }
    );
    return handleResponse<AssignmentResponse>(response);
  },

  /**
   * Toggle active status of a project assignment
   */
  async toggleActive(projectId: string, userId: string, isActive: boolean): Promise<ToggleActiveResponse> {
    const response = await fetch(
      `/api/projects/${projectId}/assignment/toggle-active`,
      {
        method: "PATCH",
        headers: API_CONFIG.headers,
        body: JSON.stringify({ userId, isActive }),
      }
    );
    return handleResponse<ToggleActiveResponse>(response);
  },
};

/**
 * Memos API methods
 */
export const memosApi = {
  /**
   * Get memos filtered by userId and/or projectId
   */
  async getByFilters(userId?: string, projectId?: string, limit: number = 100, summary: boolean = false): Promise<MemosResponse> {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (projectId) params.append("projectId", projectId);
    if (summary) params.append("summary", "true");
    params.append("limit", limit.toString());

    const response = await fetch(`/api/memos?${params.toString()}`, {
      next: { revalidate: CACHE_REVALIDATE.NONE },
    });
    const result = await handleResponse<any>(response);
    return result.data.map(mapMemo);
  },

  /**
   * Create a new memo (supports bulk/multiple types)
   */
  async create(data: {
    memoContent?: string;
    memoType?: string;
    projectId: string;
    userId: string;
    reportDate: string;
    memos?: Array<{
      memoContent: string;
      memoType: string;
      projectId: string;
      userId: string;
      reportDate: string;
    }>;
  }): Promise<MemoResponse | MemoResponse[]> {
    const response = await fetch("/api/memos", {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(response);
    if (Array.isArray(result)) return result.map(mapMemo);
    return mapMemo(result);
  },

  /**
   * Update an existing memo
   */
  async update(id: string, data: {
    memoContent: string;
    memoType?: string;
    projectId: string;
    userId: string;
    reportDate: string;
  }): Promise<MemoResponse> {
    const response = await fetch(`/api/memos/${id}`, {
      method: "PUT",
      headers: API_CONFIG.headers,
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(response);
    return mapMemo(result);
  },
};

/**
 * EODs API methods
 */
export const eodsApi = {
  /**
   * Get EODs filtered by userId and/or projectId
   */
  async getByFilters(userId?: string, projectId?: string, limit: number = 100, summary: boolean = false): Promise<EODsResponse> {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (projectId) params.append("projectId", projectId);
    if (summary) params.append("summary", "true");
    params.append("limit", limit.toString());

    const response = await fetch(`/api/eods?${params.toString()}`, {
      next: { revalidate: CACHE_REVALIDATE.NONE },
    });
    const result = await handleResponse<any>(response);
    return result.data.map(mapEOD);
  },

  /**
   * Create a new EOD
   */
  async create(data: {
    clientUpdate?: string;
    actualUpdate: string;
    projectId: string;
    userId: string;
    reportDate: string;
  }): Promise<EODResponse> {
    const response = await fetch("/api/eods", {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(response);
    return mapEOD(result);
  },

  /**
   * Update an existing EOD
   */
  async update(id: string, data: {
    clientUpdate?: string;
    actualUpdate: string;
    projectId: string;
    userId: string;
    reportDate: string;
  }): Promise<EODResponse> {
    const response = await fetch(`/api/eods/${id}`, {
      method: "PUT",
      headers: API_CONFIG.headers,
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(response);
    return mapEOD(result);
  },
};
