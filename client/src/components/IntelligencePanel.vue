<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  X, Zap, User, Bot, RotateCcw, ZoomIn, ZoomOut, 
  AlertTriangle, Crosshair, Shield, Target, ChevronRight,
  Edit3, Trash2, Plus, Scan, Radio
} from 'lucide-vue-next';
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue';
import Button from '@/components/ui/button/Button.vue';

/**
 * 👁️ v10.0 情报解析面板 - Tactical Intelligence Panel
 * 
 * 完整的截图战术流：
 * 1. 展示截图预览（带扫描线特效）
 * 2. 显示 AI 解析结果（可编辑）
 * 3. 用户确认/修正后执行战术
 */

interface VisionBubble {
  id: string;
  text: string;
  isMe: boolean;
  confidence: number;
}

interface VisionIntelligence {
  summary: string;
  bubbles: VisionBubble[];
  emotion_detected: string;
  emotion_score: number;
  context_hint: string;
  tactical_suggestion: string;
  confidence: number;
}

const props = defineProps<{
  /** 截图的 Base64 或 URL */
  imageUrl: string;
  /** AI 返回的情报分析（可选，用于预填充） */
  intelligence?: VisionIntelligence;
  /** 是否正在分析中 */
  isAnalyzing?: boolean;
  /** 分析耗时 */
  analysisTimeMs?: number;
}>();

const emit = defineEmits<{
  close: [];
  execute: [data: { summary: string; bubbles: VisionBubble[]; emotionScore: number }];
  reanalyze: [];
}>();

// 🎯 可编辑的情报数据
const editableSummary = ref('');
const editableBubbles = ref<VisionBubble[]>([]);
const editableEmotionScore = ref(0);

// 📊 UI 状态
const imageScale = ref(1);
const isScanning = ref(false);
const activeTab = ref<'bubbles' | 'analysis'>('bubbles');

// 🔍 图片缩放
const zoomIn = () => { imageScale.value = Math.min(2, imageScale.value + 0.25); };
const zoomOut = () => { imageScale.value = Math.max(0.5, imageScale.value - 0.25); };
const resetZoom = () => { imageScale.value = 1; };

// 🔄 同步 AI 结果到可编辑状态
watch(() => props.intelligence, (intel) => {
  if (intel) {
    editableSummary.value = intel.summary;
    editableBubbles.value = intel.bubbles.map((b, i) => ({
      id: `bubble-${i}-${Date.now()}`,
      text: b.text,
      isMe: b.isMe,
      confidence: b.confidence
    }));
    editableEmotionScore.value = intel.emotion_score;
    isScanning.value = false;
  }
}, { immediate: true });

// 🎯 切换说话人
const toggleRole = (index: number) => {
  editableBubbles.value[index].isMe = !editableBubbles.value[index].isMe;
};

// 🗑️ 删除气泡
const removeBubble = (index: number) => {
  editableBubbles.value.splice(index, 1);
};

// ✏️ 添加气泡
const addBubble = () => {
  editableBubbles.value.push({
    id: `bubble-new-${Date.now()}`,
    text: '',
    isMe: false,
    confidence: 1.0
  });
};

// 🚀 执行战术
const executeStrategy = () => {
  emit('execute', {
    summary: editableSummary.value,
    bubbles: editableBubbles.value,
    emotionScore: editableEmotionScore.value
  });
};

// 📊 情绪评分映射
const emotionLabels: Record<number, { text: string; color: string; icon: string }> = {
  '-3': { text: '暴怒', color: 'text-red-500', icon: '💢' },
  '-2': { text: '生气', color: 'text-orange-500', icon: '😤' },
  '-1': { text: '不悦', color: 'text-yellow-500', icon: '😒' },
  '0': { text: '中性', color: 'text-zinc-400', icon: '😐' },
  '1': { text: '好感', color: 'text-green-400', icon: '😊' },
  '2': { text: '开心', color: 'text-pink-400', icon: '😍' },
  '3': { text: '心动', color: 'text-rose-500', icon: '💕' },
};

const currentEmotion = computed(() => emotionLabels[editableEmotionScore.value.toString()] || emotionLabels['0']);

