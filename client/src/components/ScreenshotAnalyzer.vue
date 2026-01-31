<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { X, Zap, User, Bot, RotateCcw, Maximize2, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-vue-next';
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue';
import Button from '@/components/ui/button/Button.vue';

/**
 * 👁️ 战术目视 - 截图分析器
 * 将游戏截图转换为可分析的对话上下文
 */

interface OcrBubble {
  id: string;
  text: string;
  isMe: boolean;  // true = 主角, false = 对方
  confidence: number;
}

const props = defineProps<{
  imageUrl: string;
  ocrResult?: string[];
}>();

const emit = defineEmits<{
  close: [];
  execute: [bubbles: OcrBubble[]];
}>();

// 🎯 解析后的对话气泡
const bubbles = ref<OcrBubble[]>([]);

// 📊 AI 预判结果
const aiPrediction = ref({
  emotion: '期待',
  confidence: 85,
  suggestion: '这是一个关键的情感转折点'
});

// 🔍 图片缩放
const imageScale = ref(1);
const zoomIn = () => { imageScale.value = Math.min(2, imageScale.value + 0.25); };
const zoomOut = () => { imageScale.value = Math.max(0.5, imageScale.value - 0.25); };
const resetZoom = () => { imageScale.value = 1; };

// 🔄 切换说话人
const toggleRole = (index: number) => {
  bubbles.value[index].isMe = !bubbles.value[index].isMe;
};

// 🗑️ 删除气泡
const removeBubble = (index: number) => {
  bubbles.value.splice(index, 1);
};

// ✏️ 添加气泡
const addBubble = () => {
  bubbles.value.push({
    id: `bubble-${Date.now()}`,
    text: '',
    isMe: false,
    confidence: 100  // 手动添加的置信度为100
  });
};

// 🚀 执行战术
const executeStrategy = () => {
  emit('execute', bubbles.value);
};

// 📝 初始化 OCR 结果
const initializeFromOcr = () => {
  if (props.ocrResult && props.ocrResult.length > 0) {
    bubbles.value = props.ocrResult.map((text, index) => ({
      id: `ocr-${index}`,
      text,
      isMe: index % 2 === 1,  // 简单交替，用户可调整
      confidence: 75 + Math.random() * 20  // 模拟置信度
    }));
  } else {
    // Mock 数据用于演示
    bubbles.value = [
      { id: '1', text: '今天的月色真美呢...', isMe: false, confidence: 92 },
      { id: '2', text: '（她在暗示什么吗？）', isMe: true, confidence: 88 },
      { id: '3', text: '你觉得呢？', isMe: false, confidence: 95 },
    ];
  }
};

onMounted(() => {
  initializeFromOcr();
});

// 计算是否可以执行
const canExecute = computed(() => {
  return bubbles.value.length > 0 && bubbles.value.some(b => b.text.trim());
});
</script>

<template>
  <Teleport to="body">
    <div class="analyzer-overlay">
      <!-- 背景遮罩 -->
      <div class="overlay-backdrop" @click="emit('close')"></div>
      
      <!-- 🎮 主面板 -->
      <div class="analyzer-panel glass-panel">
        <!-- 扫描线动效 -->
        <div class="scan-line"></div>
        
        <!-- 📌 头部 -->
        <div class="panel-header">
          <div class="header-left">
            <div class="header-icon">
              <Zap class="w-5 h-5" />
            </div>
            <div>
              <h2 class="title-happy">战术目视 / Tactical Vision</h2>
              <p class="header-subtitle">SCREENSHOT ANALYSIS MODULE</p>
            </div>
          </div>
          
          <button class="close-btn" @click="emit('close')">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- 🎯 AI 预判条 -->
        <div class="ai-prediction">
          <AlertTriangle class="w-4 h-4" />
          <span class="prediction-label">情绪预判:</span>
          <span class="prediction-value">{{ aiPrediction.emotion }}</span>
          <span class="prediction-confidence">({{ aiPrediction.confidence }}%)</span>
          <span class="prediction-divider">|</span>
          <span class="prediction-suggestion">{{ aiPrediction.suggestion }}</span>
        </div>
        
        <!-- 📦 主内容区 -->
        <div class="panel-content">
          <!-- 🖼️ 左侧：图片预览 -->
          <div class="image-section">
            <div class="image-toolbar">
              <span class="toolbar-label">原始截图</span>
              <div class="toolbar-actions">
                <button @click="zoomOut" :disabled="imageScale <= 0.5">
                  <ZoomOut class="w-4 h-4" />
                </button>
                <span class="zoom-level">{{ Math.round(imageScale * 100) }}%</span>
                <button @click="zoomIn" :disabled="imageScale >= 2">
                  <ZoomIn class="w-4 h-4" />
                </button>
                <button @click="resetZoom">
                  <RotateCcw class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div class="image-container">
              <img 
                :src="imageUrl || '/placeholder-screenshot.png'" 
                :style="{ transform: `scale(${imageScale})` }"
                class="preview-image"
                alt="Screenshot"
              />
            </div>
          </div>
          
          <!-- 📝 右侧：OCR 气泡编辑 -->
          <div class="ocr-section">
            <div class="ocr-header">
              <h3 class="title-happy text-lg">情报解析 / Analysis</h3>
              <button class="add-bubble-btn" @click="addBubble">
                + 添加对白
              </button>
            </div>
            
            <ScrollArea class="ocr-list">
              <TransitionGroup name="bubble-list" tag="div" class="bubbles-container">
                <div 
                  v-for="(bubble, index) in bubbles" 
                  :key="bubble.id"
                  class="ocr-bubble"
                  :class="{ 'is-me': bubble.isMe }"
                >
                  <!-- 角色头像（可点击切换） -->
                  <button 
                    class="role-avatar"
                    :class="bubble.isMe ? 'avatar-me' : 'avatar-npc'"
                    @click="toggleRole(index)"
                    :title="bubble.isMe ? '主角 (点击切换)' : 'NPC (点击切换)'"
                  >
                    <User v-if="bubble.isMe" class="w-4 h-4" />
                    <Bot v-else class="w-4 h-4" />
                  </button>
                  
                  <!-- 文本输入 -->
                  <input 
                    v-model="bubble.text"
                    class="bubble-input"
                    placeholder="输入对白..."
                  />
                  
                  <!-- 置信度指示 -->
                  <span 
                    v-if="bubble.confidence < 100"
                    class="confidence-badge"
                    :class="{ 'low-confidence': bubble.confidence < 80 }"
                  >
                    {{ Math.round(bubble.confidence) }}%
                  </span>
                  
                  <!-- 删除按钮 -->
                  <button class="remove-btn" @click="removeBubble(index)">
                    <X class="w-3 h-3" />
                  </button>
                </div>
              </TransitionGroup>
              
              <!-- 空状态 -->
              <div v-if="bubbles.length === 0" class="empty-state">
                <p>暂无识别到的对白</p>
                <button @click="addBubble">添加第一条</button>
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <!-- 🚀 底部操作栏 -->
        <div class="panel-footer">
          <div class="footer-info">
            <span class="info-item">{{ bubbles.length }} 条对白</span>
            <span class="info-divider">•</span>
            <span class="info-item">{{ bubbles.filter(b => b.isMe).length }} 条主角内心</span>
          </div>
          
          <div class="footer-actions">
            <Button variant="outline" @click="emit('close')">
              取消
            </Button>
            <Button 
              class="execute-btn"
              :disabled="!canExecute"
              @click="executeStrategy"
            >
              <Zap class="w-4 h-4 mr-2" />
              开始战术推演
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.analyzer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
}

