import { Job, CreateJobData, UpdateJobData, Profile, Skill, WorkExperience, Education, Language, ProfileStats, UpdateProfileData, CreateSkillData, CreateExperienceData, CreateEducationData, CreateLanguageData, UpdateLanguageData, SubscriptionInfo, SubscriptionTier, SubscriptionStatus } from './types';
import { supabase } from './supabaseClient';

// Base URL for the backend API. In production, set VITE_API_BASE_URL in a .env file.
// Falls back to localhost ONLY in development mode. In production, this must be set.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://jobstalker2-production.up.railway.app');

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Enable debug logs only in development and when explicitly enabled
const DEBUG_API_CALLS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

// Request cache to prevent duplicate API calls
const requestCache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
const CACHE_TTL = 30000; // 30 seconds - increased for better navigation performance

export async function cachedApiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Only cache GET requests
  const method = options?.method || 'GET';
  if (method !== 'GET') {
    return apiCall<T>(endpoint, options);
  }

  const cacheKey = endpoint;
  const cached = requestCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Deduplicate in-flight requests
  if (cached?.promise) {
    return cached.promise;
  }
  
  const promise = apiCall<T>(endpoint, options);
  requestCache.set(cacheKey, { data: null, timestamp: 0, promise });
  
  try {
    const result = await promise;
    requestCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    requestCache.delete(cacheKey);
    throw error;
  }
}

// Clear cache for an endpoint (call after mutations)
export function invalidateCache(endpoint?: string) {
  if (endpoint) {
    requestCache.delete(endpoint);
  } else {
    requestCache.clear();
  }
}

// Helper function to make authenticated API calls
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  if (DEBUG_API_CALLS) {
    console.log(`=== API CALL DEBUG ===`);
    console.log(`Calling endpoint: ${endpoint}`);
  }
  
  const token = await getAuthToken();
  
  if (DEBUG_API_CALLS) {
    console.log(`Auth token: ${token ? 'Present' : 'Missing'}`);
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  // Only add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    if (DEBUG_API_CALLS) {
      console.log(`Authorization header added`);
    }
  } else {
    if (DEBUG_API_CALLS) {
      console.log(`No auth token, skipping Authorization header`);
    }
    // If no token, throw authentication error for protected endpoints
    if (endpoint.startsWith('/api/jobs') && !endpoint.includes('-test')) {
      throw new Error('Authentication required. Please log in again.');
    }
  }
  
  if (DEBUG_API_CALLS) {
    console.log(`Final headers:`, headers);
    console.log(`Request options:`, options);
  }
  
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

    if (DEBUG_API_CALLS) {
      console.log(`Response status: ${response.status}`);
      console.log(`Response ok: ${response.ok}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Only log errors for critical endpoints, suppress "Server disconnected" for non-critical endpoints
      const isNonCriticalEndpoint = endpoint.includes('/education') || endpoint.includes('/languages');
      const isServerDisconnected = errorData.detail && errorData.detail.includes('Server disconnected');
      
      if (!isNonCriticalEndpoint || !isServerDisconnected) {
        console.error(`API Error [${endpoint}]:`, errorData);
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Handle FastAPI validation errors - show user-friendly messages
      if (response.status === 422 && errorData.detail) {
        // Use user-friendly message from backend, or fallback to generic message
        const userMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : (errorData.errors && errorData.errors[0]) 
            ? errorData.errors[0]
            : 'Please check your input and try again';
        
        // Log technical details to console only
        console.error('Validation error (technical):', errorData);
        
        throw new Error(userMessage);
      }
      
      // Handle rate limiting - use backend's detailed error message
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        const rateLimit = response.headers.get('X-RateLimit-Limit') || '30';
        const errorMsg = errorData.detail || `Rate limit exceeded. You can make up to ${rateLimit} AI requests per minute. Please wait a moment before trying again.`;
        throw new Error(errorMsg);
      }
      
      // For non-critical endpoints with server disconnected errors, return empty array instead of throwing
      if (isNonCriticalEndpoint && isServerDisconnected) {
        return [] as T;
      }
      
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (DEBUG_API_CALLS) {
      console.log(`Response data:`, result);
      console.log(`=== END API CALL DEBUG ===`);
    }
    return result;
  } catch (error) {
    console.error(`API call failed [${endpoint}]:`, error);
    if (error instanceof Error) {
      // Provide more specific error messages for common network issues
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Unable to connect to server. Please check if the backend is running and your network connection. Endpoint: ${endpoint}`);
      }
      throw error;
    }
    throw new Error('Network error. Please check your connection.');
  }
};

