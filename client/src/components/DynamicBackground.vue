<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue';

// 🎨 检测当前主题 (v2.1 双主题系统)
type Theme = 'sunset' | 'night';
const currentTheme = ref<Theme>('sunset');

// 🌌 Canvas 引用
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;
let stars: Array<{ x: number; y: number; radius: number; opacity: number; speed: number }> = [];

// 🎯 从 body class 检测主题
const checkTheme = () => {
  if (document.body.classList.contains('theme-sunset')) {
    currentTheme.value = 'sunset';
  } else {
    currentTheme.value = 'night';
  }
};

// 计算是否显示星空 (仅夜晚模式)
const showStars = computed(() => currentTheme.value === 'night');

// ⭐ 星空动画 (Night Mode)
const initStars = () => {
  if (!canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 设置 Canvas 尺寸
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // 生成 150 颗星星
  stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.3,
    speed: Math.random() * 0.5 + 0.1
  }));
  
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
      // 闪烁效果
      star.opacity += (Math.random() - 0.5) * 0.02;
      star.opacity = Math.max(0.1, Math.min(0.8, star.opacity));
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
      
      // 微小移动
      star.y += star.speed * 0.1;
      if (star.y > canvas.height) star.y = 0;
    });
    
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
};

// 🎬 初始化与清理
onMounted(() => {
  checkTheme();
  
  if (showStars.value) {
    initStars();
  }
  
  // 监听窗口大小变化
  const handleResize = () => {
    if (showStars.value && canvasRef.value) {
      canvasRef.value.width = window.innerWidth;
      canvasRef.value.height = window.innerHeight;
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  // 监听主题变化
  const observer = new MutationObserver(checkTheme);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  
  onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', handleResize);
    observer.disconnect();
  });
});

// 🎨 监听主题切换
watch(showStars, (shouldShow) => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  if (shouldShow) {
    initStars();
  }
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-0">
    <!-- 🌌 Night 主题背景渐变 -->
    <div 
      v-if="currentTheme === 'night'"
      class="absolute inset-0 night-bg-gradient"
    ></div>
    
    <!-- 🌌 星空背景 (Night Mode Only) -->
    <canvas
      v-if="showStars"
      ref="canvasRef"
      class="absolute inset-0 w-full h-full"
    ></canvas>
    
    <!-- ☀️ 清晨/🌆 黄昏不显示额外背景层（由 TwilightParticles 负责） -->
  </div>
</template>

<style scoped>
/* 🌙 Night 主题 - 深空渐变 + 星云 */
.night-bg-gradient {
  background: 
    /* 星云效果 */
    radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
    /* 深空渐变 */
    linear-gradient(180deg, 
      #020617 0%,           /* Slate-950 深黑 */
      #0f172a 30%,          /* Slate-900 */
      #1e1b4b 60%,          /* Indigo-950 微紫 */
      #0c4a6e 100%          /* Sky-900 深青 */
    );
}
</style>
