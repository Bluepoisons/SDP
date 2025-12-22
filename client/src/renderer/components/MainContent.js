import React from 'react';
import HealthCheck from './HealthCheck';
import ScreenCapture from './ScreenCapture';
import DialogProcessor from './DialogProcessor';

const MainContent = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <h2>仪表盘</h2>
            <div className="card">
              <h3>系统状态</h3>
              <HealthCheck />
            </div>
            <div className="card">
              <DialogProcessor />
            </div>
          </div>
        );
      case 'capture':
        return (
          <div>
            <h2>屏幕捕获</h2>
            <div className="card">
              <ScreenCapture />
            </div>
          </div>
        );
      case 'history':
        return (
          <div>
            <h2>对话历史</h2>
            <p>暂无历史记录</p>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2>设置</h2>
            <div className="card">
              <h3>API 配置</h3>
              <p>配置 SiliconFlow (DeepSeek) API Key</p>
            </div>
          </div>
        );
      default:
        return <div>Welcome</div>;
    }
  };

  return (
    <div className="main-content">
      {renderContent()}
    </div>
  );
};

export default MainContent;
