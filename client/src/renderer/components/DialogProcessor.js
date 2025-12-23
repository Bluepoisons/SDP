import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';

// 打字机效果组件
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
  
  return <span>{displayedText}</span>;
};

// 选项卡片组件
const OptionCard = ({ option, index, onSelect, isSelected, isOtherSelected }) => {
  // 为不同风格定义不同的主题色
  const styleThemes = {
    '治愈系': { bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)', color: '#ff9a9e', icon: '🌸' },
    '氛围': { bg: 'linear-gradient(135deg, #36d1dc, #5b86e5)', color: '#36d1dc', icon: '😄' },
    '心口不一': { bg: 'linear-gradient(135deg, #9d50bb, #6e48aa)', color: '#9d50bb', icon: '😏' },
    '疏离': { bg: 'linear-gradient(135deg, #485563, #29323c)', color: '#485563', icon: '❄️' },
    '太阳': { bg: 'linear-gradient(135deg, #ff6b6b, #ff8e53)', color: '#ff6b6b', icon: '🔥' },
    // 兼容旧标签
    '热情': { bg: 'linear-gradient(135deg, #ff6b6b, #ff8e53)', color: '#ff6b6b', icon: '🔥' },
    '幽默': { bg: 'linear-gradient(135deg, #36d1dc, #5b86e5)', color: '#36d1dc', icon: '😄' },
    '傲娇': { bg: 'linear-gradient(135deg, #9d50bb, #6e48aa)', color: '#9d50bb', icon: '😏' },
    '高冷': { bg: 'linear-gradient(135deg, #485563, #29323c)', color: '#485563', icon: '❄️' },
    '温柔': { bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)', color: '#ff9a9e', icon: '🌸' },
  };

  // 模糊匹配风格
  const styleKey = Object.keys(styleThemes).find(key => 
    (option.style && option.style.includes(key))
  ) || '治愈系';
  
  const theme = styleThemes[styleKey] || styleThemes['治愈系'];

  // 简单的文本格式化：将括号内的动作/心理描写设为斜体
  const formatText = (text) => {
    if (!text) return '';
    // 匹配中文括号、英文括号、星号包裹的内容
    const parts = text.split(/(\(.*?\)|（.*?）|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.match(/^[\(（\*].*[\)）\*]$/)) {
        return <span key={i} style={{ fontStyle: 'italic', fontSize: '0.9em', opacity: 0.8, marginLeft: '4px', marginRight: '4px' }}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div 
      className={`option-card ${styleKey.toLowerCase()} ${isSelected ? 'selected-card' : ''} ${isOtherSelected ? 'fade-out-card' : ''}`}
      style={{ '--card-theme-color': theme.color }}
    >
      {/* 选项序号徽章 */}
      <div className="option-badge" style={{ background: theme.bg }}>
        <span className="option-letter">{option.id}</span>
      </div>

      {/* 风格标签与颜文字 */}
      <div className="style-header">
        <span className="style-tag" style={{ background: theme.bg }}>
          {option.style || '未知身份'}
        </span>
        {option.kaomoji && (
          <span className="kaomoji-tag">{option.kaomoji}</span>
        )}
      </div>

      {/* 对话内容 */}
      <div className="option-content">
        <p className="option-text">"{formatText(option.text)}"</p>
      </div>

      {/* 好感度影响区域 */}
      <div className="option-impact">
        <div className={`favor-change ${option.favorChange > 0 ? 'favor-positive' : option.favorChange < 0 ? 'favor-negative' : 'favor-neutral'}`}>
          <span className="favor-icon">
            {option.favorChange > 0 ? '❤️' : option.favorChange < 0 ? '💔' : '⚪'}
          </span>
          <span className="favor-value">
            {option.favorChange > 0 ? `+${option.favorChange}` : option.favorChange}
          </span>
        </div>
        {option.effect && (
          <div className="impact-tags">
             <span className="impact-tag">{option.effect}</span>
          </div>
        )}
      </div>

      {/* 选择按钮 */}
      <button 
        className="select-button"
        onClick={() => onSelect(option.id)}
        style={{ background: theme.bg }}
        disabled={isOtherSelected}
      >
        {isSelected ? '正在同调...' : '披上此面具'}
        <span className="select-arrow">→</span>
      </button>
    </div>
  );
};

// 加载动画组件
const LoadingState = () => {
  return (
    <div className="loading-container">
      <div className="loading-dots">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="loading-dot"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <p className="loading-text">AI正在编织对话选项...</p>
      <div className="loading-quotes">
        <span>💭 构思中</span>
        <span>🎭 塑造角色</span>
        <span>✨ 注入灵魂</span>
      </div>
    </div>
  );
};

// 增强输入组件
const EnhancedInput = ({ value, onChange, onSubmit, loading, timer, onCancel }) => {
  return (
    <div className="input-container">
      <div className="input-wrapper">
        <textarea
          className="dialog-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入对话内容，让AI生成回应选项..."
          rows={3}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              onSubmit(e);
            }
          }}
        />
        <div className="input-footer">
          <div className="input-hints">
            <span>💡 提示：输入对话内容，如"我好喜欢你啊"</span>
            <span>✨ AI将为你生成5个不同风格的回应</span>
          </div>
          <button 
            className={`generate-button ${loading ? 'loading' : ''}`}
            onClick={loading ? onCancel : onSubmit}
            disabled={!loading && !value.trim()}
            style={loading ? { background: 'rgba(255, 107, 107, 0.2)', border: '1px solid #ff6b6b', color: '#ff6b6b' } : {}}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#ff6b6b' }} />
                <span>生成中 ({timer}s) - 点击取消</span>
              </>
            ) : (
              <>
                🎭 生成选项
                <span className="shortcut">⌘⏎</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DialogProcessor = () => {
  const [inputText, setInputText] = useState('');
  const [timer, setTimer] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null); // 新增：选中状态
  const { 
    generateOptions, 
    cancelGeneration,
    isLoading, 
    dialogOptions, 
    sceneSummary,
    error,
    selectOption 
  } = useStore();

  useEffect(() => {
    let interval;
    if (isLoading) {
      setTimer(0);
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    await generateOptions(inputText);
  };

  const handleCancel = (e) => {
    if (e) e.preventDefault();
    cancelGeneration();
  };

  // 新增：处理选择动画
  const handleOptionSelect = async (id) => {
    setSelectedOptionId(id);
    // 播放动画 800ms 后再执行实际选择
    setTimeout(() => {
      selectOption(null, id); 
      setSelectedOptionId(null);
    }, 800);
  };

  return (
    <div className="dialog-container">
      <div className="app-header">
        <h1 className="app-logo">
          <span>✨</span> SmartDialog Processor
        </h1>
      </div>

      <EnhancedInput 
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        loading={isLoading}
        timer={timer}
        onCancel={handleCancel}
      />

      {error && (
        <div style={{ 
          color: '#ff6b6b', 
          marginBottom: '20px', 
          padding: '15px', 
          background: 'rgba(255, 107, 107, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(255, 107, 107, 0.2)'
        }}>
          ⚠️ 错误: {error}
        </div>
      )}

      {isLoading && <LoadingState />}

      {!isLoading && dialogOptions.length > 0 && (
        <>
          {/* 第一层：场景总结卡 */}
          {sceneSummary && (
            <div className="scene-summary-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '1.5em' }}>🎬</span>
                <h3 style={{ margin: 0 }}>场景侧写</h3>
              </div>
              
              {/* 尝试分割场景侧写内容 */}
              {(() => {
                // 简单的分割逻辑：假设第一段是分析，后面是预告
                // 如果没有明显的双换行，就全部显示在分析区
                const parts = sceneSummary.split(/\n\s*\n/);
                const analysis = parts[0];
                const preview = parts.length > 1 ? parts.slice(1).join('\n\n') : null;
                
                return (
                  <>
                    <div className="scene-analysis">
                      <Typewriter text={analysis} speed={15} />
                    </div>
                    {preview && (
                      <div className="scene-preview">
                        <Typewriter text={preview} speed={10} />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* 第二层：生成选项标题 */}
          <div className="options-header">
            <div className="options-title">
              <span>🎯</span>
              <span>命运的分岔路口</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.9em' }}>
              共生成 {dialogOptions.length} 个回应方案
            </div>
          </div>

          {/* 第三层：选项卡片容器 */}
          <div className="options-grid">
            {dialogOptions.map((option, index) => (
              <OptionCard 
                key={option.id || index} 
                option={option} 
                index={index} 
                onSelect={handleOptionSelect}
                isSelected={selectedOptionId === option.id}
                isOtherSelected={selectedOptionId !== null && selectedOptionId !== option.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DialogProcessor;
