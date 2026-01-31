<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Camera, Crop, Sparkles, Upload, Crosshair, Scan, 
  Image, History, AlertTriangle, Zap, ArrowRight
} from 'lucide-vue-next';
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/card/Card.vue';
import CardHeader from '@/components/ui/card/CardHeader.vue';
import CardTitle from '@/components/ui/card/CardTitle.vue';
import CardDescription from '@/components/ui/card/CardDescription.vue';
import CardContent from '@/components/ui/card/CardContent.vue';
import IntelligencePanel from '@/components/IntelligencePanel.vue';
import { useGameStore } from '@/stores/useGameStore';

/**
 * 🎯 v10.0 战术捕获面板
 * 截图 → 情报分析 → 战术修正 → 决策执行
 */

const gameStore = useGameStore();

// 🎮 UI 状态
const isCapturing = ref(false);
const isAnalyzing = ref(false);
const showIntelPanel = ref(false);
const capturedImage = ref('');
const analysisResult = ref<any>(null);
const analysisTime = ref(0);
const captureHistory = ref<Array<{ id: string; thumbnail: string; timestamp: Date }>>([]);

// 流程步骤
const steps = [
  { icon: Camera, text: '点击捕获按钮，立即进入截图模式', status: 'ready' },
  { icon: Scan, text: 'AI 自动识别对话气泡与情绪', status: 'pending' },
  { icon: Crosshair, text: '确认/修正情报后执行战术', status: 'pending' },
];

/**
 * 🖼️ 开始截图（Electron desktopCapturer）
 */
const startCapture = async () => {
  isCapturing.value = true;
  
  try {
    // 检查 Electron API
    if ((window as any).electronAPI?.captureScreen) {
      const result = await (window as any).electronAPI.captureScreen();
      if (result.success && result.dataUrl) {
        capturedImage.value = result.dataUrl;
        await analyzeScreenshot(result.dataUrl);
      }
    } else {
      // 非 Electron 环境：使用文件上传
      console.log('[Capture] 非 Electron 环境，切换到文件上传');
      triggerFileUpload();
    }
  } catch (error) {
    console.error('[Capture] 截屏失败:', error);
  } finally {
    isCapturing.value = false;
  }
};

/**
 * 📁 文件上传（降级方案）
 */
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target?.result as string;
    capturedImage.value = dataUrl;
    await analyzeScreenshot(dataUrl);
  };
  reader.readAsDataURL(file);
  
  // 重置 input
  target.value = '';
};

/**
 * 🔍 调用后端 Vision API 分析截图
 */
const analyzeScreenshot = async (imageBase64: string) => {
  isAnalyzing.value = true;
  showIntelPanel.value = true;
  analysisResult.value = null;
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://127.0.0.1:8000/api/vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64.split(',')[1] || imageBase64,
        hint: ''
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.intelligence) {
      analysisResult.value = {
        ...data.intelligence,
        bubbles: data.intelligence.bubbles.map((b: any, i: number) => ({
          id: `b-${i}-${Date.now()}`,
          text: b.text,
          isMe: b.is_me,
          confidence: b.confidence
        }))
      };
      analysisTime.value = data.analysis_time_ms || (Date.now() - startTime);
      
      // 保存到历史
      captureHistory.value.unshift({
        id: `cap-${Date.now()}`,
        thumbnail: imageBase64,
        timestamp: new Date()
      });
      
      // 最多保留 10 条历史
      if (captureHistory.value.length > 10) {
        captureHistory.value = captureHistory.value.slice(0, 10);
      }
    } else {
      console.error('[Vision] 分析失败:', data);
    }
  } catch (error) {
    console.error('[Vision] API 调用失败:', error);
  } finally {
    isAnalyzing.value = false;
  }
};

/**
 * 🚀 执行战术（将情报转发到主面板）
 */
const executeStrategy = async (data: { summary: string; bubbles: any[]; emotionScore: number }) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/vision/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: data.summary,
        bubbles: data.bubbles.map(b => ({
          text: b.text,
          is_me: b.isMe,
          confidence: b.confidence
        })),
        emotion_score: data.emotionScore,
        history: []
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.options) {
      // 将结果发送到主 store
      gameStore.addAIResponse(result);
      showIntelPanel.value = false;
    }
  } catch (error) {
    console.error('[Execute] 战术执行失败:', error);
  }
};

/**
 * 🔄 重新分析
 */
const reanalyze = () => {
  if (capturedImage.value) {
    analyzeScreenshot(capturedImage.value);
  }
};

/**
 * 📜 从历史中加载
 */
