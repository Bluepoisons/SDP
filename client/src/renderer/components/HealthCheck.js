import React, { useEffect } from 'react';
import useStore from '../store/useStore';

const HealthCheck = () => {
  const { isConnected, error, checkConnection } = useStore();

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '15px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#2d2d2d' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: isConnected ? '#4caf50' : '#f44336' 
        }} />
        <span style={{ color: '#fff' }}>
          {isConnected ? '后端服务已连接' : '无法连接后端服务'}
        </span>
      </div>
      {error && <p style={{ color: '#f44336', fontSize: '12px', marginTop: '5px' }}>{error}</p>}
      <button 
        onClick={checkConnection}
        style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}
      >
        重试连接
      </button>
    </div>
  );
};

export default HealthCheck;
