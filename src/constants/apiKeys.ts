// apiKeys.ts

// Check if process exists (it should in Create React App)
const getEnvVariable = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  // Fallback for environments where process is not available
  return '';
};

export const ApiKeys = {
  geminiApiKey: getEnvVariable('REACT_APP_GEMINI_API_KEY'),
};