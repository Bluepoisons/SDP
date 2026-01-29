<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 🔆 鼠标跟随光源 v6.0
 * Fluent Design 风格的动态光效
 */

const lightX = ref(0);
const lightY = ref(0);
const isVisible = ref(false);

let rafId: number | null = null;
let targetX = 0;
let targetY = 0;

const handleMouseMove = (e: MouseEvent) => {
  targetX = e.clientX;
  targetY = e.clientY;
  isVisible.value = true;
};

const handleMouseLeave = () => {
  isVisible.value = false;
};

// 平滑跟随动画
const animate = () => {
  // 缓动系数
  const ease = 0.08;
  
  lightX.value += (targetX - lightX.value) * ease;
  lightY.value += (targetY - lightY.value) * ease;
  
  rafId = requestAnimationFrame(animate);
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  document.body.addEventListener('mouseleave', handleMouseLeave);
  animate();
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  document.body.removeEventListener('mouseleave', handleMouseLeave);
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<template>
  <div 
    class="mouse-light"
    :style="{
      left: `${lightX}px`,
      top: `${lightY}px`,
      opacity: isVisible ? 0.15 : 0
    }"
  ></div>
</template>

<style scoped>
/* 样式在 galgame-theme.css 中定义 */
</style>