/* 🎮 主面板 */
.analyzer-panel {
  position: relative;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: rgba(10, 10, 15, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 40px var(--theme-glow);
}

/* 扫描线 */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--theme-accent), transparent);
  animation: scan-down 4s linear infinite;
  z-index: 10;
  pointer-events: none;
}

@keyframes scan-down {
  0% { top: 0; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* 📌 头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--theme-accent), var(--theme-accent-secondary));
  border-radius: 10px;
  color: white;
}

.header-left h2 {
  font-size: 1.125rem;
  color: var(--theme-text);
}

.header-subtitle {
  font-size: 0.625rem;
  color: var(--theme-text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.close-btn {
  padding: 0.5rem;
  color: var(--theme-text-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--theme-text);
}

/* 🎯 AI 预判条 */
.ai-prediction {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(251, 191, 36, 0.1);
  border-bottom: 1px solid rgba(251, 191, 36, 0.2);
  font-size: 0.75rem;
  color: #fbbf24;
}

.prediction-label {
  font-weight: 500;
}

.prediction-value {
  font-weight: 700;
  color: #fcd34d;
}

.prediction-confidence {
  opacity: 0.7;
}

.prediction-divider {
  opacity: 0.3;
  margin: 0 0.25rem;
}

.prediction-suggestion {
  color: var(--theme-text-secondary);
}

/* 📦 主内容区 */
.panel-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 🖼️ 图片区 */
.image-section {
  width: 50%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.image-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.toolbar-label {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-actions button {
  padding: 0.375rem;
  color: var(--theme-text-secondary);
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.toolbar-actions button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--theme-text);
}

.toolbar-actions button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-level {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--theme-text-muted);
  min-width: 3rem;
  text-align: center;
}

.image-container {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}

/* 📝 OCR 区 */
.ocr-section {
  width: 50%;
  display: flex;
  flex-direction: column;
}

.ocr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.add-bubble-btn {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  color: var(--theme-accent);
  border: 1px solid var(--theme-accent);
  border-radius: 1rem;
  transition: all 0.2s;
}

.add-bubble-btn:hover {
  background: var(--theme-accent);
  color: white;
}

.ocr-list {
  flex: 1;
  overflow-y: auto;
}

.bubbles-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

/* OCR 气泡 */
.ocr-bubble {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.ocr-bubble:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ocr-bubble.is-me {
  border-color: rgba(34, 211, 238, 0.2);
  background: rgba(34, 211, 238, 0.05);
}

.role-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.2s;
}

.avatar-npc {
  background: rgba(168, 85, 247, 0.2);
  color: #a78bfa;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.avatar-me {
  background: rgba(34, 211, 238, 0.2);
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.3);
}

.role-avatar:hover {
  transform: scale(1.1);
}

.bubble-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--theme-text);
  font-size: 0.875rem;
  outline: none;
}

.bubble-input::placeholder {
  color: var(--theme-text-muted);
}

.confidence-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.confidence-badge.low-confidence {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.remove-btn {
  padding: 0.25rem;
  color: var(--theme-text-muted);
  border-radius: 0.25rem;
  opacity: 0;
  transition: all 0.2s;
}

.ocr-bubble:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--theme-text-muted);
}

.empty-state button {
  color: var(--theme-accent);
}

/* 🚀 底部 */
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--theme-text-muted);
}

.footer-divider {
  opacity: 0.3;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.execute-btn {
  background: linear-gradient(135deg, var(--theme-accent), var(--theme-accent-secondary));
  border: none;
  color: white;
  font-weight: 600;
  padding: 0.625rem 1.25rem;
}

.execute-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 气泡列表动画 */
.bubble-list-enter-active,
.bubble-list-leave-active {
  transition: all 0.3s ease;
}

.bubble-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.bubble-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
