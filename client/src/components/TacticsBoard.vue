<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { 
  Crosshair, Brain, Target, Zap, 
  ChevronDown, AlertTriangle, Heart, Snowflake,
  Flame, Shield, Sparkles, Coffee
} from "lucide-vue-next";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";

/**
 * 🎯 TacticsBoard v8.0 - 战术指挥面板
 * 位于输入框与结果卡片之间的中间层
 * 显示 AI 态势分析结果，允许用户修改后执行战术
 */

interface SituationAnalysis {
  summary: string;
  emotion_score: number;
  intent: string;
  strategy: string;
  confidence: number;
  burst_detected: boolean;
  pressure_level: number;
}

interface TacticsBoardProps {
  analysis: SituationAnalysis | null;
  rawInput: string;
  isAnalyzing?: boolean;
  isExecuting?: boolean;
}

const props = withDefaults(defineProps<TacticsBoardProps>(), {
  analysis: null,
  rawInput: "",
  isAnalyzing: false,
  isExecuting: false,
});

const emit = defineEmits<{
  (e: "execute", analysis: SituationAnalysis): void;
  (e: "cancel"): void;
  (e: "update:analysis", analysis: SituationAnalysis): void;
}>();

// 本地可编辑的分析数据
const localAnalysis = ref<SituationAnalysis | null>(null);
const isStrategyOpen = ref(false);

// 同步 props 到本地状态
watch(
  () => props.analysis,
  (newVal) => {
    if (newVal) {
      localAnalysis.value = { ...newVal };
    }
  },
  { immediate: true }
);

// 策略选项
const strategyOptions = [
  { value: "OFFENSIVE_FLIRT", label: "进攻调情", icon: Flame, color: "text-red-400" },
  { value: "DEFENSIVE_FLIRT", label: "防守调情", icon: Shield, color: "text-pink-400" },
  { value: "COMFORT", label: "安抚", icon: Heart, color: "text-rose-400" },
  { value: "FREEZE", label: "冷处理", icon: Snowflake, color: "text-cyan-400" },
  { value: "PUSH_PULL", label: "推拉战术", icon: Target, color: "text-purple-400" },
  { value: "DIRECT", label: "直球", icon: Zap, color: "text-yellow-400" },
  { value: "PLAYFUL", label: "俏皮", icon: Sparkles, color: "text-amber-400" },
  { value: "IGNORE", label: "忽略", icon: Coffee, color: "text-zinc-400" },
];

// 意图映射
const intentLabels: Record<string, string> = {
  TESTING_BOUNDARIES: "试探边界",
  SEEKING_ATTENTION: "求关注",
  EXPRESSING_AFFECTION: "表达好感",
  VENTING_EMOTION: "发泄情绪",
  CASUAL_CHAT: "闲聊",
  FLIRTING: "调情",
  COMPLAINING: "抱怨",
  JEALOUS: "吃醋",
  COLD_WAR: "冷战",
  UNKNOWN: "未知",
};

// 当前策略
const currentStrategy = computed(() => {
  return strategyOptions.find(s => s.value === localAnalysis.value?.strategy) || strategyOptions[2];
});

// 情绪颜色映射
const emotionColor = computed(() => {
  const score = localAnalysis.value?.emotion_score ?? 0;
  if (score >= 2) return "text-pink-400";
  if (score >= 1) return "text-rose-300";
  if (score <= -2) return "text-red-500";
  if (score <= -1) return "text-orange-400";
  return "text-zinc-400";
});

// 置信度样式
const confidenceStyle = computed(() => {
  const conf = localAnalysis.value?.confidence ?? 0;
  return {
    width: `${conf * 100}%`,
    background: conf > 0.7 ? "var(--accent-color)" : conf > 0.4 ? "#f59e0b" : "#ef4444"
  };
});

// 更新策略
function selectStrategy(strategy: string) {
  if (localAnalysis.value) {
    localAnalysis.value.strategy = strategy;
    emit("update:analysis", localAnalysis.value);
  }
  isStrategyOpen.value = false;
}

// 更新情绪分数
function updateEmotionScore(delta: number) {
  if (localAnalysis.value) {
    const newScore = Math.max(-3, Math.min(3, localAnalysis.value.emotion_score + delta));
    localAnalysis.value.emotion_score = newScore;
    emit("update:analysis", localAnalysis.value);
  }
}

