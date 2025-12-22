import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      // 暂时硬编码后端地址，后续可以配置
      const res = await axios.post('http://localhost:3001/api/dialog/process', {
        text: inputText,
        userId: 'user_001', // 临时用户ID
        style: 'neutral'
      });
      setResponse(res.data);
    } catch (error) {
      console.error('Error:', error);
      alert('请求失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>SmartDialog Processor</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入对话文本..."
          style={{ width: '100%', height: '100px', padding: '10px' }}
        />
      </div>
      
      <button 
        onClick={handleSubmit} 
        disabled={loading}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        {loading ? '处理中...' : '生成选项'}
      </button>

      {response && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>生成结果:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;