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
      ...options,
      headers,
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