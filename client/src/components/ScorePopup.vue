<script setup lang="ts">
import { ref } from 'vue';

/**
 * 💫 属性变化弹窗组件
 * 显示好感度/神秘度等属性的即时反馈
 */

interface ScorePopup {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  color: string;
}

const popups = ref<ScorePopup[]>([]);

// 🎯 触发属性弹窗
const trigger = (
  label: string, 
  value: number, 
  x: number, 
  y: number,
  type: 'favor' | 'mystery' | 'courage' = 'favor'
) => {
  const colorMap = {
    favor: value >= 0 ? '#ec4899' : '#a855f7',
    mystery: '#8b5cf6',
    courage: '#f59e0b'
  };
  
  const popup: ScorePopup = {
    id: `popup-${Date.now()}-${Math.random()}`,
    label,
    value,
    x,
    y,
    color: colorMap[type]
  };
  
  popups.value.push(popup);
  
  // 1.5秒后移除
  setTimeout(() => {
    popups.value = popups.value.filter(p => p.id !== popup.id);
  }, 1500);
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
          :style="{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
            color: popup.color
          }"
        >
          <div class="popup-content">
            <span class="popup-label">{{ popup.label }}</span>
            <span class="popup-value">
              {{ popup.value > 0 ? '+' : '' }}{{ popup.value }}
            </span>
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
}

.popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 0.5rem;
  border: 2px solid currentColor;
  backdrop-filter: blur(10px);
  white-space: nowrap;
}

.popup-label {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 500;
}

.popup-value {
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 0 10px currentColor;
}

/* 动画过渡 */
.popup-enter-active {
  animation: popup-enter 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popup-leave-active {
  animation: popup-leave 0.3s ease-out;
}

@keyframes popup-enter {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  30% {
    transform: translateY(-30px) scale(1.3);
    opacity: 1;
  }
  70% {
    transform: translateY(-50px) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translateY(-80px) scale(1);
    opacity: 0;
  }
}

@keyframes popup-leave {
  to {
    opacity: 0;
    transform: scale(0.5);
  }
}
</style>
