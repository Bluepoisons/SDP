import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 情感主题颜色系统 - 核心配置
// ==========================================
const EMOTION_THEMES = {
  reliable: {
    name: '可靠',
    borderColor: '#3b82f6',
    hoverGradient: 'from-blue-600/40',
    topBorder: 'border-blue-500',
  },
  humorous: {
    name: '幽默',
    borderColor: '#f59e0b',
    hoverGradient: 'from-amber-500/40',
    topBorder: 'border-amber-500',
  },
  playful: {
    name: '俏皮',
    borderColor: '#ec4899',
    hoverGradient: 'from-pink-500/40',
    topBorder: 'border-pink-500',
  },
  cold: {
    name: '冷漠',
    borderColor: '#06b6d4',
    hoverGradient: 'from-cyan-500/40',
    topBorder: 'border-cyan-500',
  },
  romantic: {
    name: '热烈',
    borderColor: '#f43f5e',
    hoverGradient: 'from-rose-500/40',
    topBorder: 'border-rose-500',
  },
  serious: {
    name: '严肃',
    borderColor: '#6366f1',
    hoverGradient: 'from-indigo-600/40',
    topBorder: 'border-indigo-500',
  },
  default: {
    name: '普通',
    borderColor: '#8b5cf6',
    hoverGradient: 'from-indigo-600/40',
    topBorder: 'border-indigo-500',
  }
};

// 智能映射：从 option.style 或 option.type 获取主题
const getThemeColor = (option) => {
  const key = (option?.type || option?.style || 'default').toLowerCase();
  
  // 直接匹配
  if (EMOTION_THEMES[key]) return EMOTION_THEMES[key];
  
  // 关键词匹配
  if (key.includes('可靠') || key.includes('reliable')) return EMOTION_THEMES.reliable;
  if (key.includes('幽默') || key.includes('humor')) return EMOTION_THEMES.humorous;
  if (key.includes('俏皮') || key.includes('playful')) return EMOTION_THEMES.playful;
  if (key.includes('冷') || key.includes('cold')) return EMOTION_THEMES.cold;
  if (key.includes('浪漫') || key.includes('romantic')) return EMOTION_THEMES.romantic;
  if (key.includes('严肃') || key.includes('serious')) return EMOTION_THEMES.serious;
  
  return EMOTION_THEMES.default;
};

// ==========================================
// 打字机效果 Hook
// ==========================================
const useTypewriter = (text, speed = 40) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let i = 0;
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isComplete };
};

