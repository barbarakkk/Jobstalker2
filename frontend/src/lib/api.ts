import { Job, CreateJobData, UpdateJobData } from './types';
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
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle FastAPI validation errors
    if (response.status === 422 && errorData.detail) {
      const validationErrors = Array.isArray(errorData.detail) 
        ? errorData.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ')
        : errorData.detail;
      throw new Error(`Validation error: ${validationErrors}`);
    }
    
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Job API functions
export const jobApi = {
  // Get all jobs for the current user
  getJobs: async (): Promise<Job[]> => {
    return apiCall<Job[]>('/jobs');
  },

  // Get a specific job by ID
  getJob: async (id: string): Promise<Job> => {
    return apiCall<Job>(`/jobs/${id}`);
  },

  // Create a new job
  createJob: async (jobData: CreateJobData): Promise<Job> => {
    return apiCall<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update an existing job
  updateJob: async (id: string, jobData: UpdateJobData): Promise<Job> => {
    return apiCall<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Delete a job
  deleteJob: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthCheck = async (): Promise<{ message: string }> => {
  return apiCall<{ message: string }>('/ping');
}; 