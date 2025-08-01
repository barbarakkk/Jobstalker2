export interface Job {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  location: string;
  salary: string;
  job_url: string;
  status: 'bookmarked' | 'applying' | 'applied' | 'interviewing' | 'accepted' | 'rejected';
  excitement_level: number; // 1-5 star rating
  date_applied: string;
  deadline: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobData {
  job_title: string;
  company: string;
  location: string | null;
  salary: string | null;
  job_url: string | null;
  status: 'bookmarked' | 'applying' | 'applied' | 'interviewing' | 'accepted' | 'rejected';
  excitement_level: number | null;
  date_applied: string | null;
  deadline: string | null;
  description: string | null;
}

export interface UpdateJobData extends Partial<CreateJobData> {
  id: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
} 