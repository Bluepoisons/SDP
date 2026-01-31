<script setup lang="ts">
/**
 * 🎯 BubbleQueue v10.0
 * 「连发气泡」动画队列管理器 - 视觉欺骗增强版
 * 
 * v10.0 新增：
 * - 连击数字显示（右下角 x3 x5）
 * - 压迫感抖动（屏幕微振）
 * - 急促度渐进（越发越快）
 * - 情绪色变化（愤怒变红）
 */
import { ref, watch, computed, onUnmounted } from 'vue';

interface Props {
  lines: string[];        // 要发送的消息数组
  interval?: number;      // 每条消息间隔 (ms)
  isActive?: boolean;     // 是否激活动画
  showCombo?: boolean;    // v10.0: 显示连击数
  urgentMode?: boolean;   // v10.0: 急迫模式（更快节奏）
}

const props = withDefaults(defineProps<Props>(), {
  lines: () => [],
  interval: 150,
  isActive: false,
  showCombo: true,
  urgentMode: false,
});

const emit = defineEmits<{
  (e: 'bubble-sent', line: string, index: number): void;
  (e: 'queue-complete'): void;
  (e: 'combo-update', count: number): void; // v10.0
}>();

// 当前已发送的气泡
const sentBubbles = ref<Array<{ text: string; id: number; urgent: boolean }>>([]);
let bubbleId = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

// v10.0: 连击计数
const comboCount = computed(() => sentBubbles.value.length);

// v10.0: 压迫等级（根据连发数量）
const pressureLevel = computed(() => {
  const count = comboCount.value;
  if (count >= 7) return 'critical';
  if (count >= 5) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
});

// 发送队列
const sendNextBubble = (index: number) => {
  if (index >= props.lines.length) {
    emit('queue-complete');
    return;
  }
  
  const line = props.lines[index];
  if (line.trim()) {
    // v10.0: 标记急迫气泡（后半段更急）
    const isUrgent = props.urgentMode || index >= props.lines.length * 0.6;
    sentBubbles.value.push({ text: line, id: bubbleId++, urgent: isUrgent });
    emit('bubble-sent', line, index);
    emit('combo-update', sentBubbles.value.length);
  }
  
  // v10.0: 急迫模式 - 间隔递减（越发越快）
  const baseInterval = props.urgentMode ? props.interval * 0.6 : props.interval;
  const progressFactor = 1 - (index / props.lines.length) * 0.4; // 后面更快
  const lengthFactor = Math.min(line.length / 15, 1.5);
  const randomJitter = Math.random() * 40 - 20;
  const nextInterval = Math.max(
    baseInterval * progressFactor + lengthFactor * 20 + randomJitter,
    60 // 最快 60ms
  );
  
  timeoutId = setTimeout(() => {
    sendNextBubble(index + 1);
  }, nextInterval);
};

// 监听激活状态
watch(() => props.isActive, (active) => {
  if (active && props.lines.length > 0) {
    sentBubbles.value = [];
    sendNextBubble(0);
  }
}, { immediate: true });

// 监听 lines 变化（用于重新触发）
watch(() => props.lines, () => {
  if (props.isActive) {
    sentBubbles.value = [];
    if (timeoutId) clearTimeout(timeoutId);
    sendNextBubble(0);
  }
});

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

// 气泡动画样式（入场偏移）
const getBubbleStyle = (index: number, urgent: boolean) => ({
  '--delay': `${index * 0.06}s`,
  '--offset': `${Math.sin(index * 1.5) * 5}px`,
  '--shake-intensity': urgent ? '3px' : '0px',
});

// v10.0: 连击数字动画样式
const comboStyle = computed(() => ({
  '--combo-scale': 1 + (comboCount.value - 1) * 0.05,
  '--combo-glow': pressureLevel.value === 'critical' ? '20px' : '10px',
}));
</script>

<template>
  <div class="bubble-queue" :class="[`pressure-${pressureLevel}`]">
    <!-- 🔥 v10.0: 连击数显示 -->
    <Transition name="combo-pop">
      <div 
        v-if="showCombo && comboCount >= 2"
        class="combo-counter"
        :class="pressureLevel"
        :style="comboStyle"
      >
        <span class="combo-x">×</span>
        <span class="combo-num">{{ comboCount }}</span>
        <span v-if="comboCount >= 5" class="combo-label">COMBO!</span>
      </div>
    </Transition>
    
    <!-- 气泡队列 -->
    <TransitionGroup name="bubble-pop">
      <div
        v-for="(bubble, index) in sentBubbles"
        :key="bubble.id"
        class="burst-bubble-item"
        :class="{ 'is-urgent': bubble.urgent }"
        :style="getBubbleStyle(index, bubble.urgent)"
      >
        <div class="bubble-content">
          {{ bubble.text }}
        </div>
        <div class="bubble-tail" />
        
        <!-- v10.0: 急迫感装饰 -->
        <div v-if="bubble.urgent && index >= 3" class="urgency-mark">!</div>
      </div>
    </TransitionGroup>
    
    <!-- 🌀 屏幕震动层（CSS only） -->
    <div v-if="pressureLevel === 'critical'" class="screen-shake-overlay"></div>
  </div>
</template>

