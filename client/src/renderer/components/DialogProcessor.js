import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ImageInputProcessor from './ImageInputProcessor';
import ScreenshotCapture from './ScreenshotCapture';
import GalgameOptions from './GalgameOptions'; // Import the new component
import GalgameInput from './GalgameInput';

// 打字机效果组件 - 升级为支持 Markdown
const Typewriter = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

// 选项卡片组件
const OptionCard = ({ option, index, onSelect, onHover, isSelected, isOtherSelected, isHovered }) => {
  // 动态情感主题：基于 favorChange 决定颜色和标签
  const getEmotionTheme = (favorChange) => {
    if (favorChange > 0) {
      return {
        label: '积极',
        bg: 'linear-gradient(135deg, #FF9A9E, #FFB88C)', // 亮粉到暖橙
        color: '#FF8FAB',
        borderColor: '#FF8FAB',
        icon: '🌟'
      };
    } else if (favorChange < 0) {
      return {
        label: '冷淡',
        bg: 'linear-gradient(135deg, #A18CD1, #6E7C8C)', // 深紫到深灰
        color: '#A18CD1',
        borderColor: '#A18CD1',
        icon: '❄️'
      };
    } else {
      return {
        label: '稳定',
        bg: 'linear-gradient(135deg, #A8E6CF, #BDE8FF)', // 薄荷绿到天蓝
        color: '#7DD3C0',
        borderColor: '#7DD3C0',
        icon: '⚖️'
      };
    }
  };
  
  const theme = getEmotionTheme(option.favorChange || 0);
  
  // 根据 favorChange 决定卡片类名
  const emotionClass = option.favorChange > 0 ? 'card-positive' 
    : option.favorChange < 0 ? 'card-negative' 
    : 'card-neutral';

  // 简单的文本格式化
  const formatText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\(.*?\)|（.*?）|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.match(/^[\(（\*].*[\)）\*]$/)) {
        return <span key={i} style={{ fontStyle: 'italic', fontSize: '0.85em', opacity: 0.7, display: 'block', marginTop: '4px' }}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div 
      className={`option-card ${emotionClass} ${isSelected ? 'selected-card' : ''} ${isOtherSelected ? 'is-dismissed' : ''} stagger-${(index % 3) + 1}`}
      style={{ '--card-theme-color': theme.color }}
      onClick={() => !isOtherSelected && onSelect(option)}
      onMouseEnter={() => onHover && onHover(option.id)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      <div className="option-inner" style={{ borderLeft: `4px solid ${theme.borderColor}` }}>
        <div className="style-header">
          <div className="style-tag-ribbon" style={{ background: theme.bg }}>
            {theme.icon} {theme.label}
          </div>
          <div className={`favor-bubble ${option.favorChange > 0 ? 'favor-positive' : option.favorChange < 0 ? 'favor-negative' : 'favor-neutral'}`}>
             <span className="favor-value">{option.favorChange > 0 ? `+${option.favorChange}` : option.favorChange}</span>
          </div>
        </div>

        <div className="option-content">
          <p className="option-text">{formatText(option.text)}</p>
          {option.description && <p className="option-desc">({option.description})</p>}
        </div>

        <div className="option-impact">
           {option.effect && (
            <div className="impact-tags">
               <span className="impact-tag">{option.effect}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 宿命感小字：只在选中后通过动画浮现 */}
      {isSelected && (
        <div className="destiny-text">
          你的每一个决定都指向着不一样的结局...
        </div>
      )}
    </div>
  );
};

// 骨架屏组件
const SkeletonLoader = () => {
  return (
    <div className="options-grid">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-card">
          {/* 内部可以加一些装饰性的线条，或者保持纯净 */}
        </div>
      ))}
    </div>
  );
};

