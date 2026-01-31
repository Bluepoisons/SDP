<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 💫 二游化属性弹窗组件
 * 跟随鼠标位置的飘字效果，类似原神/崩铁的属性变化反馈
 */

interface ScorePopup {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  color: string;
  glowColor: string;
  type: 'favor' | 'mystery' | 'courage';
  emoji: string;
}

const popups = ref<ScorePopup[]>([]);
const flashOverlay = ref<HTMLElement | null>(null);

// 🎯 触发属性弹窗（二游化版本）
const trigger = (
  label: string, 
  value: number, 
  x: number, 
  y: number,
  type: 'favor' | 'mystery' | 'courage' = 'favor'
) => {
  // 颜色映射 - 二游化配色
  const colorMap = {
    favor: {
      color: value >= 0 ? '#f472b6' : '#c084fc',
      glow: value >= 0 ? 'rgba(244, 114, 182, 0.8)' : 'rgba(192, 132, 252, 0.8)',
      emoji: value >= 0 ? '💕' : '💔'
    },
    mystery: {
      color: '#a78bfa',
      glow: 'rgba(167, 139, 250, 0.8)',
      emoji: '✨'
    },
    courage: {
      color: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.8)',
      emoji: '🔥'
    }
  };
  
  const config = colorMap[type];
  
  const popup: ScorePopup = {
    id: `popup-${Date.now()}-${Math.random()}`,
    label,
    value,
    x: x - 40, // 居中偏移
    y: y - 20, // 向上偏移，从点击位置上方开始
    color: config.color,
    glowColor: config.glow,
    type,
    emoji: config.emoji
  };
  
  popups.value.push(popup);
  
  // 触发屏幕闪烁
  triggerFlash(type, value);
  
  // 2秒后移除（配合新动画时长）
  setTimeout(() => {
    popups.value = popups.value.filter(p => p.id !== popup.id);
  }, 2000);
};

// 💖 触发屏幕闪烁效果
const triggerFlash = (type: 'favor' | 'mystery' | 'courage', value: number) => {
  // 只有正向好感度变化才触发粉色闪烁
  if (type === 'favor' && value <= 0) return;
  
  const flash = document.createElement('div');
  flash.className = `flash-overlay flash-${type === 'favor' ? 'romantic' : type}`;
  document.body.appendChild(flash);
  
  // 动画结束后移除
  setTimeout(() => {
    flash.remove();
  }, 600);
};

defineExpose({
  trigger
});
</script>

<template>
  <Teleport to="body">
    <div class="score-popup-container">
      <TransitionGroup name="popup">
        <div
          v-for="popup in popups"
          :key="popup.id"
          class="score-popup"
          :class="`popup-${popup.type}`"
          :style="{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
            '--popup-color': popup.color,
            '--popup-glow': popup.glowColor
          }"
        >
          <div class="popup-content">
            <span class="popup-emoji">{{ popup.emoji }}</span>
            <div class="popup-text">
              <span class="popup-label">{{ popup.label }}</span>
              <span class="popup-value">
                {{ popup.value > 0 ? '+' : '' }}{{ popup.value }}
              </span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.score-popup-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.score-popup {
  position: absolute;
  transform: translate(-50%, -50%);
  color: var(--popup-color);
}

.popup-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 2rem;
  border: 2px solid var(--popup-color);
  backdrop-filter: blur(12px);
  white-space: nowrap;
  box-shadow: 
    0 0 20px var(--popup-glow),
    0 0 40px var(--popup-glow),
    inset 0 0 20px rgba(255, 255, 255, 0.05);
}

.popup-emoji {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px var(--popup-glow));
  animation: emoji-bounce 0.6s ease-out;
}

.popup-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}

.popup-label {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.85;
  font-family: var(--font-cute);
  letter-spacing: 0.05em;
}

.popup-value {
  font-size: 1.75rem;
  font-weight: 700;
  font-family: var(--font-happy);
  text-shadow: 
    0 0 10px var(--popup-glow),
    0 0 20px var(--popup-glow);
  line-height: 1;
}

/* 🎮 二游化飘字动画 */
.popup-enter-active {
  animation: popup-float-up 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.popup-leave-active {
  animation: popup-fade-out 0.2s ease-out;
}

@keyframes popup-float-up {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, calc(-50% - 20px)) scale(1.2);
    opacity: 1;
  }
  30% {
    transform: translate(-50%, calc(-50% - 35px)) scale(1);
    opacity: 1;
  }
  80% {
    transform: translate(-50%, calc(-50% - 80px)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, calc(-50% - 120px)) scale(0.9);
    opacity: 0;
  }
}

@keyframes popup-fade-out {
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
}

@keyframes emoji-bounce {
  0% { transform: scale(0) rotate(-20deg); }
  50% { transform: scale(1.3) rotate(10deg); }
  75% { transform: scale(0.9) rotate(-5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* 🌸 好感度特殊效果 */
.popup-favor .popup-content {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(50, 20, 40, 0.9) 100%);
}

/* ✨ 神秘度特殊效果 */
.popup-mystery .popup-content {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 20, 60, 0.9) 100%);
}

/* 🔥 勇气值特殊效果 */
.popup-courage .popup-content {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(50, 40, 20, 0.9) 100%);
}
</style>
