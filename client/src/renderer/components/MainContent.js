import React from 'react';
import HealthCheck from './HealthCheck';
import ScreenCapture from './ScreenCapture';
import DialogProcessor from './DialogProcessor';
import Settings from './Settings';

const MainContent = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <DialogProcessor />
          </div>
        );
      case 'capture':
        return (
          <div className="content-padding">
            <h2>屏幕捕获</h2>
            <div className="card">
              <ScreenCapture />
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="content-padding">
            <h2>对话历史</h2>
            <p>暂无历史记录</p>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <div className="content-padding">Welcome</div>;
    }
  };

  return (
    <div className="main-content">
      {renderContent()}
    </div>
  );
};

export default MainContent;
