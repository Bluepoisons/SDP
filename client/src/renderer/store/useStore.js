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
  abortController: null, // Store the controller

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
    // Cancel previous request if exists
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    set({ isLoading: true, error: null, abortController: controller });

    try {
      const { userId } = get();
      const result = await processDialog(text, userId, style, controller.signal);
      if (result.success) {
        set({ 
          dialogOptions: result.data.options,
          sceneSummary: result.data.sceneSummary || '', // 设置场景旁白
          currentScene: text,
          isLoading: false,
          abortController: null
        });
      }
    } catch (err) {
      if (err.message === 'Request canceled') {
        set({ isLoading: false, abortController: null }); // Don't set error for user cancellation
      } else {
        set({ isLoading: false, error: '生成选项失败: ' + err.message, abortController: null });
      }
    }
  },

  cancelGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isLoading: false, abortController: null });
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
