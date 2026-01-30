<script setup lang="ts">
import { ref } from 'vue';

/**
 * 💔 情感色彩反馈组件
 * 好感度变化时的屏幕边缘闪烁
 */

const isFlashing = ref(false);
const flashType = ref<'positive' | 'negative'>('positive');

const triggerFlash = (score: number) => {
  if (score === 0) return;
  
  flashType.value = score > 0 ? 'positive' : 'negative';
  isFlashing.value = true;
  
  setTimeout(() => {
    isFlashing.value = false;
  }, 600);
};

// 暴露方法供父组件调用
defineExpose({ triggerFlash });
</script>

<template>
  <Teleport to="body">
    <Transition name="flash">
      <div 
        v-if="isFlashing"
        class="emotion-flash"
        :class="flashType === 'positive' ? 'flash-positive' : 'flash-negative'"
      ></div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.emotion-flash {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
}

.flash-positive {
  box-shadow: inset 0 0 120px rgba(236, 72, 153, 0.35);
  animation: flash-fade 0.6s ease-out forwards;
}

.flash-negative {
  box-shadow: inset 0 0 120px rgba(239, 68, 68, 0.35);
  animation: flash-fade 0.6s ease-out forwards;
}

@keyframes flash-fade {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}

.flash-enter-active,
.flash-leave-active {
  transition: opacity 0.15s ease;
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
}
</style>
