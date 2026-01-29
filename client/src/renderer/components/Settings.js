import React, { useState } from 'react';
import useStore from '../store/useStore';
import SettingsModal from './SettingsModal';

const Settings = () => {
  const { modelSource, setModelSource } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="content-padding">
        <h2>系统设置</h2>
        
        {/* 打开完整设置面板按钮 */}
        <div className="card settings-card mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
          >
            ⚙️ 打开完整设置面板
          </button>
          <p className="text-sm text-gray-500 mt-2 text-center">
            包含记忆深度、日志查看等高级功能
          </p>
        </div>
        
        <div className="card settings-card">
        <h3>模型来源</h3>
        <div className="setting-item">
          <label className="radio-label">
            <input 
              type="radio" 
              name="modelSource" 
              value="external" 
              checked={modelSource === 'external'} 
              onChange={(e) => setModelSource(e.target.value)} 
            />
            外部 API (SiliconFlow / OpenAI)
          </label>
          <p className="setting-desc">使用云端大模型，无需本地显卡，响应速度快。</p>
        </div>

        <div className="setting-item">
          <label className="radio-label">
            <input 
              type="radio" 
              name="modelSource" 
              value="local" 
              checked={modelSource === 'local'} 
              onChange={(e) => setModelSource(e.target.value)} 
            />
            本地模型 (Python Backend)
          </label>
          <p className="setting-desc">使用本地运行的 Python 后端模型，数据隐私更安全，需要较好的硬件支持。</p>
        </div>
      </div>

      {modelSource === 'external' && (
        <div className="card settings-card">
          <h3>API 配置</h3>
          <div className="input-group">
            <label>API Key</label>
            <input type="password" placeholder="sk-..." className="input-field" />
          </div>
        </div>
      )}

      {modelSource === 'local' && (
        <div className="card settings-card">
          <h3>本地模型配置</h3>
          <div className="input-group">
            <label>后端地址</label>
            <input type="text" defaultValue="http://localhost:8000" className="input-field" />
          </div>
          <p className="status-text">状态: 未连接</p>
        </div>
      )}
    </div>
    
    {/* Task 2: 完整设置面板（包含记忆深度和日志查看） */}
    <SettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
  </>
  );
};

export default Settings;