// 🎬 扫描动画
onMounted(() => {
  if (props.isAnalyzing) {
    isScanning.value = true;
  }
});

watch(() => props.isAnalyzing, (analyzing) => {
  isScanning.value = analyzing || false;
});

// 计算是否可以执行
const canExecute = computed(() => {
  return editableSummary.value.trim() || editableBubbles.value.some(b => b.text.trim());
});

// 置信度颜色
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'text-emerald-400';
  if (confidence >= 0.7) return 'text-yellow-400';
  return 'text-orange-400';
};
</script>

<template>
  <Teleport to="body">
    <div class="intel-overlay">
      <!-- 背景遮罩 -->
      <div class="overlay-backdrop" @click="emit('close')"></div>
      
      <!-- 🎮 主面板 -->
      <div class="intel-panel glass-panel">
        <!-- 扫描线动效 -->
        <div class="scan-line" :class="{ 'scanning': isScanning }"></div>
        
        <!-- 📌 头部 -->
        <div class="panel-header">
          <div class="header-left">
            <div class="header-icon">
              <Crosshair class="w-5 h-5" />
            </div>
            <div>
              <h2 class="title-happy text-lg">情报解析 / Intelligence Analysis</h2>
              <p class="header-subtitle">TACTICAL VISION MODULE v10.0</p>
            </div>
          </div>
          
          <div class="header-actions">
            <!-- 重新分析按钮 -->
            <button 
              class="action-btn"
              :disabled="isScanning"
              @click="emit('reanalyze')"
              title="重新分析"
            >
              <Scan class="w-4 h-4" :class="{ 'animate-spin': isScanning }" />
            </button>
            
            <button class="close-btn" @click="emit('close')">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <!-- 🎯 状态条 -->
        <div class="status-bar" :class="{ 'analyzing': isScanning }">
          <div class="status-indicator">
            <Radio class="w-3 h-3" :class="isScanning ? 'animate-pulse text-cyan-400' : 'text-emerald-400'" />
            <span>{{ isScanning ? 'ANALYZING...' : 'ANALYSIS COMPLETE' }}</span>
          </div>
          
          <div v-if="!isScanning && props.analysisTimeMs" class="status-time">
            处理耗时: {{ props.analysisTimeMs }}ms
          </div>
          
          <div v-if="props.intelligence" class="status-confidence">
            置信度: {{ Math.round(props.intelligence.confidence * 100) }}%
          </div>
        </div>
        
        <!-- 📦 主内容区 -->
        <div class="panel-content">
          <!-- 🖼️ 左侧：截图预览 -->
          <div class="image-section">
            <div class="image-toolbar">
              <span class="toolbar-label">
                <Target class="w-3 h-3" />
                原始情报
              </span>
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
            
            <div class="image-container" :class="{ 'scanning': isScanning }">
              <!-- 网格滤镜 -->
              <div class="grid-overlay"></div>
              
              <!-- 扫描特效 -->
              <div v-if="isScanning" class="scan-effect"></div>
              
              <img 
                :src="props.imageUrl || '/placeholder-screenshot.png'" 
                :style="{ transform: `scale(${imageScale})` }"
                class="preview-image"
                alt="Screenshot"
              />
            </div>
          </div>
          
          <!-- 📝 右侧：情报编辑 -->
          <div class="intel-section">
            <!-- Tab 切换 -->
            <div class="intel-tabs">
              <button 
                class="tab-btn"
                :class="{ active: activeTab === 'bubbles' }"
                @click="activeTab = 'bubbles'"
              >
                <User class="w-4 h-4" />
                对话气泡
              </button>
              <button 
                class="tab-btn"
                :class="{ active: activeTab === 'analysis' }"
                @click="activeTab = 'analysis'"
              >
                <Shield class="w-4 h-4" />
                战术分析
              </button>
            </div>
            
            <!-- 对话气泡 Tab -->
            <div v-show="activeTab === 'bubbles'" class="tab-content">
              <div class="bubbles-header">
                <span class="bubbles-count">{{ editableBubbles.length }} 条对话</span>
                <button class="add-bubble-btn" @click="addBubble">
                  <Plus class="w-4 h-4" />
                  添加
                </button>
              </div>
              
              <ScrollArea class="bubbles-list">
                <TransitionGroup name="bubble-list" tag="div" class="bubbles-container">
                  <div 
                    v-for="(bubble, index) in editableBubbles" 
                    :key="bubble.id"
                    class="intel-bubble"
                    :class="{ 'is-me': bubble.isMe }"
                  >
                    <!-- 角色头像 -->
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
                      placeholder="输入对话内容..."
                    />
                    
                    <!-- 置信度 -->
                    <span 
                      v-if="bubble.confidence < 1"
                      class="confidence-badge"
                      :class="getConfidenceColor(bubble.confidence)"
                    >
                      {{ Math.round(bubble.confidence * 100) }}%
                    </span>
                    
                    <!-- 删除按钮 -->
                    <button class="remove-btn" @click="removeBubble(index)">
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </TransitionGroup>
                
                <!-- 空状态 -->
                <div v-if="editableBubbles.length === 0" class="empty-state">
                  <AlertTriangle class="w-8 h-8 text-yellow-500/50" />
                  <p>未识别到对话内容</p>
                  <button @click="addBubble" class="text-[var(--theme-accent)]">
                    手动添加对话
                  </button>
                </div>
              </ScrollArea>
            </div>
            
            <!-- 战术分析 Tab -->
            <div v-show="activeTab === 'analysis'" class="tab-content">
              <!-- 情报摘要 -->
              <div class="analysis-group">
                <label class="group-label">
                  <Edit3 class="w-4 h-4" />
                  情报摘要
                </label>
                <textarea 
                  v-model="editableSummary"
                  class="summary-input"
                  placeholder="一句话总结当前局势..."
                  rows="3"
                ></textarea>
              </div>
              
              <!-- 情绪评分 -->
              <div class="analysis-group">
                <label class="group-label">
                  情绪评分
                  <span class="ml-2" :class="currentEmotion.color">
                    {{ currentEmotion.icon }} {{ currentEmotion.text }}
                  </span>
                </label>
                <div class="emotion-slider">
                  <span class="slider-label text-red-400">💢 -3</span>
                  <input 
                    type="range" 
                    v-model.number="editableEmotionScore"
                    min="-3" 
                    max="3" 
                    step="1"
                    class="slider-input"
                  />
                  <span class="slider-label text-rose-400">+3 💕</span>
                </div>
              </div>
              
              <!-- AI 分析提示 -->
              <div v-if="props.intelligence" class="ai-hints">
                <div v-if="props.intelligence.context_hint" class="hint-item">
                  <AlertTriangle class="w-4 h-4 text-yellow-400" />
                  <span>{{ props.intelligence.context_hint }}</span>
                </div>
                <div v-if="props.intelligence.tactical_suggestion" class="hint-item suggestion">
                  <Zap class="w-4 h-4 text-cyan-400" />
                  <span>{{ props.intelligence.tactical_suggestion }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 🚀 底部操作栏 -->
        <div class="panel-footer">
          <div class="footer-info">
            <span v-if="props.intelligence?.emotion_detected" class="info-tag">
              检测情绪: {{ props.intelligence.emotion_detected }}
            </span>
          </div>
          
          <div class="footer-actions">
            <Button variant="outline" @click="emit('close')">
              取消
            </Button>
            <Button 
              class="execute-btn"
              :disabled="!canExecute || isScanning"
              @click="executeStrategy"
            >
              <Zap class="w-4 h-4 mr-2" />
              执行战术
              <ChevronRight class="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.intel-overlay {
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
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
}

