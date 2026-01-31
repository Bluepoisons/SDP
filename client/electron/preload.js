/**
 * Electron Preload Script
 * 安全地暴露 API 给渲染进程
 */
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 桌面截图
  captureDesktop: (options) => ipcRenderer.invoke('capture-desktop', options),
  
  // 取消截图
  cancelCapture: () => ipcRenderer.invoke('cancel-capture'),
  
  // 获取平台信息
  platform: process.platform,
  
  // 版本信息
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

console.log('✅ Preload script loaded');
