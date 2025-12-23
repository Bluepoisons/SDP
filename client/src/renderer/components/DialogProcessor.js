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
  // 为不同风格定义不同的主题色 - 升级为 Galgame 糖果色系
  const styleThemes = {
    '治愈系': { bg: 'linear-gradient(135deg, #FF9A9E, #FECFEF)', color: '#FF9A9E', icon: '🌸' }, // 樱花粉
    '氛围': { bg: 'linear-gradient(135deg, #A18CD1, #FBC2EB)', color: '#A18CD1', icon: '✨' }, // 梦幻紫
    '心口不一': { bg: 'linear-gradient(135deg, #84FAB0, #8FD3F4)', color: '#4facfe', icon: '💢' }, // 清新蓝绿
    '疏离': { bg: 'linear-gradient(135deg, #E0C3FC, #8EC5FC)', color: '#8EC5FC', icon: '❄️' }, // 冰雪蓝
    '太阳': { bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)', color: '#ff9a9e', icon: '☀️' }, // 暖阳
    // 兼容旧标签
    '热情': { bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)', color: '#ff9a9e', icon: '🔥' },
    '幽默': { bg: 'linear-gradient(135deg, #A18CD1, #FBC2EB)', color: '#A18CD1', icon: '😄' },
    '傲娇': { bg: 'linear-gradient(135deg, #84FAB0, #8FD3F4)', color: '#4facfe', icon: '😤' },
    '高冷': { bg: 'linear-gradient(135deg, #E0C3FC, #8EC5FC)', color: '#8EC5FC', icon: '🧊' },
    '温柔': { bg: 'linear-gradient(135deg, #FF9A9E, #FECFEF)', color: '#FF9A9E', icon: '🎀' },
    '默认': { bg: 'linear-gradient(135deg, #FF9A9E, #FECFEF)', color: '#FF9A9E', icon: '🎀' }
  };

  // 模糊匹配风格
  const styleKey = Object.keys(styleThemes).find(key => 
    (option.style && option.style.includes(key))
  ) || '治愈系';
  
  const theme = styleThemes[styleKey] || styleThemes['默认'];

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
      className={`option-card ${styleKey.toLowerCase()} ${isSelected ? 'selected-card' : ''} ${isOtherSelected ? 'fade-out-card' : ''} stagger-${(index % 5) + 1}`}
      style={{ '--card-theme-color': theme.color }}
      onClick={() => !isOtherSelected && onSelect(option)}
    >
      <div className="option-inner" style={{ borderTop: `4px solid ${theme.color}` }}>
        <div className="style-header">
          <div className="style-tag-ribbon">
            {option.style || '未知'}
          </div>
          <div className="favor-bubble favor-positive">
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
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton-card">
          {/* 内部可以加一些装饰性的线条，或者保持纯净 */}
        </div>
      ))}
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
                <span style={{ fontSize: '1.2em' }}>🪄</span> 
                <span>生成选项</span>
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

  // 【关键修复】：当 dialogOptions 更新（AI 生成新内容）时，重置选中状态
  useEffect(() => {
    setSelectedOptionId(null);
  }, [dialogOptions]);

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
  const handleOptionSelect = (option) => {
    if (selectedOptionId) return; // 防止重复点击
  
    setSelectedOptionId(option.id);
  
    // 增加一个延时，给玩家展示“选择成功”的效果
    setTimeout(() => {
      // 这里触发你原有的选择后续逻辑
      selectOption(null, option.id); 
      // 注意：这里不立即重置 selectedOptionId，等待新数据加载或页面跳转
    }, 1500);
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

      {isLoading && (
        <>
          <div style={{ textAlign: 'center', margin: '20px 0', color: '#aaa', fontSize: '0.9em', letterSpacing: '1px' }}>
            <span style={{ display: 'inline-block', animation: 'spin 2s linear infinite', marginRight: '8px' }}>⏳</span>
            AI 正在编织宿命...
          </div>
          <SkeletonLoader />
        </>
      )}

      {!isLoading && dialogOptions.length > 0 && (
        <>
          {/* 第一层：场景总结卡 */}
          {sceneSummary && (
            <div className="scene-summary-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '1.5em' }}>✨</span>
                <h3 style={{ margin: 0, color: '#FF8FAB' }}>当前氛围</h3>
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
              <span>💖</span>
              <span>心跳的选择</span>
            </div>
            <div style={{ color: '#888', fontSize: '0.9em', fontWeight: '500' }}>
              解锁 {dialogOptions.length} 个心动瞬间
            </div>
          </div>

          {/* 第三层：选项卡片容器 */}
          <div className={`options-grid ${selectedOptionId ? 'has-selection' : ''}`}>
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
