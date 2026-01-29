import { create } from 'zustand';

const useGameStore = create((set) => ({
  currentStyle: 'TSUNDERE',
  isLoading: false,
  gameState: {
    summary: "她轻哼一声，似乎有点在意你的到来。",
    text: "哼，你终于来了？我还以为你迷路了呢！(￣^￣)",
    mood: "angry",
    scene: "夕阳下的教室",
    options: ["抱歉，我迟到了", "不仅来了，还给你带了礼物", "别生气嘛"],
  },

  setStyle: (style) => set({ currentStyle: style }),
  setLoading: (loading) => set({ isLoading: loading }),
  setGameState: (newState) => set({ gameState: newState }),
}));

export default useGameStore;
