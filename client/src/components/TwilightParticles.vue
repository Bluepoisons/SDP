<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";

/**
 * ✨ TwilightParticles v8.0 - 黄昏光尘粒子特效
 * 
 * 模拟丁达尔效应：屏幕底部向上漂浮的金色光尘
 * 低性能开销 Canvas 实现
 */

interface TwilightParticlesProps {
  /** 粒子数量 (默认 50) */
  count?: number;
  /** 是否激活 */
  active?: boolean;
  /** 强度模式 (idle/active/burst) */
  intensity?: "idle" | "active" | "burst";
}

const props = withDefaults(defineProps<TwilightParticlesProps>(), {
  count: 50,
  active: true,
  intensity: "idle",
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;
let particles: Particle[] = [];

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  hue: number;       // 色相变化 (金色范围)
  twinkle: number;   // 闪烁相位
}

// 根据强度调整参数
const intensityConfig = computed(() => {
  switch (props.intensity) {
    case "burst":
      return { speedMult: 2.5, sizeMult: 1.5, opacityBase: 0.8 };
    case "active":
      return { speedMult: 1.5, sizeMult: 1.2, opacityBase: 0.6 };
    default:
      return { speedMult: 1, sizeMult: 1, opacityBase: 0.4 };
  }
});

function createParticle(canvas: HTMLCanvasElement, fromBottom = true): Particle {
  const config = intensityConfig.value;
  return {
    x: Math.random() * canvas.width,
    y: fromBottom ? canvas.height + 10 : Math.random() * canvas.height,
    size: (Math.random() * 3 + 1) * config.sizeMult,
    speedY: -(Math.random() * 0.8 + 0.3) * config.speedMult,
    speedX: (Math.random() - 0.5) * 0.3,
    opacity: (Math.random() * 0.4 + 0.2) * config.opacityBase,
    hue: 40 + Math.random() * 20,  // 40-60: 金黄色范围
    twinkle: Math.random() * Math.PI * 2,
  };
}

function initParticles(canvas: HTMLCanvasElement) {
  particles = [];
  for (let i = 0; i < props.count; i++) {
    particles.push(createParticle(canvas, false));
  }
}

function draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of particles) {
    // 更新位置
    p.y += p.speedY;
    p.x += p.speedX;
    p.twinkle += 0.05;

    // 计算闪烁透明度
    const twinkleOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.twinkle));

    // 绘制光尘
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${twinkleOpacity})`);
    gradient.addColorStop(0.4, `hsla(${p.hue}, 100%, 60%, ${twinkleOpacity * 0.6})`);
    gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 核心亮点
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue + 10}, 100%, 85%, ${twinkleOpacity})`;
    ctx.fill();

    // 重置超出屏幕的粒子
    if (p.y < -10) {
      Object.assign(p, createParticle(canvas, true));
    }

    // 横向边界处理
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
  }
}

function animate() {
  const canvas = canvasRef.value;
  if (!canvas || !props.active) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  draw(canvas, ctx);
  animationId = requestAnimationFrame(animate);
}

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles(canvas);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  handleResize();
  window.addEventListener("resize", handleResize);

  if (props.active) {
    animate();
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});

// 监听 active 变化
import { watch } from "vue";
watch(
  () => props.active,
  (isActive) => {
    if (isActive && !animationId) {
      animate();
    } else if (!isActive && animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
);

// 监听 intensity 变化，触发爆发效果
watch(
  () => props.intensity,
  (newIntensity) => {
    if (newIntensity === "burst") {
      // 爆发模式：添加额外粒子
      const canvas = canvasRef.value;
      if (canvas) {
        for (let i = 0; i < 20; i++) {
          particles.push(createParticle(canvas, true));
        }
      }
    }
  }
);

// 暴露爆发方法供外部调用
function burst(x?: number, y?: number) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const centerX = x ?? canvas.width / 2;
  const centerY = y ?? canvas.height;

  // 从指定位置爆发粒子
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 * i) / 15;
    const speed = Math.random() * 2 + 1;
    particles.push({
      x: centerX,
      y: centerY,
      size: Math.random() * 4 + 2,
      speedY: Math.sin(angle) * speed - 1,
      speedX: Math.cos(angle) * speed,
      opacity: 0.8,
      hue: 45,
      twinkle: 0,
    });
  }
}

defineExpose({ burst });
</script>

<template>
  <canvas
    ref="canvasRef"
    class="twilight-particles"
    :class="{ active: active }"
  />
</template>

<style scoped>
.twilight-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.twilight-particles.active {
  opacity: 1;
}
</style>