const loadFromHistory = (item: { thumbnail: string }) => {
  capturedImage.value = item.thumbnail;
  analyzeScreenshot(item.thumbnail);
};

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <section class="space-y-6">
    <!-- 隐藏的文件上传 -->
    <input 
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileUpload"
    />
    
    <!-- 📌 头部 -->
    <header>
      <div class="flex items-center gap-2">
        <Crosshair class="w-5 h-5 text-cyan-400" />
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">TACTICAL CAPTURE</p>
      </div>
      <h1 class="mt-2 text-2xl font-semibold text-white">战术截图系统</h1>
      <p class="mt-2 text-sm text-zinc-400">一键截取对话框，AI 智能分析局势，精准制定回复策略。</p>
    </header>
    
    <!-- 🎯 主功能区 -->
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- 捕获控制卡片 -->
      <Card class="capture-card">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Camera class="h-4 w-4 text-cyan-400" />
            捕获控制
          </CardTitle>
          <CardDescription>截取游戏对话，启动情报分析。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 主截图按钮 -->
          <Button 
            class="capture-btn w-full h-14"
            :disabled="isCapturing || isAnalyzing"
            @click="startCapture"
          >
            <div class="btn-content">
              <Scan v-if="isCapturing" class="h-5 w-5 animate-pulse" />
              <Crosshair v-else class="h-5 w-5" />
              <span>{{ isCapturing ? '捕获中...' : '开始战术截图' }}</span>
            </div>
            <div class="btn-glow"></div>
          </Button>
          
          <!-- 次要操作 -->
          <div class="flex gap-2">
            <Button 
              variant="outline" 
              class="flex-1"
              @click="triggerFileUpload"
            >
              <Upload class="h-4 w-4" />
              上传图片
            </Button>
            <Button 
              variant="outline" 
              class="flex-1"
              :disabled="captureHistory.length === 0"
            >
              <History class="h-4 w-4" />
              历史记录
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <!-- 流程说明卡片 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Sparkles class="h-4 w-4 text-violet-400" />
            战术流程
          </CardTitle>
          <CardDescription>截图 → 分析 → 执行</CardDescription>
        </CardHeader>
        <CardContent>
          <ol class="space-y-3">
            <li 
              v-for="(step, index) in steps" 
              :key="index" 
              class="step-item"
              :class="{ 'active': index === 0 }"
            >
              <div class="step-icon">
                <component :is="step.icon" class="w-4 h-4" />
              </div>
              <span class="step-text">{{ step.text }}</span>
              <ArrowRight v-if="index < steps.length - 1" class="w-4 h-4 text-zinc-600 ml-auto" />
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
    
    <!-- 📜 最近捕获历史 -->
    <Card v-if="captureHistory.length > 0">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Image class="h-4 w-4 text-emerald-400" />
          最近捕获
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="history-grid">
          <button 
            v-for="item in captureHistory.slice(0, 6)" 
            :key="item.id"
            class="history-item"
            @click="loadFromHistory(item)"
          >
            <img :src="item.thumbnail" alt="历史截图" />
            <div class="history-overlay">
              <span>{{ formatTime(item.timestamp) }}</span>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
    
    <!-- 🔮 情报解析面板 -->
    <IntelligencePanel 
      v-if="showIntelPanel"
      :image-url="capturedImage"
      :intelligence="analysisResult"
      :is-analyzing="isAnalyzing"
      :analysis-time-ms="analysisTime"
      @close="showIntelPanel = false"
      @execute="executeStrategy"
      @reanalyze="reanalyze"
    />
  </section>
</template>

<style scoped>
/* 🎮 捕获卡片 */
.capture-card {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), transparent);
  border-color: rgba(6, 182, 212, 0.2);
}

/* 🔥 主按钮 */
.capture-btn {
  position: relative;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2));
  border: 1px solid rgba(6, 182, 212, 0.4);
  overflow: hidden;
  transition: all 0.3s;
}

.capture-btn:hover:not(:disabled) {
  border-color: rgba(6, 182, 212, 0.6);
  box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
}

.capture-btn:disabled {
  opacity: 0.6;
}

.btn-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(6, 182, 212, 0.2), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.capture-btn:hover .btn-glow {
  opacity: 1;
}

/* 📋 流程步骤 */
.step-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.step-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.step-item.active {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.25);
}

.step-item.active .step-icon {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
}

.step-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  color: var(--theme-text-secondary);
  flex-shrink: 0;
}

.step-text {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

/* 📜 历史网格 */
.history-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.75rem;
}

.history-item {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.history-item:hover {
  border-color: rgba(6, 182, 212, 0.4);
  transform: scale(1.05);
}

.history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0.375rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .history-overlay {
  opacity: 1;
}

.history-overlay span {
  font-size: 0.625rem;
  color: white;
}

@media (max-width: 768px) {
  .history-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
