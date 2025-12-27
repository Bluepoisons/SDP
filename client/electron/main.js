const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let screenshotWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // 为了简化开发，暂时允许 nodeIntegration
      webSecurity: false // 允许跨域请求（如果需要）
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // 处理桌面截图请求 - 微信截图式全屏透明窗口
  ipcMain.handle('capture-desktop', async (event, options = {}) => {
    try {
      if (!mainWindow) {
        throw new Error('主窗口不存在');
      }

      // 1. 隐藏主窗口
      mainWindow.hide();
      
      // 2. 等待窗口完全隐藏
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. 获取屏幕尺寸
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.bounds;
      
      // 4. 截取桌面
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width, height }
      });
      
      if (sources.length === 0) {
        mainWindow.show();
        throw new Error('无法获取屏幕源');
      }
      
      const screenshotData = sources[0].thumbnail.toDataURL();
      
      // 5. 创建全屏透明窗口用于截图操作
      screenshotWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });
      
      // 6. 加载截图界面（使用 data URI 传递截图数据）
      const screenshotHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      width: 100vw; 
      height: 100vh; 
      overflow: hidden;
      cursor: crosshair;
    }
    #screenshot-canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(15px);
    }
  </style>
</head>
<body>
  <img id="screenshot-canvas" src="${screenshotData}" />
  <script>
    const { ipcRenderer } = require('electron');
    // 通知渲染进程截图已准备好
    ipcRenderer.send('screenshot-ready', '${screenshotData}');
    
    // ESC 键关闭截图窗口
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        ipcRenderer.send('close-screenshot');
      }
    });
  </script>
</body>
</html>
      `;
      
      screenshotWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(screenshotHtml)}`);
      
      return screenshotData;
    } catch (error) {
      console.error('桌面截图失败:', error);
      if (mainWindow) {
        mainWindow.show();
      }
      throw error;
    }
  });
  
  // 关闭截图窗口并恢复主窗口
  ipcMain.on('close-screenshot', () => {
    if (screenshotWindow) {
      screenshotWindow.close();
      screenshotWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  // 截图准备就绪事件
  ipcMain.on('screenshot-ready', (event, dataUrl) => {
    // 可以在这里做额外处理
    console.log('📸 截图窗口已就绪');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});