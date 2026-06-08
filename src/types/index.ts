export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'completed';

export interface VoiceMemo {
  id: string;
  userId: string;
  audioUrl?: string;
  transcript: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  memoId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  status: Status;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  updatedAt?: string;
}
