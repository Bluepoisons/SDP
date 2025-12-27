import React, { useState } from 'react';
import useStore from '../store/useStore';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { sessions, currentSessionId, switchSession, createNewSession } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: '对话', icon: '' },
    { id: 'capture', label: '截图', icon: '' },
    { id: 'gallery', label: '羁绊星空', icon: '' },
    { id: 'history', label: '回忆相册', icon: '' },
    { id: 'settings', label: '系统设置', icon: '' }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 固定头部：Logo 永不消失 */}
      <div className="sidebar-header">
        <h1 className="app-logo">
          <span>旮旯Online</span>
        </h1>
      </div>

      {/* 可滚动内容区 */}
      <div className="sidebar-content">
        <nav className="main-nav">
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

        <div className="sessions-container">
          <div className="sessions-header">
            <span className="sessions-title">剧本回溯</span>
            <button className="new-session-btn" onClick={createNewSession} title="开启新篇章">
              +
            </button>
          </div>
          <div className="sessions-list">
            {sessions.map(session => (
              <div 
                key={session.id}
                className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                onClick={() => switchSession(session.id)}
              >
                <div className="session-name">{session.title}</div>
                <div className="session-time">
                  {new Date(session.lastTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 固定底部（预留扩展） */}
      <div className="sidebar-footer">
        {/* 可放置用户信息或版本信息 */}
      </div>
    </div>
  );
};

export default Sidebar;