<style scoped>
.bubble-queue {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  padding: 4px 0;
}

/* 🔥 连击计数器 */
.combo-counter {
  position: absolute;
  top: -2rem;
  right: 0;
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: var(--font-tech, 'Rajdhani', sans-serif);
  font-weight: 700;
  transform: scale(var(--combo-scale, 1));
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;
}

.combo-x {
  font-size: 0.875rem;
  color: var(--theme-text-muted);
}

.combo-num {
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--theme-accent), #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 var(--combo-glow, 10px) var(--theme-glow);
}

.combo-label {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  margin-left: 0.25rem;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: white;
  border-radius: 0.25rem;
  animation: combo-flash 0.5s ease infinite alternate;
}

@keyframes combo-flash {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}

/* 连击等级变化 */
.combo-counter.medium .combo-num {
  background: linear-gradient(135deg, #fbbf24, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
}

.combo-counter.high .combo-num,
.combo-counter.critical .combo-num {
  background: linear-gradient(135deg, #ef4444, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  animation: combo-pulse 0.3s ease infinite alternate;
}

@keyframes combo-pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

/* 气泡项 */
.burst-bubble-item {
  position: relative;
  max-width: 75%;
  animation: bubble-entrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: var(--delay, 0s);
  opacity: 0;
  transform: translateX(20px) translateY(var(--offset, 0));
}

/* v10.0: 急迫气泡 */
.burst-bubble-item.is-urgent {
  animation-duration: 0.2s;
}

.burst-bubble-item.is-urgent .bubble-content {
  border-color: rgba(239, 68, 68, 0.4);
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.2) 0%,
    rgba(var(--accent-rgb, 139, 92, 246), 0.15) 100%
  );
}

/* 急迫感叹号 */
.urgency-mark {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #ef4444, #f97316);
  border-radius: 50%;
  animation: urgency-bounce 0.4s ease infinite alternate;
}

@keyframes urgency-bounce {
  0% { transform: translateY(-50%) scale(1); }
  100% { transform: translateY(-50%) scale(1.15); }
}

.bubble-content {
  padding: 10px 20px 10px 16px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--bubble-text, #fff);
  background: linear-gradient(
    135deg,
    rgba(var(--accent-rgb, 139, 92, 246), 0.25) 0%,
    rgba(var(--accent-rgb, 139, 92, 246), 0.15) 100%
  );
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  border-radius: 18px 18px 4px 18px;
  backdrop-filter: blur(8px);
  word-break: break-word;
  min-width: 2.5em;
  transition: all 0.2s;
  
  clip-path: polygon(
    0 0,
    calc(100% - 12px) 0,
    100% 12px,
    100% 100%,
    0 100%
  );
}

.bubble-tail {
  position: absolute;
  right: 8px;
  bottom: -4px;
  width: 8px;
  height: 8px;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.2);
  border-radius: 0 0 8px 0;
  transform: rotate(45deg);
}

/* 入场动画 */
@keyframes bubble-entrance {
  0% {
    opacity: 0;
    transform: translateX(30px) translateY(var(--offset, 0)) scale(0.8);
  }
  50% {
    transform: translateX(-5px) translateY(var(--offset, 0)) scale(1.03);
  }
  70% {
    transform: translateX(var(--shake-intensity, 0)) translateY(var(--offset, 0)) scale(1);
  }
  85% {
    transform: translateX(calc(var(--shake-intensity, 0) * -1)) translateY(0) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateY(0) scale(1);
  }
}

/* Vue Transition 动画 */
.bubble-pop-enter-active {
  animation: bubble-entrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.bubble-pop-leave-active {
  animation: bubble-exit 0.2s ease-out forwards;
}

.combo-pop-enter-active {
  animation: combo-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.combo-pop-leave-active {
  animation: combo-out 0.2s ease-out;
}

@keyframes combo-in {
  0% { opacity: 0; transform: scale(0.5) translateY(10px); }
  100% { opacity: 1; transform: scale(var(--combo-scale, 1)) translateY(0); }
}

@keyframes combo-out {
  to { opacity: 0; transform: scale(0.8); }
}

@keyframes bubble-exit {
  to {
    opacity: 0;
    transform: translateX(20px) scale(0.9);
  }
}

/* 连击压迫效果 - 快速连发时的抖动 */
.burst-bubble-item:nth-child(n+3) {
  animation-duration: 0.25s;
}

.burst-bubble-item:nth-child(n+5) {
  animation-duration: 0.2s;
}

.burst-bubble-item:nth-child(n+7) {
  animation-duration: 0.15s;
}

/* 🌀 压迫等级整体效果 */
.bubble-queue.pressure-high {
  animation: queue-shake-light 0.1s ease infinite;
}

.bubble-queue.pressure-critical {
  animation: queue-shake-heavy 0.08s ease infinite;
}

@keyframes queue-shake-light {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(1px); }
}

@keyframes queue-shake-heavy {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* 屏幕震动层（视觉欺骗） */
.screen-shake-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  animation: screen-shake 0.1s ease infinite;
  z-index: -1;
}

@keyframes screen-shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-1px, 1px); }
  50% { transform: translate(1px, -1px); }
  75% { transform: translate(-1px, -1px); }
}
</style>