// Job API functions
export const jobApi = {
  // Get all jobs for the current user
  getJobs: async (): Promise<Job[]> => {
    return cachedApiCall<Job[]>('/api/jobs');
  },

  // Get a specific job by ID
  getJob: async (id: string): Promise<Job> => {
    return apiCall<Job>(`/api/jobs/${id}`);
  },

  // Create a new job
  createJob: async (jobData: CreateJobData): Promise<Job> => {
    const result = await apiCall<Job>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    invalidateCache('/api/jobs');
    return result;
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
      invalidateCache('/api/jobs');
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
    const result = await apiCall<{ success: boolean; message: string }>(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
    invalidateCache('/api/jobs');
    return result;
  },
};

// AI API functions
export const aiApi = {
  // Analyze job match
  analyzeJobMatch: async (jobId: string): Promise<{
    matchScore: number;
    strengths: string[];
    improvements: string[];
    missingSkills: string[];
    matchedSkills: string[];
  }> => {
    return apiCall<{
      matchScore: number;
      strengths: string[];
      improvements: string[];
      missingSkills: string[];
      matchedSkills: string[];
    }>(`/api/ai/job-match/${jobId}`, {
      method: 'POST',
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
    const result = await cachedApiCall<Profile>('/api/profile');
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

  // Mark profile as completed
  completeProfile: async (): Promise<{ success: boolean; message: string }> => {
    return apiCall<{ success: boolean; message: string }>('/api/profile/complete', {
      method: 'POST',
    });
  },
};

// Skills API functions
export const skillsApi = {
  // Get user skills
  getSkills: async (): Promise<Skill[]> => {
    const skills = await apiCall<any[]>('/api/skills');
    // Map backend 'proficiency' field to frontend 'proficiency_level' field
    return skills.map(skill => ({
      ...skill,
      proficiency_level: skill.proficiency || skill.proficiency_level || 'Beginner'
    }));
  },

  // Add new skill
  addSkill: async (data: CreateSkillData): Promise<Skill> => {
    // Map proficiency_level to proficiency for backend compatibility
    const backendData = {
      name: data.name,
      proficiency: data.proficiency_level,
      category: 'Technical' // Default category
    };
    const skill = await apiCall<any>('/api/skills/add', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
    // Map backend 'proficiency' field to frontend 'proficiency_level' field
    return {
      ...skill,
      proficiency_level: skill.proficiency || skill.proficiency_level || 'Beginner'
    };
  },

  // Update skill
  updateSkill: async (id: string, data: Partial<CreateSkillData>): Promise<Skill> => {
    // Map proficiency_level to proficiency for backend compatibility
    const backendData: any = {};
    if (data.name !== undefined) backendData.name = data.name;
    if (data.proficiency_level !== undefined) backendData.proficiency = data.proficiency_level;
    const skill = await apiCall<any>(`/api/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    });
    // Map backend 'proficiency' field to frontend 'proficiency_level' field
    return {
      ...skill,
      proficiency_level: skill.proficiency || skill.proficiency_level || 'Beginner'
    };
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
    return apiCall<WorkExperience>(`/api/experience/${id}`, {
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
    return apiCall<Education>(`/api/education/${id}`, {
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

// Languages API functions
export const languagesApi = {
  // Get user languages
  getLanguages: async (): Promise<Language[]> => {
    return apiCall<Language[]>('/api/languages');
  },

  // Create language
  createLanguage: async (data: CreateLanguageData): Promise<Language> => {
    return apiCall<Language>('/api/languages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update language
  updateLanguage: async (id: string, data: UpdateLanguageData): Promise<Language> => {
    return apiCall<Language>(`/api/languages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete language
  deleteLanguage: async (id: string): Promise<void> => {
    return apiCall<void>(`/api/languages/${id}`, {
      method: 'DELETE',
    });
  },
};

// Resume upload API removed - using AI-generated resumes instead 

// Templates & Wizard API
export const templatesApi = {
  list: async (): Promise<any[]> => {
    return apiCall<any[]>('/api/templates');
  },
  get: async (id: string): Promise<any> => {
    return apiCall<any>(`/api/templates/${id}`);
  },
};

// Subscription API
export const subscriptionApi = {
  getStatus: async (): Promise<SubscriptionInfo> => {
    const response = await apiCall<{ tier: string; status: string; limits: any; usage: any; subscription?: any }>('/api/subscription/status');
    // Transform the response to match SubscriptionInfo type
    return {
      ...response,
      tier: response.tier as SubscriptionTier,
      status: response.status as SubscriptionStatus,
    } as SubscriptionInfo;
  },
  createCheckoutSession: async (priceId?: string): Promise<{ session_id: string; url: string }> => {
    return apiCall('/api/subscription/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ price_id: priceId }),
    });
  },
  createPortalSession: async (): Promise<{ url: string }> => {
    return apiCall('/api/subscription/create-portal-session', {
      method: 'POST',
    });
  },
};