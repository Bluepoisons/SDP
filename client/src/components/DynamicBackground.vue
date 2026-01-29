<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

// 🎨 检测当前主题
const isDarkTheme = ref(!document.body.classList.contains('theme-pink'));

// 🌌 Canvas 引用
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;
let stars: Array<{ x: number; y: number; radius: number; opacity: number; speed: number }> = [];

// 🎯 监听主题变化
const checkTheme = () => {
  isDarkTheme.value = !document.body.classList.contains('theme-pink');
};

// ⭐ 星空动画 (Dark Mode)
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

// 💗 爱心粒子动画 (Pink Mode)
const hearts = ref<Array<{ id: number; x: number; delay: number }>>([]);

const initHearts = () => {
  // 生成 20 个爱心
  hearts.value = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // 百分比位置
    delay: Math.random() * 5  // 随机延迟
  }));
};

// 🎬 初始化与清理
onMounted(() => {
  checkTheme();
  
  if (isDarkTheme.value) {
    initStars();
  } else {
    initHearts();
  }
  
  // 监听窗口大小变化
  const handleResize = () => {
    if (isDarkTheme.value && canvasRef.value) {
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
watch(isDarkTheme, (isDark) => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  if (isDark) {
    initStars();
  } else {
    initHearts();
  }
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-0">
    <!-- 🌌 星空背景 (Dark Mode) -->
    <canvas
      v-if="isDarkTheme"
      ref="canvasRef"
      class="absolute inset-0 w-full h-full"
    ></canvas>
    
    <!-- 💗 爱心粒子 (Pink Mode) -->
    <div v-else class="absolute inset-0 overflow-hidden">
      <div
        v-for="heart in hearts"
        :key="heart.id"
        class="floating-heart"
        :style="{
          left: `${heart.x}%`,
          animationDelay: `${heart.delay}s`
        }"
      >
        ♥
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 💗 爱心浮动动画 */
.floating-heart {
  position: absolute;
  bottom: -50px;
  font-size: 1.5rem;
  color: rgba(236, 72, 153, 0.3);
  animation: float-up 8s linear infinite;
  pointer-events: none;
}

@keyframes float-up {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}
</style>