/* 🎮 主面板 */
.intel-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: rgba(10, 10, 15, 0.95);
  border: 1px solid rgba(var(--theme-accent-rgb, 34, 211, 238), 0.3);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(var(--theme-accent-rgb, 34, 211, 238), 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 扫描线 */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--theme-accent, #22d3ee), transparent);
  opacity: 0;
  z-index: 10;
  pointer-events: none;
}

.scan-line.scanning {
  opacity: 1;
  animation: scan-down 2s linear infinite;
}

@keyframes scan-down {
  0% { top: 0; }
  100% { top: 100%; }
}

/* 📌 头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--theme-accent, #22d3ee), var(--theme-accent-secondary, #818cf8));
  border-radius: 12px;
  color: white;
  box-shadow: 0 0 20px rgba(var(--theme-accent-rgb, 34, 211, 238), 0.4);
}

.header-subtitle {
  font-size: 0.625rem;
  color: var(--theme-text-muted);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  color: var(--theme-text-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--theme-accent);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn {
  padding: 0.5rem;
  color: var(--theme-text-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* 🎯 状态条 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.625rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
}

.status-bar.analyzing {
  background: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.1);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--theme-text-secondary);
}

.status-time,
.status-confidence {
  color: var(--theme-text-muted);
}

/* 📦 主内容区 */
.panel-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 🖼️ 图片区 */
.image-section {
  width: 45%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.image-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.toolbar-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
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
  position: relative;
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

/* 网格滤镜 */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(var(--theme-accent-rgb, 34, 211, 238), 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--theme-accent-rgb, 34, 211, 238), 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 1;
}

