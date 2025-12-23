import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'capture', label: '屏幕捕获', icon: '📸' },
    { id: 'gallery', label: '关系星系', icon: '🌌' }, // 新增：角色图鉴/关系星系
    { id: 'history', label: '对话历史', icon: '📜' },
    { id: 'settings', label: '设置', icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="app-header">
        <h1 className="app-logo">
          <span>✨</span> SDP助手
        </h1>
      </div>
      <nav>
        {menuItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
