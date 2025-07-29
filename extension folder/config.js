// Environment configuration
const config = {
  // Development environment
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    AUTH_URL: 'http://localhost:3000/login'
  },
  // Production environment
  production: {
    API_BASE_URL: 'https://jobstalker.com/api',
    AUTH_URL: 'https://jobstalker.com/login'
  }
};

// Set current environment
const ENV = 'development'; // Change to 'production' for production build

// Export configuration for current environment
export const API_BASE_URL = config[ENV].API_BASE_URL;
export const AUTH_URL = config[ENV].AUTH_URL; 