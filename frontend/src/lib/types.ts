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
export interface SocialLink {
  platform: string;
  url: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  location?: string;
  professional_summary?: string;
  social_links?: SocialLink[];
  profile_completed?: boolean;
  profile_picture_url?: string;
  referral_source?: string;
  work_auth_us?: boolean;
  work_auth_canada?: boolean;
  work_auth_uk?: boolean;
  requires_sponsorship?: boolean;
  ethnicity?: string;
  has_disability?: 'Yes' | 'No' | 'Decline to state';
  is_veteran?: 'Yes' | 'No' | 'Decline to state';
  is_lgbtq?: 'Yes' | 'No' | 'Decline to state';
  gender?: 'Male' | 'Female' | 'Non-Binary' | 'Decline to state';
  current_location?: string;
  date_of_birth?: string;
  phone_country_code?: string;
  skills?: Skill[];
  work_experience?: WorkExperience[];
  education?: Education[];
  languages?: Language[];
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
  location?: string;
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
  field?: string;
  start_date: string;
  end_date?: string;
  added_at: string;
}

export interface Language {
  id?: string;
  language: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
  created_at?: string;
  updated_at?: string;
}

// Resume interface removed - using AI-generated resumes instead

export interface ProfileStats {
  jobs_applied: number;
  interviews: number;
  offers: number;
}

export interface CreateProfileData {
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  location?: string;
  professional_summary?: string;
  social_links?: SocialLink[];
  referral_source?: string;
  work_auth_us?: boolean;
  work_auth_canada?: boolean;
  work_auth_uk?: boolean;
  requires_sponsorship?: boolean;
  ethnicity?: string;
  has_disability?: 'Yes' | 'No' | 'Decline to state';
  is_veteran?: 'Yes' | 'No' | 'Decline to state';
  is_lgbtq?: 'Yes' | 'No' | 'Decline to state';
  gender?: 'Male' | 'Female' | 'Non-Binary' | 'Decline to state';
  current_location?: string;
  date_of_birth?: string;
  phone_country_code?: string;
}

export interface UpdateProfileData extends Partial<Omit<CreateProfileData, 'email'>> {
  profile_completed?: boolean;
}

export interface CreateSkillData {
  name: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface CreateExperienceData {
  title: string;
  company: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  is_current: boolean;
}

export interface CreateEducationData {
  school: string;
  degree: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateLanguageData {
  language: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
}

export interface UpdateLanguageData extends Partial<CreateLanguageData> {
}

// Subscription-related interfaces
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due' | 'trialing';

export interface SubscriptionLimits {
  max_resumes: number | null; // null means unlimited
  max_jobs_from_extension: number | null; // null means unlimited
  job_matcher_enabled: boolean;
}

export interface SubscriptionUsage {
  resumes: number;
  jobs: number;
}

export interface Subscription {
  id?: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  subscription: Subscription | null;
}

export interface CheckoutSessionResponse {
  session_id: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

// Job Matching Preferences
export interface JobMatchingPreferences {
  skills: Skill[]; // Skills from user profile (can be edited in modal)
  preferredLocations: string[];
  minSalary: number | null;
  salaryCurrency: string;
} 