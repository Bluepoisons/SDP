import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60s for AI processing
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async () => {
  try {
    // Use the bridge endpoint for better connectivity checks
    const response = await api.get('/bridge/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const processDialog = async (text, userId, style) => {
  try {
    const response = await api.post('/api/dialog/process', { text, userId, style });
    return response.data;
  } catch (error) {
    console.error('Process dialog failed:', error);
    throw error;
  }
};

export const submitSelection = async (sessionId, optionId, userId) => {
  try {
    const response = await api.post('/api/dialog/selection', { sessionId, optionId, userId });
    return response.data;
  } catch (error) {
    console.error('Submit selection failed:', error);
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    const response = await api.get(`/api/dialog/stats/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user stats failed:', error);
    throw error;
  }
};

export default api;
