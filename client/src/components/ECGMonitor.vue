<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Activity } from "lucide-vue-next";

/**
 * 💓 ECGMonitor v8.0 - 心电图情绪监视器
 * 纯 CSS + SVG 动画实现
 * 状态映射：
 * - idle: 平缓绿色波形
 * - analyzing: 快速黄色波形
 * - highEmotion: 剧烈红/粉色波形 + Glitch
 */

interface ECGMonitorProps {
  state?: "idle" | "analyzing" | "highEmotion";
  emotionScore?: number;  // -3 ~ +3
  label?: string;
}

const props = withDefaults(defineProps<ECGMonitorProps>(), {
  state: "idle",
  emotionScore: 0,
  label: "EMOTION",
});

// 根据情绪分数自动判断状态
const effectiveState = computed(() => {
  if (props.state === "analyzing") return "analyzing";
  if (Math.abs(props.emotionScore) >= 2) return "highEmotion";
  return "idle";
});

// 波形颜色
const waveColor = computed(() => {
  switch (effectiveState.value) {
    case "analyzing": return "#f59e0b"; // 黄色
    case "highEmotion": return props.emotionScore >= 2 ? "#ec4899" : "#ef4444"; // 粉/红
    default: return "#10b981"; // 绿色
  }
});

// 波形速度类
const animationClass = computed(() => {
  switch (effectiveState.value) {
    case "analyzing": return "ecg-fast";
    case "highEmotion": return "ecg-intense";
    default: return "ecg-normal";
  }
});

// 情绪标签
const emotionLabel = computed(() => {
  const score = props.emotionScore;
  if (score >= 3) return "CRITICAL_LOVE";
  if (score >= 2) return "HIGH_AFFECTION";
  if (score >= 1) return "POSITIVE";
  if (score <= -3) return "CRITICAL_ANGER";
  if (score <= -2) return "HIGH_TENSION";
  if (score <= -1) return "NEGATIVE";
  return "NEUTRAL";
});

// BPM 显示（模拟）
const bpm = computed(() => {
  switch (effectiveState.value) {
    case "analyzing": return Math.floor(90 + Math.random() * 20);
    case "highEmotion": return Math.floor(120 + Math.abs(props.emotionScore) * 15);
    default: return Math.floor(60 + Math.random() * 10);
  }
});

// 用于触发 BPM 更新的响应式值
const bpmDisplay = ref(bpm.value);

// 定期更新 BPM 显示
let bpmInterval: number | null = null;

watch(effectiveState, (state) => {
  if (bpmInterval) clearInterval(bpmInterval);
  
  if (state !== "idle") {
    bpmInterval = setInterval(() => {
      bpmDisplay.value = bpm.value;
    }, 500) as unknown as number;
  } else {
    bpmDisplay.value = bpm.value;
  }
}, { immediate: true });
</script>

<template>
  <div 
    class="ecg-monitor"
    :class="{ 
      'ecg-glitch': effectiveState === 'highEmotion',
      'ecg-analyzing': effectiveState === 'analyzing'
    }"
  >
    <!-- 标签 -->
    <div class="ecg-header">
      <Activity class="h-3 w-3" :style="{ color: waveColor }" />
      <span class="ecg-label">{{ props.label }}</span>
    </div>
    
    <!-- 波形 SVG -->
    <div class="ecg-wave-container">
      <svg 
        class="ecg-wave" 
        :class="animationClass"
        viewBox="0 0 200 40" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient :id="`ecg-gradient-${effectiveState}`" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :stop-color="waveColor" stop-opacity="0" />
            <stop offset="50%" :stop-color="waveColor" stop-opacity="1" />
            <stop offset="100%" :stop-color="waveColor" stop-opacity="0" />
          </linearGradient>
        </defs>
        
        <!-- 心电图路径 -->
        <path
          class="ecg-path"
          :stroke="`url(#ecg-gradient-${effectiveState})`"
          stroke-width="2"
          fill="none"
          d="M0,20 L30,20 L35,20 L40,10 L45,30 L50,5 L55,35 L60,20 L70,20 L100,20 L130,20 L135,20 L140,10 L145,30 L150,5 L155,35 L160,20 L170,20 L200,20"
        />
      </svg>
      
      <!-- 扫描线 -->
      <div class="ecg-scanline" :style="{ background: waveColor }"></div>
    </div>
    
    <!-- 状态信息 -->
    <div class="ecg-stats">
      <div class="ecg-bpm">
        <span class="bpm-value" :style="{ color: waveColor }">{{ bpmDisplay }}</span>
        <span class="bpm-unit">BPM</span>
      </div>
      <div class="ecg-status" :style="{ color: waveColor }">
        {{ emotionLabel }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ecg-monitor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 140px;
  backdrop-filter: blur(10px);
}

/* 头部 */
.ecg-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ecg-label {
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

/* 波形容器 */
.ecg-wave-container {
  position: relative;
  height: 32px;
  overflow: hidden;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.ecg-wave {
  width: 200%;
  height: 100%;
}

/* 波形动画 */
.ecg-path {
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ecg-normal {
  animation: ecg-scroll 4s linear infinite;
}

.ecg-fast {
  animation: ecg-scroll 1.5s linear infinite;
}

.ecg-intense {
  animation: ecg-scroll 0.8s linear infinite, ecg-shake 0.1s linear infinite;
}

@keyframes ecg-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes ecg-shake {
  0%, 100% { transform: translateX(0) translateY(0); }
  25% { transform: translateX(-1px) translateY(1px); }
  50% { transform: translateX(1px) translateY(-1px); }
  75% { transform: translateX(-1px) translateY(-1px); }
}

/* 扫描线 */
.ecg-scanline {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  opacity: 0.8;
  animation: scanline-move 2s linear infinite;
  box-shadow: 0 0 10px currentColor;
}

@keyframes scanline-move {
  from { left: 0; }
  to { left: 100%; }
}

/* 状态信息 */
.ecg-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ecg-bpm {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.bpm-value {
  font-size: 16px;
  font-family: var(--font-mono);
  font-weight: bold;
  line-height: 1;
}

.bpm-unit {
  font-size: 8px;
  font-family: var(--font-mono);
  color: rgba(255, 255, 255, 0.4);
}

.ecg-status {
  font-size: 8px;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

/* Glitch 效果 */
.ecg-glitch {
  animation: ecg-glitch-border 0.3s linear infinite;
}

@keyframes ecg-glitch-border {
  0%, 100% { 
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
  50% { 
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
  }
}

/* 分析中呼吸效果 */
.ecg-analyzing {
  animation: ecg-pulse 1s ease-in-out infinite;
}

@keyframes ecg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
