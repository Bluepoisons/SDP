import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '心动现场', icon: '💖' },
    { id: 'capture', label: '捕捉瞬间', icon: '📸' },
    { id: 'gallery', label: '羁绊星空', icon: '🌌' },
    { id: 'history', label: '回忆相册', icon: '📒' },
    { id: 'settings', label: '系统设置', icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="app-header">
        <h1 className="app-logo">
          <span>✨</span> <span>SDP</span>
        </h1>
      </div>
      <nav>
        {menuItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
