/**
 * Report-related type definitions (Memos, EODs, Updates)
 */

export interface Memo {
  id: string;
  memoContent: string;
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
  id: string;
  date: Date;
  projectId: string;
  projectName: string;
  type: "memo" | "eod";
}

export interface DayStatus {
  date: Date;
  hasMemo: boolean;
  hasEOD: boolean;
  isToday: boolean;
  isOtherMonth: boolean;
  isValidDate?: boolean;
  memo?: Memo;
  eod?: EOD;
}
