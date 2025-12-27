import axios from 'axios';

// 统一指向 Python 后端端口 8000
const API_BASE_URL = 'http://127.0.0.1:8000';

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

export const processDialog = async (text, userId, style, signal, modelSource = 'external') => {
  try {
    // 无论 modelSource 是什么，现在都统一发给 Python 后端
    // Python 后端内部再去决定是调 API 还是调本地模型
    const response = await api.post('/api/generate', { 
      text, 
      userId, 
      style 
    }, { signal });
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

export const submitSelection = async (sessionId, optionId, userId, modelSource = 'external') => {
  try {
    const response = await api.post('/api/selection', { 
      sessionId, 
      optionId, 
      userId 
    });
    return response.data;
  } catch (error) {
    console.error('Submit selection failed:', error);
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    // 暂时 Mock，或者后端实现这个接口
    // const response = await api.get(`/api/dialog/stats/${userId}`);
    // return response.data;
    return { totalSelections: 0 };
  } catch (error) {
    console.error('Get user stats failed:', error);
    throw error;
  }
};

export default api;
