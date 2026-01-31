<script setup lang="ts">
/**
 * 🎯 BubbleQueue v9.0
 * 「连发气泡」动画队列管理器
 * 
 * 功能：
 * - 将多行文本按节奏逐个弹出
 * - 模拟真人打字的急促感/傲娇连击
 * - 配合轻微位移动画增强压迫感
 */
import { ref, watch, computed, onUnmounted } from 'vue';

interface Props {
  lines: string[];        // 要发送的消息数组
  interval?: number;      // 每条消息间隔 (ms)
  isActive?: boolean;     // 是否激活动画
}

const props = withDefaults(defineProps<Props>(), {
  lines: () => [],
  interval: 150,
  isActive: false,
});

const emit = defineEmits<{
  (e: 'bubble-sent', line: string, index: number): void;
  (e: 'queue-complete'): void;
}>();

// 当前已发送的气泡
const sentBubbles = ref<Array<{ text: string; id: number }>>([]);
let bubbleId = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

// 发送队列
const sendNextBubble = (index: number) => {
  if (index >= props.lines.length) {
    emit('queue-complete');
    return;
  }
  
  const line = props.lines[index];
  if (line.trim()) {
    sentBubbles.value.push({ text: line, id: bubbleId++ });
    emit('bubble-sent', line, index);
  }
  
  // 根据文本长度动态调整间隔
  const baseInterval = props.interval;
  const lengthFactor = Math.min(line.length / 10, 2); // 长文本稍慢
  const randomJitter = Math.random() * 50 - 25; // 随机抖动 ±25ms
  const nextInterval = baseInterval + lengthFactor * 30 + randomJitter;
  
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
const getBubbleStyle = (index: number) => ({
  '--delay': `${index * 0.08}s`,
  '--offset': `${Math.sin(index) * 4}px`,
});
</script>

<template>
  <div class="bubble-queue">
    <TransitionGroup name="bubble-pop">
      <div
        v-for="(bubble, index) in sentBubbles"
        :key="bubble.id"
        class="burst-bubble-item"
        :style="getBubbleStyle(index)"
      >
        <div class="bubble-content">
          {{ bubble.text }}
        </div>
        <div class="bubble-tail" />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.bubble-queue {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  padding: 4px 0;
}

.burst-bubble-item {
  position: relative;
  max-width: 75%;
  animation: bubble-entrance 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: var(--delay, 0s);
  opacity: 0;
  transform: translateX(20px) translateY(var(--offset, 0));
}

.bubble-content {
  padding: 10px 20px 10px 16px; /* 右侧增加内边距，避免单字显示问题 */
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
  min-width: 2.5em; /* 最小宽度，避免单字太窄 */
  
  /* 切角效果 - 右上角 */
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
  60% {
    opacity: 1;
    transform: translateX(-5px) translateY(var(--offset, 0)) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateY(0) scale(1);
  }
}

/* Vue Transition 动画 */
.bubble-pop-enter-active {
  animation: bubble-entrance 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.bubble-pop-leave-active {
  animation: bubble-exit 0.2s ease-out forwards;
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
</style>