/* 扫描特效 */
.scan-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(var(--theme-accent-rgb, 34, 211, 238), 0.1) 50%,
    transparent 100%
  );
  animation: scan-sweep 2s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes scan-sweep {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
  position: relative;
  z-index: 0;
}

/* 📝 情报区 */
.intel-section {
  width: 55%;
  display: flex;
  flex-direction: column;
}

/* Tab 切换 */
.intel-tabs {
  display: flex;
  gap: 0;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  background: transparent;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--theme-text);
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: var(--theme-accent);
  border-bottom-color: var(--theme-accent);
  background: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.05);
}

/* Tab 内容 */
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 气泡列表 */
.bubbles-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.bubbles-count {
  font-size: 0.75rem;
  color: var(--theme-text-muted);
}

.add-bubble-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  color: var(--theme-accent);
  border: 1px solid currentColor;
  border-radius: 1rem;
  transition: all 0.2s;
}

.add-bubble-btn:hover {
  background: var(--theme-accent);
  color: white;
}

.bubbles-list {
  flex: 1;
  overflow-y: auto;
}

.bubbles-container {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1rem;
}

/* 情报气泡 */
.intel-bubble {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.intel-bubble:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

.intel-bubble.is-me {
  border-color: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.25);
  background: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.05);
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
  cursor: pointer;
}

.avatar-npc {
  background: rgba(168, 85, 247, 0.2);
  color: #a78bfa;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.avatar-me {
  background: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.2);
  color: var(--theme-accent);
  border: 1px solid rgba(var(--theme-accent-rgb, 34, 211, 238), 0.3);
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
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.remove-btn {
  padding: 0.25rem;
  color: var(--theme-text-muted);
  border-radius: 0.25rem;
  opacity: 0;
  transition: all 0.2s;
}

.intel-bubble:hover .remove-btn {
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
  gap: 0.75rem;
  padding: 3rem;
  color: var(--theme-text-muted);
  text-align: center;
}

/* 战术分析区 */
.analysis-group {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.group-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  margin-bottom: 0.75rem;
}

.summary-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--theme-text);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  resize: none;
  outline: none;
  transition: all 0.2s;
}

.summary-input:focus {
  border-color: var(--theme-accent);
  box-shadow: 0 0 20px rgba(var(--theme-accent-rgb, 34, 211, 238), 0.15);
}

/* 情绪滑块 */
.emotion-slider {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider-label {
  font-size: 0.75rem;
  white-space: nowrap;
}

.slider-input {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: linear-gradient(90deg, #ef4444, #fbbf24, #22c55e, #ec4899);
  border-radius: 3px;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* AI 提示 */
.ai-hints {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hint-item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 0.5rem;
}

.hint-item.suggestion {
  background: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.08);
  border-color: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.2);
}

/* 🚀 底部 */
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-tag {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  color: var(--theme-text-secondary);
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.execute-btn {
  background: linear-gradient(135deg, var(--theme-accent, #22d3ee), var(--theme-accent-secondary, #818cf8));
  border: none;
  color: white;
  font-weight: 600;
  padding: 0.625rem 1.5rem;
  box-shadow: 0 0 20px rgba(var(--theme-accent-rgb, 34, 211, 238), 0.3);
}

.execute-btn:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(var(--theme-accent-rgb, 34, 211, 238), 0.5);
  transform: translateY(-1px);
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
