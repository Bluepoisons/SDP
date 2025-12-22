import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '仪表盘' },
    { id: 'capture', label: '屏幕捕获' },
    { id: 'history', label: '对话历史' },
    { id: 'settings', label: '设置' }
  ];

  return (
    <div className="sidebar">
      <div className="header">
        <h3>SDP 助手</h3>
      </div>
      <nav>
        {menuItems.map(item => (
          <div 
            key={item.id}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{
              padding: '10px',
              cursor: 'pointer',
              backgroundColor: activeTab === item.id ? '#37373d' : 'transparent',
              borderRadius: '4px',
              marginBottom: '5px'
            }}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
