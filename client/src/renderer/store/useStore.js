import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { checkHealth, processDialog, submitSelection } from '../services/api';

const createSession = () => ({
  id: 'session-' + Date.now(),
  title: '新故事 ' + new Date().toLocaleTimeString(),
  lastTimestamp: Date.now(),
  messages: [], // { role: 'user' | 'ai', content: string, options?: [], sceneSummary?: string, timestamp: number }
});

const useStore = create(
  persist(
    (set, get) => ({
      // State
      isConnected: false,
      userId: 'user-' + Math.random().toString(36).substr(2, 9),
      
      sessions: [createSession()],
      currentSessionId: null, // Will be set in init
      
      // Current View State (derived or temporary)
      isLoading: false,
      error: null,
      abortController: null,

      // Settings
      modelSource: 'external', // 'external' | 'local'
      setModelSource: (source) => set({ modelSource: source }),
      
      // Task 2: Memory & Logs Settings
      memoryMax: 8, // 默认记忆深度 8 条
      setMemoryMax: (value) => set({ memoryMax: Math.min(32, Math.max(8, value)) }),
      showLogs: false,
      toggleLogs: () => set(state => ({ showLogs: !state.showLogs })),
      logs: '',
      fetchLogs: async (lines = 100) => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/system/logs?lines=${lines}`);
          const logs = await response.text();
          set({ logs });
        } catch (err) {
          console.error('Failed to fetch logs:', err);
          set({ logs: 'Error fetching logs: ' + err.message });
        }
      },

      // Actions
      initStore: () => {
        const { sessions, currentSessionId } = get();
        if (sessions.length === 0) {
          const newSession = createSession();
          set({ sessions: [newSession], currentSessionId: newSession.id });
        } else if (!currentSessionId) {
          set({ currentSessionId: sessions[0].id });
        }
      },

      createNewSession: () => {
        const newSession = createSession();
        set(state => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id
        }));
      },

      switchSession: (sessionId) => {
        set({ currentSessionId: sessionId });
      },

      deleteSession: (sessionId) => {
        set(state => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);
          if (newSessions.length === 0) {
            const newSession = createSession();
            return { sessions: [newSession], currentSessionId: newSession.id };
          }
          return { 
            sessions: newSessions, 
            currentSessionId: state.currentSessionId === sessionId ? newSessions[0].id : state.currentSessionId 
          };
        });
      },

      checkConnection: async () => {
        try {
          await checkHealth();
          set({ isConnected: true, error: null });
        } catch (err) {
          set({ isConnected: false, error: '无法连接到服务器' });
        }
      },

      generateOptions: async (text, style = 'neutral') => {
        const { abortController, currentSessionId, memoryMax, sessions } = get();
        if (abortController) abortController.abort();

        const controller = new AbortController();
        set({ isLoading: true, error: null, abortController: controller });

        // Task 2: 先构建历史上下文（在添加新消息之前）
        const currentSession = sessions.find(s => s.id === currentSessionId);
        const allMessages = currentSession?.messages || [];
        
        // 转换为后端期望的格式（不包含当前这条新消息）
        const history = allMessages
          .slice(-memoryMax)  // 截取最近的 N 条
          .filter(msg => msg.role === 'user' || msg.role === 'ai')  // 排除 system 消息
          .map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.role === 'ai' ? (msg.options?.[0]?.text || msg.content) : msg.content
          }));
        
        console.log('[Store] Sending request with history:', history.length, 'messages, memoryMax:', memoryMax);

        // 添加用户新消息到 session
        const userMsg = { role: 'user', content: text, timestamp: Date.now() };
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === currentSessionId 
              ? { ...s, messages: [...s.messages, userMsg], lastTimestamp: Date.now(), title: s.messages.length === 0 ? text.slice(0, 20) : s.title } 
              : s
          )
        }));

        try {
          const { userId, modelSource } = get();
          
          const result = await processDialog(text, userId, style, controller.signal, modelSource, history);

          if (!result || result.success === false) {
            const msg = result?.message || '生成失败，请稍后重试。';
            set({ isLoading: false, error: msg, abortController: null });
            return;
          }

          if (result.success || (modelSource === 'local' && result.options)) {
            const aiMsg = {
              role: 'ai',
              content: result.data.sceneSummary || '',
              options: result.data.options,
              sceneSummary: result.data.sceneSummary,
              timestamp: Date.now(),
              thinkingTimeMs: result.data.generationTimeMs
            };

            set(state => ({
              sessions: state.sessions.map(s => 
                s.id === currentSessionId 
                  ? { ...s, messages: [...s.messages, aiMsg], lastTimestamp: Date.now() } 
                  : s
              ),
              isLoading: false,
              abortController: null
            }));
          }
        } catch (err) {
          if (err.message !== 'Request canceled') {
            set({ isLoading: false, error: '生成选项失败: ' + err.message, abortController: null });
          }
        }
      },

      cancelGeneration: () => {
        const { abortController } = get();
        if (abortController) abortController.abort();
        set({ isLoading: false, abortController: null });
      },

      selectOption: async (sessionId, optionId) => { // sessionId here is likely from API, but we use store's sessionId
        // Note: The original selectOption took sessionId from API response? 
        // Actually, usually we just record the selection.
        // We will record the selection in the message history or as a new system message?
        // For now, let's just log it or maybe add a "selection" message.
        
        const { currentSessionId, sessions } = get();
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (!currentSession) return;

        // Find the option text
        let optionText = '';
        const lastAiMsg = [...currentSession.messages].reverse().find(m => m.role === 'ai');
        if (lastAiMsg && lastAiMsg.options) {
          const opt = lastAiMsg.options.find(o => o.id === optionId);
          if (opt) optionText = opt.text;
        }

        const selectionMsg = {
          role: 'system',
          content: `选择了: ${optionText}`,
          selectionId: optionId,
          timestamp: Date.now()
        };

        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === currentSessionId 
              ? { ...s, messages: [...s.messages, selectionMsg], lastTimestamp: Date.now() } 
              : s
          )
        }));

        try {
          const { userId, modelSource } = get();
          // Call API to record selection
          await submitSelection(sessionId, optionId, userId, modelSource); 
        } catch (err) {
          console.error('Selection failed:', err);
        }
      },
      
      // Helper to get current session data for UI
      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find(s => s.id === currentSessionId) || sessions[0];
      }
    }),
    {
      name: 'galonline-storage', // unique name
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sessions: state.sessions, 
        currentSessionId: state.currentSessionId, 
        userId: state.userId,
        memoryMax: state.memoryMax, // Task 2: 持久化记忆深度设置
        modelSource: state.modelSource
      }),
    }
  )
);

export default useStore;
