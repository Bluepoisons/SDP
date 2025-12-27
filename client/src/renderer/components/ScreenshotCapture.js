import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import Tesseract from 'tesseract.js';

// 检测是否在 Electron 环境中
const isElectron = () => {
  return typeof window !== 'undefined' && window.process && window.process.type === 'renderer';
};

/**
 * OCR 文本清理函数
 * 过滤干扰项、合并多行、添加角色前缀
 */
const cleanOCRText = (text) => {
  if (!text) return '';
  
  // 1. 过滤常见截图干扰项
  let cleaned = text
    .replace(/\d{1,2}:\d{2}/g, '') // 移除时间戳
    .replace(/\d{1,3}%/g, '') // 移除电量百分比
    .replace(/(中国移动|中国联通|中国电信|WiFi|4G|5G)/g, '')
    .replace(/(今天|昨天|前天|星期[一二三四五六日])/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 2. 合并多行为一个段落
  cleaned = cleaned.replace(/\n+/g, ' ').trim();
  
  // 3. 添加角色前缀
  if (cleaned && !cleaned.startsWith('对方说：')) {
    cleaned = `对方说：${cleaned}`;
  }
  
  return cleaned;
};

/**
 * 图像预处理：Canvas二值化处理
 */
const preprocessImage = (imageSrc) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const binary = gray > 128 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = binary;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = imageSrc;
  });
};

