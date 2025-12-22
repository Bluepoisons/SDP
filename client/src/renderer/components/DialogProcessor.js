import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';

const DialogProcessor = () => {
  const [inputText, setInputText] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const { 
    generateOptions, 
    isLoading, 
    dialogOptions, 
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dialogOptions.map((option, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '15px', 
                  backgroundColor: '#424242', 
                  border: '1px solid #555',
                  borderRadius: '4px'
                }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>选项 {index + 1}</p>
                <p>{option.text}</p>
                <p style={{ fontSize: '0.9em', color: '#aaa', marginTop: '5px' }}>
                  风格: {option.style} | 情感: {option.sentiment}
                </p>
                <button
                  onClick={() => selectOption(index)}
                  style={{
                    marginTop: '10px',
                    padding: '5px 15px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  选择此项
                </button>
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