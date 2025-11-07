export interface Job {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  location: string;
  salary: string;
  job_url: string;
  status: 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted';
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
  status: 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted';
  excitement_level: number | null;
  date_applied: string | null;
  deadline: string | null;
  description: string | null;
}

export interface UpdateJobData extends Partial<CreateJobData> {
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

// Profile-related interfaces
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  job_title: string;
  location: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id?: string;
  name: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Expert';
  added_at: string;
}

export interface WorkExperience {
  id?: string;
  title: string;
  company: string;
  start_date: string;
  end_date?: string;
  description: string;
  is_current: boolean;
  added_at: string;
}

export interface Education {
  id?: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  added_at: string;
}

// Resume interface removed - using AI-generated resumes instead

export interface ProfileStats {
  jobs_applied: number;
  interviews: number;
  offers: number;
}

export interface CreateProfileData {
  full_name: string;
  job_title: string;
  location: string;
}

export interface UpdateProfileData extends Partial<CreateProfileData> {
}

export interface CreateSkillData {
  name: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface CreateExperienceData {
  title: string;
  company: string;
  start_date: string;
  end_date?: string;
  description: string;
  is_current: boolean;
}

export interface CreateEducationData {
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
} 