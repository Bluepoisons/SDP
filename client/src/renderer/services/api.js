import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increased to 120s for AI processing
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

export const processDialog = async (text, userId, style, signal) => {
  try {
    const response = await api.post('/api/dialog/process', { text, userId, style }, { signal });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled', error.message);
      throw new Error('Request canceled');
    }
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
