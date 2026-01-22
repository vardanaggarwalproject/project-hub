/**
 * Report-related type definitions (Memos, EODs, Updates)
 */

export interface Memo {
  id: string;
  memoContent: string;
  memoType: string;
  reportDate: Date;
  projectId: string;
  userId: string;
  createdAt?: Date;
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface EOD {
  id: string;
  clientUpdate: string;
  actualUpdate: string;
  reportDate: Date;
  projectId: string;
  userId: string;
  createdAt?: Date;
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface MissingUpdate {
  id: string; // project-date
  date: Date;
  projectId: string;
  projectName: string;
  isUniversalMissing: boolean;
  isShortMissing: boolean;
  isEodMissing: boolean;
}

export interface DayStatus {
  date: Date;
  hasMemo: boolean;
  hasUniversal?: boolean;
  hasShort?: boolean;
  hasEOD: boolean;
  isToday: boolean;
  isOtherMonth: boolean;
  isValidDate?: boolean;
  memo?: Memo;
  eod?: EOD;
}
