<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";

/**
 * ✨ ThemeParticles v4.0 - 时间轮盘粒子系统
 * 
 * 三主题适配：
 * - Morning: 缓慢上升的微尘/羽毛 (白色半透明)
 * - Sunset: 漂浮的光点/火星 (金色，丁达尔效应)
 * - Night: 偶尔闪烁的流星/数据流 (青色)
 */

type ThemeType = "morning" | "sunset" | "night";

interface ThemeParticlesProps {
  /** 粒子数量 (默认 50) */
  count?: number;
  /** 是否激活 */
  active?: boolean;
  /** 当前主题 */
  theme?: ThemeType;
  /** 强度模式 */
  intensity?: "idle" | "active" | "burst";
}

const props = withDefaults(defineProps<ThemeParticlesProps>(), {
  count: 50,
  active: true,
  theme: "sunset",
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
  hue: number;
  twinkle: number;
  type: "dust" | "spark" | "meteor";
  life: number;      // 生命值 (用于流星)
  maxLife: number;
  trail?: { x: number; y: number }[];  // 流星轨迹
}

// 主题配置
const themeConfig = computed(() => {
  switch (props.theme) {
    case "morning":
      return {
        hueRange: [200, 220],     // 天蓝色
        baseOpacity: 0.3,
        speedMult: 0.5,           // 缓慢
        sizeMult: 1.2,
        direction: -1,            // 向上飘
        particleType: "dust" as const,
        glowColor: "rgba(14, 165, 233, 0.3)",
      };
    case "sunset":
      return {
        hueRange: [35, 55],       // 金色
        baseOpacity: 0.5,
        speedMult: 0.8,
        sizeMult: 1.0,
        direction: -1,
        particleType: "spark" as const,
        glowColor: "rgba(251, 191, 36, 0.4)",
      };
    case "night":
      return {
        hueRange: [180, 200],     // 青色
        baseOpacity: 0.6,
        speedMult: 2.0,           // 快速
        sizeMult: 0.8,
        direction: 1,             // 向下划过
        particleType: "meteor" as const,
        glowColor: "rgba(34, 211, 238, 0.5)",
      };
  }
});

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

function createParticle(canvas: HTMLCanvasElement, fromEdge = true): Particle {
  const config = themeConfig.value;
  const intensity = intensityConfig.value;
  
  const hue = config.hueRange[0] + Math.random() * (config.hueRange[1] - config.hueRange[0]);
  const baseSpeed = (Math.random() * 0.8 + 0.3) * config.speedMult * intensity.speedMult;
  
  // 根据主题决定初始位置
  let startX: number, startY: number;
  if (props.theme === "night") {
    // 流星从顶部随机位置开始
    startX = Math.random() * canvas.width;
    startY = fromEdge ? -10 : Math.random() * canvas.height * 0.5;
  } else {
    // 光尘从底部开始
    startX = Math.random() * canvas.width;
    startY = fromEdge ? canvas.height + 10 : Math.random() * canvas.height;
  }
  
  return {
    x: startX,
    y: startY,
    size: (Math.random() * 3 + 1) * config.sizeMult * intensity.sizeMult,
    speedY: baseSpeed * config.direction,
    speedX: (Math.random() - 0.5) * 0.5,
    opacity: (Math.random() * 0.4 + 0.2) * config.baseOpacity * intensity.opacityBase,
    hue,
    twinkle: Math.random() * Math.PI * 2,
    type: config.particleType,
    life: 1,
    maxLife: props.theme === "night" ? 60 + Math.random() * 60 : 999,
    trail: props.theme === "night" ? [] : undefined,
  };
}

function initParticles(canvas: HTMLCanvasElement) {
  particles = [];
  const count = props.theme === "night" ? Math.floor(props.count * 0.3) : props.count;
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(canvas, false));
  }
}

function drawMorningParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  // 微尘/羽毛 - 柔和的光晕
  const twinkleOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle));
  
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
  gradient.addColorStop(0, `hsla(${p.hue}, 60%, 95%, ${twinkleOpacity})`);
  gradient.addColorStop(0.5, `hsla(${p.hue}, 50%, 90%, ${twinkleOpacity * 0.4})`);
  gradient.addColorStop(1, `hsla(${p.hue}, 40%, 85%, 0)`);
  
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawSunsetParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  // 金色火星 - 丁达尔效应
  const twinkleOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.twinkle));
  
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
  gradient.addColorStop(0, `hsla(${p.hue}, 100%, 75%, ${twinkleOpacity})`);
  gradient.addColorStop(0.4, `hsla(${p.hue}, 100%, 65%, ${twinkleOpacity * 0.6})`);
  gradient.addColorStop(1, `hsla(${p.hue}, 100%, 55%, 0)`);
  
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 核心亮点
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${p.hue + 10}, 100%, 90%, ${twinkleOpacity})`;
  ctx.fill();
}

function drawNightParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  // 流星/数据流 - 带轨迹
  const lifeRatio = p.life / p.maxLife;
  const fadeOpacity = p.opacity * lifeRatio;
  
  // 绘制轨迹
  if (p.trail && p.trail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(p.trail[0].x, p.trail[0].y);
    for (let i = 1; i < p.trail.length; i++) {
      ctx.lineTo(p.trail[i].x, p.trail[i].y);
    }
    ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${fadeOpacity * 0.3})`;
    ctx.lineWidth = p.size * 0.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  
  // 流星头部
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
  gradient.addColorStop(0, `hsla(${p.hue}, 90%, 80%, ${fadeOpacity})`);
  gradient.addColorStop(0.5, `hsla(${p.hue}, 80%, 60%, ${fadeOpacity * 0.5})`);
  gradient.addColorStop(1, `hsla(${p.hue}, 70%, 50%, 0)`);
  
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    // 更新位置
    p.y += p.speedY;
    p.x += p.speedX;
    p.twinkle += 0.05;
    
    // 流星轨迹与生命值
    if (p.type === "meteor") {
      p.life--;
      if (p.trail) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();
      }
    }
    
    // 绘制
    switch (p.type) {
      case "dust":
        drawMorningParticle(ctx, p);
        break;
      case "spark":
        drawSunsetParticle(ctx, p);
        break;
      case "meteor":
        drawNightParticle(ctx, p);
        break;
    }
    
    // 重置条件
    const needsReset = 
      (p.type === "meteor" && p.life <= 0) ||
      (p.type !== "meteor" && p.y < -10) ||
      p.y > canvas.height + 10;
    
    if (needsReset) {
      particles[i] = createParticle(canvas, true);
    }
    
    // 横向边界
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

// 监听主题变化，重新初始化粒子
watch(() => props.theme, () => {
  const canvas = canvasRef.value;
  if (canvas) {
    initParticles(canvas);
  }
});

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

  const config = themeConfig.value;
  
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
      hue: config.hueRange[0] + Math.random() * (config.hueRange[1] - config.hueRange[0]),
      twinkle: 0,
      type: config.particleType,
      life: 60,
      maxLife: 60,
      trail: props.theme === "night" ? [] : undefined,
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
