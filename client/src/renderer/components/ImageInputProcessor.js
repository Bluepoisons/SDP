import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Tesseract from 'tesseract.js';

/**
 * OCR 文本清理函数
 * 过滤干扰项、合并多行、添加角色前缀
 */
const cleanOCRText = (text) => {
  if (!text) return '';
  
  // 1. 过滤常见截图干扰项
  let cleaned = text
    // 移除时间戳 (12:30, 23:59 等)
    .replace(/\d{1,2}:\d{2}/g, '')
    // 移除电量百分比 (100%, 95% 等)
    .replace(/\d{1,3}%/g, '')
    // 移除常见状态栏文字
    .replace(/(中国移动|中国联通|中国电信|WiFi|4G|5G)/g, '')
    // 移除日期标记 (今天、昨天、星期等)
    .replace(/(今天|昨天|前天|星期[一二三四五六日])/g, '')
    // 移除多余空格
    .replace(/\s+/g, ' ')
    .trim();
  
  // 2. 合并多行为一个段落（保留有意义的换行）
  cleaned = cleaned.replace(/\n+/g, ' ').trim();
  
  // 3. 添加角色前缀（帮助 AI 理解语境）
  if (cleaned && !cleaned.startsWith('对方说：')) {
    cleaned = `对方说：${cleaned}`;
  }
  
  return cleaned;
};

/**
 * 图像预处理：Canvas二值化处理
 * 提高OCR识别率（对比度增强 + 灰度化 + 二值化）
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
      
      // 绘制原图
      ctx.drawImage(img, 0, 0);
      
      // 获取像素数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 灰度化 + 对比度增强 + 二值化
      for (let i = 0; i < data.length; i += 4) {
        // 灰度化
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // 对比度增强（简单的阈值二值化，阈值=128）
        const binary = gray > 128 ? 255 : 0;
        
        data[i] = binary;     // R
        data[i + 1] = binary; // G
        data[i + 2] = binary; // B
        // Alpha通道保持不变
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = imageSrc;
  });
};

const ImageInputProcessor = ({ onTextExtracted }) => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [showProofreadModal, setShowProofreadModal] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [editableText, setEditableText] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  // 处理图片上传
  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  // 处理粘贴事件
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          handleImageUpload(file);
          e.preventDefault();
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // 处理拖放
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  // 生成裁剪后的图片
  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return null;
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return canvas.toDataURL('image/png');
  };

  // 执行OCR识别
  const handleRecognize = async () => {
    if (!completedCrop) {
      alert('请先框选要识别的区域');
      return;
    }

    setIsRecognizing(true);
    setRecognitionProgress(0);
    setShowCropModal(false);

    try {
      // 获取裁剪后的图片
      const croppedImg = await getCroppedImg();
      setCroppedImageUrl(croppedImg);

      // 图像预处理（提高识别率）
      const processedImg = await preprocessImage(croppedImg);

      // 使用Tesseract.js进行OCR识别（支持中文+英文）
      const { data: { text } } = await Tesseract.recognize(
        processedImg,
        'chi_sim+eng', // 简体中文 + 英文
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const progress = Math.round(m.progress * 100);
              setRecognitionProgress(progress);
              console.log(`识别进度: ${progress}%`);
            }
          }
        }
      );

      // 使用清理函数处理识别结果
      const cleanedText = cleanOCRText(text);
      setRecognizedText(cleanedText);
      setEditableText(cleanedText);
      setShowProofreadModal(true);
    } catch (error) {
      console.error('OCR识别失败:', error);
      alert('识别失败，请重试');
    } finally {
      setIsRecognizing(false);
      setRecognitionProgress(0);
    }
  };

  // 确认校对结果
  const handleConfirmProofread = () => {
    onTextExtracted(editableText);
    setShowProofreadModal(false);
    setUploadedImage(null);
    setShowCropModal(false);
  };

  return (
    <div className="image-input-processor">
      {/* 上传区 - Apple Style Dropzone */}
      <div 
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-content">
          <div className="upload-icon">📸</div>
          <div className="upload-text">
            <p className="primary-text">点击上传或拖拽截图</p>
            <p className="secondary-text">支持 Ctrl+V 直接粘贴剪贴板图片</p>
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={(e) => handleImageUpload(e.target.files[0])}
          style={{ display: 'none' }}
        />
      </div>

      {/* 裁剪模态框 - 仿微信截图风格 */}
      {showCropModal && uploadedImage && (
        <div className="screenshot-modal" onClick={() => setShowCropModal(false)}>
          <div className="screenshot-container" onClick={(e) => e.stopPropagation()}>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              className="wechat-style-crop"
            >
              <img 
                ref={imgRef}
                src={uploadedImage} 
                alt="上传的图片"
                style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block' }}
              />
            </ReactCrop>
            
            {/* 底部悬浮工具栏 */}
            <div className="crop-tool-bar">
              <button 
                className="tool-btn tool-btn-cancel"
                onClick={() => setShowCropModal(false)}
                title="取消"
              >
                <span className="tool-icon">✕</span>
                <span className="tool-label">取消</span>
              </button>
              <button 
                className="tool-btn tool-btn-ocr"
                onClick={handleRecognize}
                disabled={!completedCrop}
                title="文字识别"
              >
                <span className="tool-icon">🔍</span>
                <span className="tool-label">识别</span>
              </button>
              <button 
                className="tool-btn tool-btn-confirm"
                onClick={handleRecognize}
                disabled={!completedCrop}
                title="确定"
              >
                <span className="tool-icon">✓</span>
                <span className="tool-label">确定</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 识别中状态 - 激光扫描动画 + 进度条 */}
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

      {/* 校对弹窗 */}
      {showProofreadModal && (
        <div className="proofread-modal-overlay">
          <div className="proofread-modal ocr-result-editor">
            <div className="proofread-header">
              <h3>确认对话内容</h3>
              <button className="close-btn" onClick={() => setShowProofreadModal(false)}>✕</button>
            </div>
            <div className="proofread-content">
              <div className="proofread-left">
                <h4>识别区域</h4>
                <img src={croppedImageUrl} alt="识别区域" />
              </div>
              <div className="proofread-right">
                <h4>对话内容（可修改错别字）</h4>
                <textarea 
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  rows={10}
                  placeholder="请编辑对方说的话..."
                />
                <div className="proofread-hint">
                  💡 <strong>提示</strong>：系统已自动标记为"对方说的话"并过滤干扰项（时间戳、电量等），请检查识别结果是否准确
                </div>
              </div>
            </div>
            <div className="proofread-actions">
              <button className="btn-secondary" onClick={() => setShowProofreadModal(false)}>重新框选</button>
              <button className="btn-primary" onClick={handleConfirmProofread}>确认生成选项</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageInputProcessor;
