<script setup lang="ts">
/**
 * 🔮 ThinkingOrb v9.0
 * 「数字灵魂」拟人化思考态
 * 
 * 状态：
 * - idle: 待机呼吸
 * - thinking: 快速旋转收缩（神经元连接）
 * - generating: 随文字跳动
 */
import { computed, ref, watch } from 'vue';

type OrbState = 'idle' | 'thinking' | 'generating';

interface Props {
  state?: OrbState;
  duration?: number;      // 已思考时长 (ms)
  stage?: string;         // 当前阶段文字
  pulseIntensity?: number; // 生成时跳动强度 0-1
}

const props = withDefaults(defineProps<Props>(), {
  state: 'idle',
  duration: 0,
  stage: '',
  pulseIntensity: 0.5,
});

// 格式化时间显示
const formattedDuration = computed(() => {
  const seconds = Math.floor(props.duration / 1000);
  const ms = Math.floor((props.duration % 1000) / 10);
  return `${seconds}.${String(ms).padStart(2, '0')}s`;
});

// 动态色相旋转（思考时青紫流转）
const hueRotation = ref(0);
let animationFrame: number | null = null;

const animateHue = () => {
  if (props.state === 'thinking') {
    hueRotation.value = (hueRotation.value + 2) % 360;
  }
  animationFrame = requestAnimationFrame(animateHue);
};

watch(() => props.state, (newState) => {
  if (newState === 'thinking' && !animationFrame) {
    animateHue();
  } else if (newState !== 'thinking' && animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}, { immediate: true });

// 组件卸载时清理
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
</script>

<template>
  <div class="thinking-orb-container" :class="[`state-${state}`]">
    <!-- 🌀 主光球 -->
    <div class="orb-wrapper">
      <!-- 外环光晕 -->
      <div 
        class="orb-halo"
        :style="{ filter: `hue-rotate(${hueRotation}deg)` }"
      />
      
      <!-- 核心球体 -->
      <div 
        class="orb-core"
        :style="{ 
          filter: `hue-rotate(${hueRotation}deg)`,
          transform: state === 'generating' ? `scale(${1 + pulseIntensity * 0.1})` : undefined
        }"
      >
        <!-- 内部能量流 -->
        <div class="orb-energy" />
        <div class="orb-energy orb-energy-2" />
        <div class="orb-energy orb-energy-3" />
      </div>
      
      <!-- 轨道粒子 -->
      <div class="orbit-particles">
        <span v-for="i in 6" :key="i" class="orbit-dot" :style="{ '--i': i }" />
      </div>
    </div>
    
    <!-- 📊 状态信息 -->
    <div class="orb-info">
      <div class="orb-timer">
        <span class="timer-value">{{ formattedDuration }}</span>
      </div>
      <div class="orb-stage">
        <span class="stage-text">{{ stage || 'SYSTEM READY' }}</span>
        <span v-if="state === 'thinking'" class="stage-dots">
          <span class="dot" v-for="i in 3" :key="i" />
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thinking-orb-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

/* ==================== 光球主体 ==================== */
.orb-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 外环光晕 */
.orb-halo {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(var(--accent-rgb, 139, 92, 246), 0.3) 0%,
    transparent 70%
  );
  filter: blur(10px);
  animation: halo-breathe 3s ease-in-out infinite;
}

/* 核心球体 */
.orb-core {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: 
    radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.4) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle,
      var(--accent-color, #8b5cf6) 0%,
      var(--accent-secondary, #06b6d4) 100%
    );
  box-shadow:
    0 0 30px rgba(var(--accent-rgb, 139, 92, 246), 0.5),
    inset 0 0 20px rgba(255, 255, 255, 0.2);
  animation: core-idle 4s ease-in-out infinite;
  transition: transform 0.1s ease-out;
}

/* 内部能量流 */
.orb-energy {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    transparent 40%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 60%
  );
  animation: energy-rotate 3s linear infinite;
}

.orb-energy-2 {
  animation-duration: 2s;
  animation-direction: reverse;
  opacity: 0.7;
}

.orb-energy-3 {
  animation-duration: 4s;
  opacity: 0.5;
}

/* 轨道粒子 */
.orbit-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: orbit-spin 8s linear infinite;
}

.orbit-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-color, #8b5cf6);
  box-shadow: 0 0 8px var(--accent-color, #8b5cf6);
  opacity: 0.6;
  top: 50%;
  left: 50%;
  transform-origin: center;
  transform: rotate(calc(var(--i) * 60deg)) translateX(36px);
}

/* ==================== 状态动画 ==================== */

/* Idle - 缓慢呼吸 */
@keyframes halo-breathe {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes core-idle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes energy-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Thinking - 快速旋转收缩 */
.state-thinking .orb-core {
  animation: core-think 0.8s ease-in-out infinite;
}

.state-thinking .orbit-particles {
  animation-duration: 2s;
}

.state-thinking .orb-halo {
  animation: halo-think 0.6s ease-in-out infinite;
}

@keyframes core-think {
  0%, 100% { transform: scale(0.9); }
  50% { transform: scale(1.1); }
}

@keyframes halo-think {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
}

/* Generating - 随节奏跳动 */
.state-generating .orb-core {
  animation: core-generate 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

@keyframes core-generate {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* ==================== 状态信息 ==================== */
.orb-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.orb-timer {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color, #8b5cf6);
  text-shadow: 0 0 10px rgba(var(--accent-rgb, 139, 92, 246), 0.5);
}

.timer-value {
  letter-spacing: 0.05em;
}

.orb-stage {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-tech, 'Rajdhani', sans-serif);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
}

.stage-text {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-dots {
  display: flex;
  gap: 2px;
}

.stage-dots .dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--accent-color, #8b5cf6);
  animation: dot-blink 1.2s ease-in-out infinite;
}

.stage-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.stage-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
</style>