// 更新摘要
function updateSummary(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  if (localAnalysis.value) {
    localAnalysis.value.summary = target.value;
    emit("update:analysis", localAnalysis.value);
  }
}

// 执行战术
function executeTactics() {
  if (localAnalysis.value) {
    emit("execute", localAnalysis.value);
  }
}
</script>

<template>
  <Transition name="tactics-slide">
    <div 
      v-if="analysis || isAnalyzing"
      class="tactics-board tech-corner"
    >
      <!-- 🎯 标题栏 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="icon-wrapper">
            <Crosshair class="h-4 w-4 text-[var(--accent-color)]" />
          </div>
          <span class="text-sm font-mono text-[var(--accent-color)] tracking-wider">
            TACTICAL_ANALYSIS
          </span>
          <span class="deco-text">///</span>
          <span v-if="analysis?.burst_detected" class="burst-badge">
            <AlertTriangle class="h-3 w-3" />
            BURST_MODE
          </span>
        </div>
        
        <!-- 置信度指示器 -->
        <div v-if="analysis" class="flex items-center gap-2">
          <span class="deco-text text-xs">CONF:</span>
          <div class="confidence-bar">
            <div class="confidence-fill" :style="confidenceStyle"></div>
          </div>
          <span class="deco-text text-xs">{{ ((analysis.confidence || 0) * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <!-- ⏳ 分析中状态 -->
      <div v-if="isAnalyzing" class="analyzing-state">
        <div class="analyzing-spinner"></div>
        <span class="analyzing-text">正在进行心理侧写...</span>
      </div>

      <!-- 📊 分析结果面板 -->
      <div v-else-if="localAnalysis" class="analysis-content">
        <!-- 左列：局势总结 + 意图 -->
        <div class="analysis-left">
          <!-- 局势总结（可编辑） -->
          <div class="summary-section">
            <label class="section-label">
              <Brain class="h-3 w-3" />
              局势研判
            </label>
            <textarea
              :value="localAnalysis.summary"
              @input="updateSummary"
              class="summary-input"
              rows="2"
              placeholder="AI 对当前局势的分析..."
            />
          </div>

          <!-- 意图标签 -->
          <div class="intent-section">
            <span class="section-label">
              <Target class="h-3 w-3" />
              推测意图
            </span>
            <span class="intent-badge">
              {{ intentLabels[localAnalysis.intent] || localAnalysis.intent }}
            </span>
            <span v-if="localAnalysis.pressure_level > 0" class="pressure-badge">
              压迫感 Lv.{{ localAnalysis.pressure_level }}
            </span>
          </div>
        </div>

        <!-- 右列：情绪 + 策略 -->
        <div class="analysis-right">
          <!-- 情绪仪表 -->
          <div class="emotion-section">
            <label class="section-label">情绪指数</label>
            <div class="emotion-gauge">
              <button 
                class="emotion-btn" 
                @click="updateEmotionScore(-1)"
                :disabled="localAnalysis.emotion_score <= -3"
              >−</button>
              <div class="emotion-display" :class="emotionColor">
                <span class="emotion-value">{{ localAnalysis.emotion_score > 0 ? '+' : '' }}{{ localAnalysis.emotion_score }}</span>
                <span class="emotion-label">
                  {{ localAnalysis.emotion_score >= 2 ? '心动' : 
                     localAnalysis.emotion_score >= 1 ? '好感' :
                     localAnalysis.emotion_score <= -2 ? '愤怒' :
                     localAnalysis.emotion_score <= -1 ? '不满' : '中性' }}
                </span>
              </div>
              <button 
                class="emotion-btn" 
                @click="updateEmotionScore(1)"
                :disabled="localAnalysis.emotion_score >= 3"
              >+</button>
            </div>
          </div>

          <!-- 策略选择器 -->
          <div class="strategy-section">
            <label class="section-label">应对策略</label>
            <div class="strategy-dropdown" @click="isStrategyOpen = !isStrategyOpen">
              <component 
                :is="currentStrategy.icon" 
                class="h-4 w-4" 
                :class="currentStrategy.color"
              />
              <span class="strategy-label">{{ currentStrategy.label }}</span>
              <ChevronDown 
                class="h-4 w-4 transition-transform" 
                :class="{ 'rotate-180': isStrategyOpen }"
              />
            </div>
            
            <!-- 下拉菜单 -->
            <Transition name="dropdown">
              <div v-if="isStrategyOpen" class="strategy-menu">
                <button
                  v-for="opt in strategyOptions"
                  :key="opt.value"
                  class="strategy-option"
                  :class="{ active: opt.value === localAnalysis.strategy }"
                  @click="selectStrategy(opt.value)"
                >
                  <component :is="opt.icon" class="h-4 w-4" :class="opt.color" />
                  <span>{{ opt.label }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- ⚔️ 执行按钮 -->
      <div v-if="localAnalysis" class="execute-section">
        <button 
          class="cancel-btn"
          @click="emit('cancel')"
          :disabled="isExecuting"
        >
          取消
        </button>
        <button 
          class="execute-btn"
          @click="executeTactics"
          :disabled="isExecuting"
        >
          <Zap class="h-4 w-4" :class="{ 'animate-pulse': isExecuting }" />
          <span>{{ isExecuting ? '执行中...' : '执行战术' }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tactics-board {
  position: relative;
  padding: 1rem 1.25rem;
  background: var(--input-panel-bg);
  border: 1px solid var(--accent-color);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  margin-bottom: 1rem;
  
  /* 战术面板特有光效 */
  box-shadow: 
    0 0 20px rgba(var(--accent-rgb), 0.15),
    inset 0 0 30px rgba(0, 0, 0, 0.3);
}

/* 图标容器 */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(var(--accent-rgb), 0.15);
  border: 1px solid rgba(var(--accent-rgb), 0.3);
}

/* 连发模式标识 */
.burst-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 10px;
  font-family: var(--font-mono);
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

/* 置信度条 */
.confidence-bar {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 分析中状态 */
.analyzing-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 2rem;
}

.analyzing-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(var(--accent-rgb), 0.2);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.analyzing-text {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--accent-color);
  animation: blink 1s step-end infinite;
}

/* 分析内容布局 */
.analysis-content {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 1.5rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--accent-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

/* 局势总结 */
.summary-section {
  margin-bottom: 12px;
}

.summary-input {
  width: 100%;
  padding: 10px 12px;
  font-family: var(--font-primary);
  font-size: 14px;
  line-height: 1.6;
  color: var(--bubble-text);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  border-radius: 8px;
  resize: none;
  transition: all 0.2s ease;
}

.summary-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.1);
}

/* 意图标签 */
.intent-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.intent-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--accent-color);
  background: rgba(var(--accent-rgb), 0.15);
  border: 1px solid rgba(var(--accent-rgb), 0.3);
  border-radius: 4px;
}

