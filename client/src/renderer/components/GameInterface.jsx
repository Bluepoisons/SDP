import React, { useState } from 'react';
import axios from 'axios';
import useGameStore from '../store/useGameStore';
import { useTypewriter } from '../hooks/useTypewriter';

const SCENE_COLORS = {
  "夕阳下的教室": "bg-orange-900",
  "雨夜的街道": "bg-slate-900",
  "赛博朋克风的卧室": "bg-purple-900",
  "废弃的工厂": "bg-stone-800",
  "开满樱花的神社": "bg-pink-900",
  "default": "bg-gray-900",
};

const MOOD_EMOJIS = {
  angry: "😠",
  shy: "😳",
  happy: "😄",
  excited: "🤩",
  dark: "👁️",
  love: "😍",
  neutral: "😐",
};

const GameInterface = () => {
  const { currentStyle, setStyle, isLoading, setLoading, gameState, setGameState } = useGameStore();
  const [input, setInput] = useState("");
  const { displayedText, isTyping } = useTypewriter(gameState.text, 40);

  const handleSend = async (msg) => {
    if (!msg || isLoading) return;

    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat', {
        user_input: msg,
        style: currentStyle,
      });
      setGameState(response.data);
    } catch (error) {
      console.error('API Error:', error);
      alert('AI 好像睡着了，请检查后端是否启动');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const sceneKey = Object.keys(SCENE_COLORS).find((key) => gameState.scene.includes(key));
  const bgColor = sceneKey ? SCENE_COLORS[sceneKey] : SCENE_COLORS.default;

  return (
    <div className={`w-full h-screen flex flex-col items-center justify-center transition-colors duration-1000 ${bgColor} text-white`}>
      <div className="absolute top-4 right-4 z-10">
        <select
          value={currentStyle}
          onChange={(event) => setStyle(event.target.value)}
          className="bg-black/50 border border-white/30 rounded px-3 py-1 text-sm outline-none hover:bg-black/70 transition"
        >
          <option value="TSUNDERE">傲娇 (Tsundere)</option>
          <option value="YANDERE">病娇 (Yandere)</option>
          <option value="KUUDERE">三无 (Kuudere)</option>
          <option value="GENKI">元气 (Genki)</option>
        </select>
      </div>

      <div className="absolute top-4 left-4 bg-black/30 px-3 py-1 rounded text-xs text-white/70">
        📍 {gameState.scene}
      </div>

      <div className="flex flex-col items-center gap-6 mb-10">
        {gameState.summary && (
          <div className="mb-4 w-[600px] bg-black/40 border-l-4 border-blue-400 p-3 rounded text-sm text-blue-100 italic animate-fade-in">
            <span>🧠 心理活动: </span>
            {gameState.summary}
          </div>
        )}

        <div className={`text-9xl filter drop-shadow-2xl transition-transform duration-300 ${isTyping ? 'animate-pulse' : ''}`}>
          {MOOD_EMOJIS[gameState.mood] || "😐"}
        </div>

        <div className="w-[600px] min-h-[120px] bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl relative">
          <div className="absolute -top-3 left-4 bg-blue-600 px-3 py-1 text-xs font-bold rounded shadow">
            AI 角色
          </div>

          <p className="text-lg leading-relaxed font-medium tracking-wide">
            {isLoading ? <span className="animate-pulse">正在思考回复...</span> : displayedText}
            {!isLoading && isTyping && <span className="inline-block w-2 h-5 bg-white ml-1 animate-blink"></span>}
          </p>
        </div>
      </div>

      <div className="w-[600px] flex flex-col gap-3">
        {!isTyping && !isLoading && (
          <div className="grid grid-cols-1 gap-2 animate-fade-in-up">
            {gameState.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(opt)}
                className="bg-white/10 hover:bg-white/20 hover:scale-[1.02] border border-white/20 text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm active:scale-95"
              >
                👉 {opt}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSend(input)}
            placeholder="或者输入你想说的话..."
            className="flex-1 bg-black/30 border border-white/20 rounded px-4 py-2 outline-none focus:border-blue-400 transition"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 px-6 py-2 rounded font-bold transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameInterface;
