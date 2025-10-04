import { Job, CreateJobData, UpdateJobData, Profile, Skill, WorkExperience, Education, Resume, ProfileStats, CreateProfileData, UpdateProfileData, CreateSkillData, CreateExperienceData, CreateEducationData } from './types';
import { supabase } from './supabaseClient';

const API_BASE_URL = 'http://localhost:8000';

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Helper function to make authenticated API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  console.log(`=== API CALL DEBUG ===`);
  console.log(`Calling endpoint: ${endpoint}`);
  
  const token = await getAuthToken();
  console.log(`Auth token: ${token ? 'Present' : 'Missing'}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  // Only add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`Authorization header added`);
  } else {
    console.log(`No auth token, skipping Authorization header`);
    // If no token, throw authentication error for protected endpoints
    if (endpoint.startsWith('/api/jobs') && !endpoint.includes('-test')) {
      throw new Error('Authentication required. Please log in again.');
    }
  }
  
  console.log(`Final headers:`, headers);
  console.log(`Request options:`, options);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      // Ensure fresh data on every request
      cache: 'no-store',
      ...options,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        ...headers,
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response ok: ${response.ok}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Response error:`, errorData);
      
      // Handle authentication errors
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Handle FastAPI validation errors
      if (response.status === 422 && errorData.detail) {
        const validationErrors = Array.isArray(errorData.detail) 
          ? errorData.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ')
          : errorData.detail;
        throw new Error(`Validation error: ${validationErrors}`);
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }
      
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Response data:`, result);
    console.log(`=== END API CALL DEBUG ===`);
    return result;
  } catch (error) {
    console.error(`API call failed:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error. Please check your connection.');
  }
};

// Job API functions
export const jobApi = {
  // Get all jobs for the current user
  getJobs: async (): Promise<Job[]> => {
    return apiCall<Job[]>('/api/jobs');
  },

  // Get a specific job by ID
  getJob: async (id: string): Promise<Job> => {
    return apiCall<Job>(`/api/jobs/${id}`);
  },

  // Create a new job
  createJob: async (jobData: CreateJobData): Promise<Job> => {
    return apiCall<Job>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update an existing job
  updateJob: async (id: string, jobData: UpdateJobData): Promise<Job> => {
    console.log('=== API UPDATE DEBUG ===');
    console.log('Frontend sending update request:', { id, jobData });
    
    try {
      const result = await apiCall<Job>(`/api/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(jobData),
      });
      console.log('API update successful:', result);
      return result;
    } catch (error) {
      console.error('API update failed:', error);
      throw error;
    } finally {
      console.log('=== END API UPDATE DEBUG ===');
    }
  },

  // Delete a job
  deleteJob: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiCall<{ success: boolean; message: string }>(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthCheck = async (): Promise<{ message: string }> => {
  return apiCall<{ message: string }>('/ping');
};

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await getAuthToken();
      return !!token;
    } catch {
      return false;
    }
  },

  // Get user session info
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Refresh authentication token
  refreshToken: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      throw new Error('Failed to refresh authentication token');
    }
    return data.session;
  },
}; 

// Profile API functions
export const profileApi = {
  // Get user profile
  getProfile: async (): Promise<Profile> => {
    console.log('Fetching profile from API...');
    const result = await apiCall<Profile>('/api/profile');
    console.log('Profile API response:', result);
    return result;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<Profile> => {
    return apiCall<Profile>('/api/profile/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<{ profile_picture_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get profile statistics
  getProfileStats: async (): Promise<ProfileStats> => {
    return apiCall<ProfileStats>('/api/profile/stats');
  },

  // Delete user profile
  deleteProfile: async (): Promise<void> => {
    return apiCall<void>('/api/profile', {
      method: 'DELETE',
    });
  },
};

// Skills API functions
export const skillsApi = {
  // Get user skills
  getSkills: async (): Promise<Skill[]> => {
    return apiCall<Skill[]>('/api/skills');
  },

  // Add new skill
  addSkill: async (data: CreateSkillData): Promise<Skill> => {
    return apiCall<Skill>('/api/skills/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update skill
  updateSkill: async (id: string, data: Partial<CreateSkillData>): Promise<Skill> => {
    return apiCall<Skill>(`/api/skills/${id}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete skill
  deleteSkill: async (id: string): Promise<void> => {
    return apiCall<void>(`/api/skills/${id}`, {
      method: 'DELETE',
    });
  },

  // Get AI skill suggestions
  getSkillSuggestions: async (): Promise<string[]> => {
    return apiCall<string[]>('/api/skills/suggestions');
  },
};

// Experience API functions
export const experienceApi = {
  // Get work experience
  getExperience: async (): Promise<WorkExperience[]> => {
    return apiCall<WorkExperience[]>('/api/experience');
  },

  // Add work experience
  addExperience: async (data: CreateExperienceData): Promise<WorkExperience> => {
    return apiCall<WorkExperience>('/api/experience/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update work experience
  updateExperience: async (id: string, data: Partial<CreateExperienceData>): Promise<WorkExperience> => {
    return apiCall<WorkExperience>(`/api/experience/${id}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete work experience
  deleteExperience: async (id: string): Promise<void> => {
    return apiCall<void>(`/api/experience/${id}`, {
      method: 'DELETE',
    });
  },
};

// Education API functions
export const educationApi = {
  // Get education
  getEducation: async (): Promise<Education[]> => {
    return apiCall<Education[]>('/api/education');
  },

  // Add education
  addEducation: async (data: CreateEducationData): Promise<Education> => {
    return apiCall<Education>('/api/education/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update education
  updateEducation: async (id: string, data: Partial<CreateEducationData>): Promise<Education> => {
    return apiCall<Education>(`/api/education/${id}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete education
  deleteEducation: async (id: string): Promise<void> => {
    return apiCall<void>(`/api/education/${id}`, {
      method: 'DELETE',
    });
  },
};

// Resume API functions
export const resumeApi = {
  // Get user resumes
  getResumes: async (): Promise<Resume[]> => {
    console.log('Fetching resumes from API...');
    try {
      const result = await apiCall<Resume[]>('/api/resumes');
      console.log('Resumes API response:', result);
      console.log('Resumes response type:', typeof result);
      console.log('Resumes response length:', result?.length);
      return result;
    } catch (error) {
      console.error('Error in getResumes API call:', error);
      throw error;
    }
  },

  // Upload resume
  uploadResume: async (file: File): Promise<Resume> => {
    console.log('Uploading resume:', file.name, file.size, file.type);
    const formData = new FormData();
    formData.append('file', file);
    
    const token = await getAuthToken();
    console.log('Auth token obtained:', token ? 'Yes' : 'No');
    
    const response = await fetch(`${API_BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('Upload response status:', response.status);
    console.log('Upload response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload error:', errorData);
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Upload result:', result);
    return result;
  },

  // Delete resume
  deleteResume: async (id: string): Promise<void> => {
    return apiCall<void>(`/api/resume/${id}`, {
      method: 'DELETE',
    });
  },

  // Set resume as default
  setDefaultResume: async (id: string): Promise<Resume> => {
    return apiCall<Resume>(`/api/resume/${id}/default`, {
      method: 'PUT',
    });
  },
}; 