.pressure-badge {
  padding: 4px 8px;
  font-size: 10px;
  font-family: var(--font-mono);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
}

/* 情绪仪表 */
.emotion-section {
  margin-bottom: 16px;
}

.emotion-gauge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emotion-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: var(--bubble-text);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emotion-btn:hover:not(:disabled) {
  background: rgba(var(--accent-rgb), 0.2);
  border-color: var(--accent-color);
}

.emotion-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.emotion-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.emotion-value {
  font-size: 24px;
  font-weight: bold;
  font-family: var(--font-mono);
  line-height: 1;
}

.emotion-label {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
}

/* 策略选择器 */
.strategy-section {
  position: relative;
}

.strategy-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.strategy-dropdown:hover {
  border-color: var(--accent-color);
}

.strategy-label {
  flex: 1;
  font-size: 14px;
  color: var(--bubble-text);
}

.strategy-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  padding: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.strategy-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--bubble-text);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.strategy-option:hover {
  background: rgba(var(--accent-rgb), 0.15);
}

.strategy-option.active {
  background: rgba(var(--accent-rgb), 0.25);
  color: var(--accent-color);
}

/* 执行按钮区 */
.execute-section {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(var(--accent-rgb), 0.15);
}

.cancel-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-family: var(--font-mono);
  color: var(--bubble-text);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.execute-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(var(--accent-rgb), 0.4);
}

.execute-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.5);
}

.execute-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 动画 */
.tactics-slide-enter-active,
.tactics-slide-leave-active {
  transition: all 0.3s ease;
}

.tactics-slide-enter-from,
.tactics-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes blink {
  50% { opacity: 0.5; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
