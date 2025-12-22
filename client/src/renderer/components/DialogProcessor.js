import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';

const DialogProcessor = () => {
  const [inputText, setInputText] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const { 
    generateOptions, 
    isLoading, 
    dialogOptions, 
    sceneSummary,
    error,
    selectOption,
    history 
  } = useStore();

  useEffect(() => {
    let timer;
    if (isLoading) {
      setElapsedTime(0);
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await generateOptions(inputText);
  };

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h2>智能对话处理</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入对话文本..."
          style={{ 
            width: '100%', 
            height: '100px', 
            padding: '10px', 
            marginBottom: '10px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#666' : '#2196f3',
            color: 'white',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {isLoading ? `思考中... (${elapsedTime.toFixed(1)}s)` : '生成选项'}
        </button>
      </form>

      {error && (
        <div style={{ color: '#f44336', marginBottom: '20px' }}>
          错误: {error}
        </div>
      )}

      {dialogOptions.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>生成的选项:</h3>
          
          {sceneSummary && (
            <div style={{
              background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(106, 17, 203, 0.3)',
              borderLeft: '4px solid #ffcc00',
              fontSize: '1em',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💬 场景总结：{sceneSummary}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dialogOptions.map((option, index) => (
              <div 
                key={index}
                onClick={() => selectOption(index)}
                style={{ 
                  padding: '15px', 
                  backgroundColor: '#2d2d2d', 
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3d3d3d';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d2d2d';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
              >
                {/* 装饰条 */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: option.favorChange > 0 ? '#81c784' : (option.favorChange < 0 ? '#e57373' : '#64b5f6')
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '10px' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: '#90caf9',
                    fontSize: '1.1em',
                    fontFamily: '"Microsoft YaHei", sans-serif'
                  }}>
                    {option.id || String.fromCharCode(65 + index)}. {option.style || '风格'}
                  </span>
                  <span style={{ fontSize: '1.5em' }}>{option.emoji}</span>
                </div>
                
                <p style={{ 
                  fontSize: '1.1em', 
                  margin: '5px 0 5px 10px',
                  lineHeight: '1.5',
                  color: '#fff'
                }}>
                  {option.text}
                </p>
                
                <div style={{ 
                  fontSize: '0.9em', 
                  color: option.favorChange > 0 ? '#81c784' : (option.favorChange < 0 ? '#ef5350' : '#bdbdbd'),
                  marginTop: '5px',
                  paddingLeft: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 'bold'
                }}>
                  <span>{option.effect}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3>历史记录</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {history.map((item, index) => (
              <div key={index} style={{ padding: '10px', borderBottom: '1px solid #444' }}>
                <p style={{ color: '#aaa' }}>原文: {item.original}</p>
                <p>选中: {item.selected.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DialogProcessor;