const DialogProcessor = () => {
  const [inputText, setInputText] = useState('');
  const [timerMs, setTimerMs] = useState(0);
  const [thinkingStage, setThinkingStage] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('gentle');
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hoveredOptionId, setHoveredOptionId] = useState(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showScreenshotCapture, setShowScreenshotCapture] = useState(false);
  const timerStartRef = React.useRef(0);
  
  const { 
    generateOptions, 
    cancelGeneration,
    isLoading, 
    error,
    selectOption,
    getCurrentSession
  } = useStore();

  const session = getCurrentSession();
  const messages = session ? session.messages : [];
  const messagesEndRef = React.useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  // Reset selection when new AI message arrives
  useEffect(() => {
    setSelectedOptionId(null);
  }, [messages.length]);

  useEffect(() => {
    let interval;
    const thoughtSteps = [
      '正在分析潜台词...',
      '检索历史记忆...',
      '推演关系走向...',
      '构建语气模型...'
    ];

    if (isLoading) {
      timerStartRef.current = performance.now();
      setTimerMs(0);
      setThinkingStage(thoughtSteps[0]);
      interval = setInterval(() => {
        const elapsed = performance.now() - timerStartRef.current;
        setTimerMs(elapsed);
        const stepIndex = Math.floor((elapsed / 800) % thoughtSteps.length);
        setThinkingStage(thoughtSteps[stepIndex]);
      }, 50);
    } else {
      setTimerMs(0);
      setThinkingStage('');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    await generateOptions(inputText, selectedStyle);
    setInputText('');
  };

  const handleCancel = (e) => {
    if (e) e.preventDefault();
    cancelGeneration();
  };

  const handleOptionSelect = (option) => {
    if (selectedOptionId) return;
    setSelectedOptionId(option.id);
    setTimeout(() => {
      selectOption(null, option.id);
    }, 1500);
  };

  // 处理从截图识别模块提取的文本
  const handleTextExtracted = (text) => {
    setInputText(text);
    setShowImageInput(false);
  };

  // 处理从高级截图捕获提取的文本
  const handleScreenshotTextExtracted = (text) => {
    setInputText(text);
    setShowScreenshotCapture(false);
    // 自动生成选项
    if (text.trim()) {
      generateOptions(text, selectedStyle);
    }
  };

  return (
    <div className="dialog-container">
      <div className="app-header" style={{ padding: '20px 40px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <h1 className="app-logo" style={{ fontSize: '1.8em', margin: 0, whiteSpace: 'nowrap' }}>
          <span>✨</span> SmartDialog Processor
        </h1>
      </div>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-logo">✨ SDP</div>
            <div className="empty-slogan">编织你的宿命...</div>
          </div>
        ) : (
          messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
            {msg.role === 'user' && (
              <div className="user-bubble">
                <div className="bubble-content">{msg.content}</div>
                <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            )}
            
            {msg.role === 'ai' && (
              <div className="ai-bubble" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                {/* Use the new GalgameOptions component for the latest message */}
                {idx === messages.length - 1 ? (
                  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-4xl z-50">
                    <GalgameOptions 
                      sceneSummary={msg.content}
                      options={msg.options || []}
                      thinkingTimeMs={msg.thinkingTimeMs}
                      onSelect={handleOptionSelect}
                      selectedOptionId={selectedOptionId}
                    />
                  </div>
                ) : (
                  /* For history messages, keep a simpler view or reuse the component without animation if desired */
                  <div className="history-message-container">
                     <div className="scene-message-container" style={{ marginBottom: '10px', padding: '15px' }}>
                        <div className="scene-text" style={{ fontSize: '1rem' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                     </div>
                     {msg.options && (
                       <div className="gal-options-grid" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                          {msg.options.map(opt => (
                            <div key={opt.id} className="gal-option-card" style={{ padding: '10px 15px', minHeight: 'auto' }}>
                               <span style={{ marginRight: '10px' }}>{opt.emoji}</span>
                               <span style={{ color: 'white' }}>{opt.text}</span>
                            </div>
                          ))}
                       </div>
                     )}
                  </div>
                )}
              </div>
            )}

            {msg.role === 'system' && (
              <div className="system-message">
                <span>{msg.content}</span>
              </div>
            )}
          </div>
        ))
      )}

        {isLoading && (
          <div className="loading-container">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                background: 'rgba(24, 24, 27, 0.65)',
                margin: '16px auto',
                maxWidth: '520px',
              }}
            >
              <span style={{ display: 'inline-block', animation: 'spin 1.6s linear infinite' }}>🧠</span>
              <div style={{ flex: 1, fontSize: '0.9em', color: '#c4b5fd', fontFamily: 'monospace' }}>
                <div>{thinkingStage || '正在编织心流...'}</div>
                <div style={{ opacity: 0.7 }}>{(timerMs / 1000).toFixed(2)}s</div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                停止生成
              </button>
            </div>
            <SkeletonLoader />
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ 错误: {error}
          </div>
        )}
        
        <div ref={messagesEndRef} style={{ height: '100px' }} />
      </div>

      <div className="input-area-fixed">
        {/* 截图识别模块 */}
        {showImageInput ? (
          <ImageInputProcessor onTextExtracted={handleTextExtracted} />
        ) : (
          <GalgameInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSubmit}
            loading={isLoading}
            timerMs={timerMs}
            onCancel={handleCancel}
            onToggleScreenshot={() => setShowScreenshotCapture(true)}
            onToggleImage={() => setShowImageInput(!showImageInput)}
            showImageInput={showImageInput}
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
          />
        )}
      </div>

      {/* 高级截图捕获模式 */}
      {showScreenshotCapture && (
        <ScreenshotCapture 
          onTextExtracted={handleScreenshotTextExtracted}
          onClose={() => setShowScreenshotCapture(false)}
        />
      )}
    </div>
  );
};

export default DialogProcessor;
