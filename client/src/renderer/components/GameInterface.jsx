import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, MessageCircle } from 'lucide-react';
import useGameStore from '../store/useGameStore';
import { useTypewriter } from '../hooks/useTypewriter';

// === 视觉配置 ===
const MOOD_THEMES = {
  "angry":  { color: "from-red-500/20 to-orange-500/20", icon: "💢", shadow: "shadow-red-500/50" },
  "shy":    { color: "from-pink-500/20 to-rose-500/20", icon: "😳", shadow: "shadow-pink-500/50" },
  "happy":  { color: "from-yellow-400/20 to-orange-400/20", icon: "✨", shadow: "shadow-yellow-500/50" },
  "dark":   { color: "from-gray-900/80 to-purple-900/80", icon: "👁️", shadow: "shadow-purple-900/50" },
  "neutral":{ color: "from-blue-500/20 to-cyan-500/20", icon: "💬", shadow: "shadow-blue-500/50" },
  "excited":{ color: "from-green-400/20 to-emerald-500/20", icon: "🤩", shadow: "shadow-green-500/50" },
  "love":   { color: "from-red-400/20 to-pink-500/20", icon: "😍", shadow: "shadow-pink-500/50" }
};

const GameInterface = () => {
  const { currentStyle, setStyle, isLoading, setLoading, gameState, setGameState } = useGameStore();
  const [input, setInput] = useState("");
  
  // 打字机效果
  const { displayedText, isTyping } = useTypewriter(gameState.text, 30);
  
  // 当前主题色
  const theme = MOOD_THEMES[gameState.mood] || MOOD_THEMES["neutral"];

  const handleSend = async (msg) => {
    if (!msg || isLoading) return;
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/chat', {
        user_input: msg,
        style: currentStyle
      });
      setGameState(res.data);
    } catch (error) {
      console.error(error);
      alert('AI 连接失败，请检查后端是否运行');
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 text-white font-sans">
      
      {/* === 1. 动态氛围背景 (Cinematic Background) === */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} transition-colors duration-1000 ease-in-out`} />
      {/* 噪点纹理，增加质感 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* === 2. 顶部状态栏 === */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold tracking-widest opacity-50 uppercase">Current Scene</span>
          <span className="text-xl font-serif italic flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400"/> {gameState.scene}
          </span>
        </div>
        
        {/* 风格切换器 (玻璃拟态) */}
        <div className="relative group">
          <select 
            value={currentStyle} 
            onChange={(e) => setStyle(e.target.value)}
            className="appearance-none bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 text-sm font-medium hover:bg-white/10 transition cursor-pointer outline-none"
          >
            <option value="TSUNDERE">Tsundere (傲娇)</option>
            <option value="YANDERE">Yandere (病娇)</option>
            <option value="KUUDERE">Kuudere (三无)</option>
            <option value="GENKI">Genki (元气)</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs opacity-50">▼</div>
        </div>
      </div>

      {/* === 3. 核心内容区 === */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center max-w-4xl mx-auto px-4">
        
        {/* 立绘占位 (呼吸动画) */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
        >
          {theme.icon}
        </motion.div>

        {/* === 4. 智能对话容器 === */}
        <div className="w-full flex flex-col gap-4">
          
          {/* A. 内心独白 (Summary) - 像悬浮的思绪 */}
          {gameState.summary && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-center bg-black/40 backdrop-blur-sm border-l-2 border-blue-400/50 pl-4 pr-6 py-2 rounded-r-lg max-w-2xl"
            >
              <div className="flex items-center gap-2 text-blue-200/80 text-xs font-bold uppercase tracking-wider mb-1">
                <Brain size={12} /> Inner Thought
              </div>
              <p className="text-gray-300 italic text-sm font-light leading-relaxed">
                "{gameState.summary}"
              </p>
            </motion.div>
          )}

          {/* B. 主对话框 (Text) - 玻璃拟态 */}
          <div className={`relative w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl ${theme.shadow} transition-shadow duration-500`}>
            {/* 装饰角标 */}
            <div className="absolute -top-3 left-6 bg-white text-black px-3 py-1 text-xs font-bold rounded shadow-lg flex items-center gap-1">
              <MessageCircle size={12} /> AI COMPANION
            </div>

            <p className="text-lg md:text-xl font-medium leading-relaxed tracking-wide min-h-[3rem]">
               {isLoading ? (
                 <span className="flex items-center gap-2 opacity-50">
                   <span className="w-2 h-2 bg-white rounded-full animate-bounce"/>
                   <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: "0.1s"}}/>
                   <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: "0.2s"}}/>
                 </span>
               ) : displayedText}
            </p>
          </div>

          {/* C. 选项区 (Options) - 自动布局 */}
          {!isTyping && !isLoading && gameState.options && gameState.options.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {gameState.options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleSend(opt)}
                  className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl p-4 text-left transition-all active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <span className="relative text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                    {opt}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* D. 底部输入栏 (可选，平时隐藏或半透明) */}
        <div className="w-full mt-8 opacity-50 hover:opacity-100 transition-opacity">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type your response..."
            className="w-full bg-transparent border-b border-white/20 px-2 py-2 outline-none text-center focus:border-white/60 transition-colors placeholder:text-white/20"
          />
        </div>

      </div>
    </div>
  );
};

export default GameInterface;