// ==========================================
// 主组件 - GalgameOptions
// ==========================================
const GalgameOptions = ({ sceneSummary, options, onSelect, thinkingTimeMs, selectedOptionId }) => {
  const thinkingTimeText = typeof thinkingTimeMs === 'number'
    ? `思考时间 ${(thinkingTimeMs / 1000).toFixed(2)}s`
    : null;
  const { displayedText, isComplete } = useTypewriter(
    sceneSummary || "等待命运的指引...", 
    40
  );

  // 获取当前主题（用于对话框顶部边框）
  const currentTheme = options && options.length > 0 
    ? getThemeColor(options[0])
    : EMOTION_THEMES.default;

  // 选项入场动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { x: 50, opacity: 0 },
    show: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  };

  const visibleOptions = selectedOptionId
    ? options.filter((opt) => opt.id === selectedOptionId)
    : options;

  return (
    <>
      {/* 选项区：悬浮在对话框上方 */}
      <AnimatePresence>
        {isComplete && visibleOptions && visibleOptions.length > 0 && (
          <motion.div
            className={
              selectedOptionId
                ? "flex flex-col items-center gap-3 mb-6"
                : "flex flex-col gap-3 mb-6"
            }
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {visibleOptions.map((opt) => {
              const theme = getThemeColor(opt);
              
              // 根据好感度设置边框颜色
              const favorBorderColor = opt.favorChange >= 2 ? '#22c55e' :  // 绿色 (高情商)
                                      opt.favorChange >= 1 ? '#84cc16' :   // 黄绿色
                                      opt.favorChange === 0 ? theme.borderColor : // 默认主题色
                                      opt.favorChange >= -1 ? '#fb923c' :  // 橙色
                                      '#ef4444';                          // 红色 (低情商)

              return (
                <motion.button
                  key={opt.id}
                  variants={itemVariants}
                  onClick={() => onSelect(opt)}
                  className={
                    selectedOptionId
                      ? "group relative w-full max-w-2xl overflow-hidden rounded-lg p-5 text-left transition-all duration-300 shadow-2xl border-l-[6px]"
                      : "group relative overflow-hidden rounded-lg p-5 text-left transition-all duration-300 hover:pl-6 shadow-2xl border-l-[6px]"
                  }
                  style={{
                    backgroundColor: '#000000',
                    borderColor: favorBorderColor,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0a0a0a';
                    // 悬停时增强边框光效
                    e.currentTarget.style.boxShadow = `0 0 20px ${favorBorderColor}80, 0 10px 40px rgba(0,0,0,0.5)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* 内容 */}
                  <div className="relative z-10">
                    {/* 主文字 - 超大号纯白字体 */}
                    <span 
                      className="block text-2xl font-bold transition-transform"
                      style={{
                        color: '#FFFFFF',
                        textShadow: '0 3px 6px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,1)',
                      }}
                    >
                      {opt.emoji} {opt.text}
                    </span>

                    {/* 副信息 */}
                    <div className="flex items-center gap-3 mt-3">
                      {opt.style && (
                        <span 
                          className="text-sm font-medium"
                          style={{
                            color: '#FFFFFF',
                            textShadow: '0 2px 4px rgba(0,0,0,1)',
                          }}
                        >
                          {opt.style}
                        </span>
                      )}
                      {opt.effect && (
                        <span 
                          className="text-sm"
                          style={{
                            color: '#FFFFFF',
                            textShadow: '0 2px 4px rgba(0,0,0,1)',
                          }}
                        >
                          | {opt.effect}
                        </span>
                      )}
                      {/* 好感度评分显示 - 根据分数显示不同颜色 */}
                      {(opt.favorChange !== undefined) && (
                        <span 
                          className="ml-auto text-lg font-bold px-3 py-1 rounded-lg transition-all duration-300"
                          style={{
                            color: '#FFFFFF',
                            backgroundColor: opt.favorChange >= 2 ? 'rgba(34, 197, 94, 0.3)' : 
                                           opt.favorChange >= 1 ? 'rgba(132, 204, 22, 0.3)' :
                                           opt.favorChange === 0 ? 'rgba(107, 114, 128, 0.3)' :
                                           opt.favorChange >= -1 ? 'rgba(251, 146, 60, 0.3)' :
                                           'rgba(239, 68, 68, 0.3)',
                            border: opt.favorChange >= 2 ? '2px solid rgb(34, 197, 94)' :
                                   opt.favorChange >= 1 ? '2px solid rgb(132, 204, 22)' :
                                   opt.favorChange === 0 ? '2px solid rgb(107, 114, 128)' :
                                   opt.favorChange >= -1 ? '2px solid rgb(251, 146, 60)' :
                                   '2px solid rgb(239, 68, 68)',
                            textShadow: '0 3px 6px rgba(0,0,0,1)',
                            boxShadow: opt.favorChange >= 2 ? '0 0 15px rgba(34, 197, 94, 0.5)' :
                                      opt.favorChange >= 1 ? '0 0 15px rgba(132, 204, 22, 0.5)' :
                                      opt.favorChange === 0 ? '0 0 10px rgba(107, 114, 128, 0.3)' :
                                      opt.favorChange >= -1 ? '0 0 15px rgba(251, 146, 60, 0.5)' :
                                      '0 0 15px rgba(239, 68, 68, 0.5)',
                          }}
                        >
                          {opt.favorChange > 0 ? `+${opt.favorChange}` : opt.favorChange} 
                          {opt.favorChange >= 2 ? ' 💚' : 
                           opt.favorChange >= 1 ? ' 💖' : 
                           opt.favorChange === 0 ? ' 💬' : 
                           opt.favorChange >= -1 ? ' 💔' : 
                           ' ❌'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主对话框：底部旁白 - 极致对比度设计 */}
      <motion.div 
        className={`
          bg-slate-950/90 backdrop-blur-xl 
          p-8 rounded-xl 
          border-t-2 ${currentTheme.topBorder}
          shadow-2xl
        `}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* SCENE LOG 标签 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-indigo-400 text-xs font-bold tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            SCENE LOG
          </span>
          {thinkingTimeText && (
            <span className="ml-auto text-xs text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
              {thinkingTimeText}
            </span>
          )}
        </div>

        {/* 旁白文字 - 核心：纯白+大字号+强阴影 */}
        <div className="text-white text-xl leading-relaxed drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
          {displayedText}
          {/* 打字机光标 */}
          {!isComplete && (
            <motion.span
              className="inline-block w-0.5 h-6 bg-indigo-400 ml-1.5 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
          )}
        </div>

        {/* 完成指示箭头 */}
        {isComplete && (
          <motion.div
            className="absolute bottom-4 right-4 text-indigo-400 text-xl"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ▼
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default GalgameOptions;
