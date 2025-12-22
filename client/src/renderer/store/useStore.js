import { create } from 'zustand';
import { checkHealth, processDialog, submitSelection } from '../services/api';

const useStore = create((set, get) => ({
  // State
  isConnected: false,
  userId: 'user-' + Math.random().toString(36).substr(2, 9),
  currentScene: '',
  sceneSummary: '', // 新增：场景旁白
  dialogOptions: [],
  history: [],
  isLoading: false,
  error: null,

  // Actions
  checkConnection: async () => {
    try {
      await checkHealth();
      set({ isConnected: true, error: null });
    } catch (err) {
      set({ isConnected: false, error: '无法连接到服务器' });
    }
  },

  generateOptions: async (text, style = 'neutral') => {
    set({ isLoading: true, error: null });
    try {
      const { userId } = get();
      const result = await processDialog(text, userId, style);
      if (result.success) {
        set({ 
          dialogOptions: result.data.options,
          sceneSummary: result.data.sceneSummary || '', // 设置场景旁白
          currentScene: text,
          isLoading: false 
        });
      }
    } catch (err) {
      set({ isLoading: false, error: '生成选项失败: ' + err.message });
    }
  },

  selectOption: async (sessionId, optionId) => {
    try {
      const { userId } = get();
      await submitSelection(sessionId, optionId, userId);
      // Clear options after selection or move to history
      set((state) => ({
        dialogOptions: [],
        sceneSummary: '', // 清除场景旁白
        history: [...state.history, { sessionId, optionId, timestamp: new Date() }]
      }));
    } catch (err) {
      console.error('Selection failed:', err);
    }
  }
}));

export default useStore;
