// AI Configuration for JobStalker Extension
const aiConfig = {
  // OpenAI Model Configuration
  openai: {
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.3,
    apiEndpoint: 'https://api.openai.com/v1/chat/completions'
  },
  
  // AI Features Configuration
  features: {
    jobParsing: {
      enabled: true,
      model: 'gpt-4o-mini',
      prompt: 'Extract job details from the following job posting HTML. Return a JSON object with: title, company, location, salary (if available), and description.'
    },
    interviewPrep: {
      enabled: false, // Not implemented yet
      model: 'gpt-4o-mini',
      prompt: 'Generate interview preparation tips for this job position based on the job description.'
    },
    resumeOptimization: {
      enabled: false, // Not implemented yet
      model: 'gpt-4o-mini',
      prompt: 'Optimize resume keywords and suggestions based on this job description.'
    }
  },
  
  // Environment Configuration
  environment: {
    development: {
      apiKey: process.env.OPENAI_API_KEY || '',
      useMockResponses: true // For development without API calls
    },
    production: {
      apiKey: process.env.OPENAI_API_KEY || '',
      useMockResponses: false
    }
  }
};

// Export configuration
export default aiConfig;

// Helper function to get current AI model
export const getCurrentModel = () => aiConfig.openai.model;

// Helper function to get AI feature configuration
export const getAIFeatureConfig = (featureName) => {
  return aiConfig.features[featureName] || null;
};

// Helper function to check if AI feature is enabled
export const isAIFeatureEnabled = (featureName) => {
  const feature = aiConfig.features[featureName];
  return feature ? feature.enabled : false;
}; 