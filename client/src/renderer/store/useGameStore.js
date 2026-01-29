import { create } from 'zustand';
import { processDialog } from '../services/api';

const STYLE_OPTIONS = ['TSUNDERE', 'YANDERE', 'KUUDERE', 'GENKI'];

const useGameStore = create((set, get) => ({
  currentStyle: 'TSUNDERE',
  loading: false,
  error: null,

  scene: '',
  mood: 'neutral',
  text: '',
  options: [],

  history: [],
  selectedOptionIndex: null,
  abortController: null,

  setStyle: (style) => {
    const nextStyle = STYLE_OPTIONS.includes(style) ? style : 'TSUNDERE';
    set({ currentStyle: nextStyle });
  },

  resetCurrent: () => {
    set({
      scene: '',
      mood: 'neutral',
      text: '',
      options: [],
      selectedOptionIndex: null,
      error: null,
    });
  },

  generateDialog: async (inputText) => {
    const { currentStyle, abortController } = get();
    if (!inputText || !inputText.trim()) return;

    if (abortController) abortController.abort();

    const controller = new AbortController();
    set({ loading: true, error: null, abortController: controller, selectedOptionIndex: null });

    try {
      const result = await processDialog(inputText, 'local-user', currentStyle, controller.signal);

      if (!result || result.success === false) {
        set({ loading: false, error: result?.message || '生成失败，请稍后重试。', abortController: null });
        return;
      }

      const payload = result.data || {};
      const nextEntry = {
        id: `history-${Date.now()}`,
        input: inputText,
        style: currentStyle,
        scene: payload.scene || '',
        mood: payload.mood || 'neutral',
        text: payload.text || '',
        options: payload.options || [],
        createdAt: Date.now(),
      };

      set((state) => ({
        scene: nextEntry.scene,
        mood: nextEntry.mood,
        text: nextEntry.text,
        options: nextEntry.options,
        history: [nextEntry, ...state.history],
        loading: false,
        abortController: null,
      }));
    } catch (error) {
      if (error.message === 'Request canceled') return;
      set({ loading: false, error: error.message || '生成失败', abortController: null });
    }
  },

  cancelGeneration: () => {
    const { abortController } = get();
    if (abortController) abortController.abort();
    set({ loading: false, abortController: null });
  },

  selectOption: (index) => {
    set({ selectedOptionIndex: index });
  },
}));

export default useGameStore;
