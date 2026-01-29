import axios from 'axios';

// 统一指向 Python 后端端口 8000
const API_BASE_URL = 'http://127.0.0.1:8000';

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

export const processDialog = async (text, userId, style, signal, modelSource = 'external', history = []) => {
  try {
    // Task 2: 支持传递历史上下文
    const response = await api.post('/api/generate', { 
      text, 
      userId, 
      style,
      history  // 新增历史参数
    }, { signal });
    return response.data;
  } catch (error) {
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || axios.isCancel(error)) {
      console.log('Request canceled', error.message);
      throw new Error('Request canceled');
    }
    const serverMsg = error?.response?.data?.message;
    const serverType = error?.response?.data?.errorType;
    const msg = serverMsg ? `${serverMsg}${serverType ? ` (${serverType})` : ''}` : (error.message || '请求失败');
    console.error('Process dialog failed:', error);
    throw new Error(msg);
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