const ScreenshotCapture = ({ onTextExtracted, onClose }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [selection, setSelection] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [showProofread, setShowProofread] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [editableText, setEditableText] = useState('');
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // ESC 键退出
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // 如果在 Electron 环境，通知主进程关闭截图窗口
        if (isElectron() && window.require) {
          try {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('close-screenshot');
          } catch (error) {
            console.error('关闭截图窗口失败:', error);
          }
        }
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 进入暗房模式：截取整个桌面（Electron）或当前页面（Web）
  useEffect(() => {
    const captureScreen = async () => {
      try {
        let imageDataUrl;
        
        // 优先使用 Electron 的桌面截图功能
        if (isElectron() && window.require) {
          try {
            const { ipcRenderer } = window.require('electron');
            console.log('🖥️ 使用 Electron 桌面截图...');
            
            // 监听截图窗口准备就绪事件
            ipcRenderer.once('screenshot-ready', (event, dataUrl) => {
              console.log('📸 截图数据已接收');
              // 应用模糊效果
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.filter = 'blur(15px)';
                ctx.drawImage(img, 0, 0);
                setCapturedImage(canvas.toDataURL());
              };
              img.src = dataUrl;
            });
            
            // 调用主进程的桌面截图功能（会创建全屏透明窗口）
            imageDataUrl = await ipcRenderer.invoke('capture-desktop');
            
            // 注意：此时主窗口已隐藏，全屏透明窗口已创建
            // 后续操作将在新窗口的上下文中进行
            if (imageDataUrl) {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.filter = 'blur(15px)';
                ctx.drawImage(img, 0, 0);
                setCapturedImage(canvas.toDataURL());
              };
              img.src = imageDataUrl;
            }
            return;
          } catch (electronError) {
            console.warn('⚠️ Electron 截图失败，降级使用网页截图:', electronError);
          }
        }
        
        // 降级方案：截取当前页面（仅客户端内部）
        console.log('📄 使用网页截图...');
        const canvas = await html2canvas(document.body, {
          allowTaint: true,
          useCORS: true,
          backgroundColor: null,
        });
        
        // 将 canvas 转为带模糊的 dataURL
        const ctx = canvas.getContext('2d');
        ctx.filter = 'blur(15px)';
        ctx.drawImage(canvas, 0, 0);
        
        setCapturedImage(canvas.toDataURL());
      } catch (error) {
        console.error('截图失败:', error);
        alert('截图失败，请重试');
        onClose();
      }
    };
    
    captureScreen();
  }, [onClose]);

  // 鼠标按下开始选择
  const handleMouseDown = (e) => {
    if (!capturedImage) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
    setSelection(null);
  };

  // 鼠标移动更新选区
  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionEnd({ x, y });
  };

  // 鼠标松开完成选择
  const handleMouseUp = () => {
    if (!isSelecting) return;
    
    setIsSelecting(false);
    
    if (selectionStart && selectionEnd) {
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      
      // 忽略太小的选区
      if (width > 20 && height > 20) {
        setSelection({
          x: Math.min(selectionStart.x, selectionEnd.x),
          y: Math.min(selectionStart.y, selectionEnd.y),
          width,
          height
        });
      }
    }
  };

  // 计算当前选区矩形
  const getCurrentRect = () => {
    if (!selectionStart || !selectionEnd) return null;
    
    return {
      x: Math.min(selectionStart.x, selectionEnd.x),
      y: Math.min(selectionStart.y, selectionEnd.y),
      width: Math.abs(selectionEnd.x - selectionStart.x),
      height: Math.abs(selectionEnd.y - selectionStart.y)
    };
  };

  const currentRect = isSelecting ? getCurrentRect() : selection;

  // 执行OCR识别
  const handleRecognize = async () => {
    if (!selection) return;
    
    setIsRecognizing(true);
    setRecognitionProgress(0);
    
    try {
      // 从原图中裁剪选区
      const img = new Image();
      img.src = capturedImage;
      await new Promise(resolve => { img.onload = resolve; });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = selection.width;
      canvas.height = selection.height;
      
      // 裁剪选区
      ctx.drawImage(
        img,
        selection.x, selection.y, selection.width, selection.height,
        0, 0, selection.width, selection.height
      );
      
      const croppedImg = canvas.toDataURL();
      setCroppedImageUrl(croppedImg);
      
      // 图像预处理
      const processedImg = await preprocessImage(croppedImg);
      
      // OCR识别
      const { data: { text } } = await Tesseract.recognize(
        processedImg,
        'chi_sim+eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const progress = Math.round(m.progress * 100);
              setRecognitionProgress(progress);
            }
          }
        }
      );
      
      // 清理文本
      const cleanedText = cleanOCRText(text);
      setEditableText(cleanedText);
      setShowProofread(true);
    } catch (error) {
      console.error('OCR识别失败:', error);
      alert('识别失败，请重试');
    } finally {
      setIsRecognizing(false);
      setRecognitionProgress(0);
    }
  };

  // 确认并继续编织
  const handleContinue = () => {
    onTextExtracted(editableText);
    onClose();
  };

  return (
    <div className="screenshot-capture-overlay">
      {/* 暗房模式背景 */}
      {capturedImage && (
        <div 
          ref={containerRef}
          className="screenshot-darkroom"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ 
            backgroundImage: `url(${capturedImage})`,
            backgroundSize: 'cover',
            cursor: 'crosshair'
          }}
        >
          {/* 全屏黑色遮罩 */}
          <div className="darkroom-mask"></div>
          
          {/* 选区高亮 */}
          {currentRect && (
            <>
              <div 
                className="selection-highlight"
                style={{
                  left: currentRect.x,
                  top: currentRect.y,
                  width: currentRect.width,
                  height: currentRect.height
                }}
              />
              
              {/* 选区边框 */}
              <div 
                className="selection-border"
                style={{
                  left: currentRect.x,
                  top: currentRect.y,
                  width: currentRect.width,
                  height: currentRect.height
                }}
              />
              
              {/* 工具栏（选区右下角） */}
              {selection && !isRecognizing && !showProofread && (
                <div 
                  className="selection-toolbar"
                  style={{
                    left: selection.x + selection.width + 10,
                    top: selection.y + selection.height - 40
                  }}
                >
                  <button 
                    className="toolbar-btn toolbar-btn-cancel"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                  >
                    <span className="toolbar-icon">✕</span>
                  </button>
                  <button 
                    className="toolbar-btn toolbar-btn-recognize"
                    onClick={(e) => { e.stopPropagation(); handleRecognize(); }}
                  >
                    <span className="toolbar-icon">🔍</span>
                    <span className="toolbar-label">识别</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 识别中状态 */}
      {isRecognizing && (
        <div className="recognizing-overlay">
          <div className="recognizing-container">
            <div className="laser-scanner">
              <div className="laser-beam"></div>
            </div>
            <p className="recognizing-text">正在识别文字...</p>
            <div className="recognition-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${recognitionProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">{recognitionProgress}%</p>
          </div>
        </div>
      )}

      {/* 居中校对框 */}
      {showProofread && (
        <div className="proofread-modal-overlay">
          <div className="proofread-modal proofread-compact">
            <div className="proofread-header">
              <h3>总结对话</h3>
              <button className="close-btn" onClick={() => setShowProofread(false)}>✕</button>
            </div>
            <div className="proofread-content proofread-vertical">
              <div className="proofread-image-preview">
                <img src={croppedImageUrl} alt="识别区域" />
              </div>
              <div className="proofread-text-edit">
                <textarea 
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  rows={6}
                  placeholder="请编辑对方说的话..."
                />
                <div className="proofread-hint">
                  💡 系统已自动过滤干扰项，可修改后点击"继续编织"生成回应
                </div>
              </div>
            </div>
            <div className="proofread-actions">
              <button className="btn-secondary" onClick={() => setShowProofread(false)}>重新框选</button>
              <button className="btn-primary" onClick={handleContinue}>
                <span style={{ marginRight: '6px' }}>🪄</span>
                继续编织
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESC 退出提示 */}
      <div className="screenshot-hint">
        <span>按 ESC 退出</span>
      </div>
    </div>
  );
};

export default ScreenshotCapture;
