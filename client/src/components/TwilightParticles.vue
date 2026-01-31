<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";

/**
 * ✨ ThemeParticles v2.2 - 三态主题粒子系统
 * 
 * 三态主题适配：
 * - Morning: 漂浮微尘/白色花瓣 (丁达尔效应，向上缓慢漂浮)
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
  type: "petal" | "spark" | "meteor" | "firefly";  // 🏮 新增 firefly
  life: number;      // 生命值 (用于流星)
  maxLife: number;
  trail?: { x: number; y: number }[];  // 流星轨迹
  rotation?: number;  // 花瓣旋转角度
  rotationSpeed?: number;
  colorIndex?: number;  // 马卡龙色索引
  isPetal?: boolean;  // 是否为花瓣形状
  // 🏮 萤火虫专属属性
  pulseSpeed?: number;   // 呼吸速度
  baseX?: number;        // 徘徊中心 X
  baseY?: number;        // 徘徊中心 Y
  hoverPhase?: number;   // 徘徊相位
}

// 主题配置
const themeConfig = computed(() => {
  switch (props.theme) {
    case "morning":
      return {
        hueRange: [330, 360],     // 淡粉色（花瓣色）
        baseOpacity: 0.4,
        speedMult: 0.3,           // 非常缓慢
        sizeMult: 1.2,
        direction: -1,            // 向上漂浮
        particleType: "petal" as const,
        glowColor: "rgba(253, 242, 248, 0.3)",
        colorMode: "pastel" as const,
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
        colorMode: "warm" as const,
      };
    case "night":
    default:
      return {
        hueRange: [175, 210],     // 青色/蓝色
        baseOpacity: 0.9,         // 更亮
        speedMult: 1.5,           // 适中速度
        sizeMult: 1.5,            // 更大
        direction: 1,             // 向下划过
        particleType: "meteor" as const,
        glowColor: "rgba(34, 211, 238, 0.6)",
        trailLength: 25,          // 更长尾迹
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
  
  // 根据主题决定粒子类型
  let particleType: Particle["type"] = config.particleType;
  if (props.theme === "night") {
    // 85% 萤火虫（氛围感），15% 流星（惊喜感）
    particleType = Math.random() > 0.85 ? "meteor" : "firefly";
  } else if (props.theme === "morning") {
    // 清晨：70% 微尘，30% 花瓣
    particleType = Math.random() > 0.7 ? "petal" : "spark";
  }
  
  // 根据粒子类型决定初始位置
  let startX: number, startY: number;
  
  if (particleType === "firefly") {
    // 萤火虫：随机分布在屏幕中
    startX = Math.random() * canvas.width;
    startY = Math.random() * canvas.height;
  } else if (props.theme === "night") {
    // 流星从顶部随机位置开始
    startX = Math.random() * canvas.width;
    startY = fromEdge ? -10 : Math.random() * canvas.height * 0.5;
  } else if (props.theme === "morning") {
    // 清晨：从底部/侧边缓慢升起
    startX = Math.random() * canvas.width;
    startY = fromEdge ? canvas.height + 20 : Math.random() * canvas.height;
  } else {
    // 光尘从底部开始
    startX = Math.random() * canvas.width;
    startY = fromEdge ? canvas.height + 10 : Math.random() * canvas.height;
  }
  
  // 🌸 清晨专属：马卡龙色板索引
  const colorIndex = props.theme === "morning" ? Math.floor(Math.random() * 4) : 0;
  const isPetal = particleType === "petal";
  
  return {
    x: startX,
    y: startY,
    // 🏮 萤火虫记住初始位置用于徘徊
    baseX: startX,
    baseY: startY,
    size: (Math.random() * 3 + 1) * config.sizeMult * intensity.sizeMult,
    speedY: baseSpeed * config.direction,
    speedX: (Math.random() - 0.5) * 0.5,
    opacity: (Math.random() * 0.4 + 0.2) * config.baseOpacity * intensity.opacityBase,
    hue,
    twinkle: Math.random() * Math.PI * 2,
    type: particleType,
    life: 1,
    maxLife: props.theme === "night" ? 60 + Math.random() * 60 : 999,
    trail: particleType === "meteor" ? [] : undefined,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
    colorIndex,
    isPetal,
    // 🏮 萤火虫专属
    pulseSpeed: 0.015 + Math.random() * 0.025,
    hoverPhase: Math.random() * Math.PI * 2,
  };
}

// 🖱️ P1: 鼠标状态
const mouse = { x: -9999, y: -9999 };

function onMouseMove(e: MouseEvent) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function onMouseLeave() {
  mouse.x = -9999;
  mouse.y = -9999;
}

function initParticles(canvas: HTMLCanvasElement) {
  particles = [];
  // v9.0: night 模式增加粒子数量，让流星雨更明显
  const count = props.theme === "night" ? Math.floor(props.count * 0.8) : props.count;
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(canvas, false));
  }
}

function drawMorningParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  // 清新治愈风格：马卡龙色花瓣/细碎星光
  const twinkleOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle));
  
  // 🎨 马卡龙色板
  const pastelPalette = [
    [253, 242, 248], // 淡粉
    [236, 254, 255], // 淡蓝
    [240, 253, 244], // 淡绿
    [254, 252, 232], // 淡黄
  ];
  const color = pastelPalette[p.colorIndex || 0];
  
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation || 0);
  
  if (p.isPetal) {
    // 🌸 花瓣形状
    const petalSize = p.size * 3;
    
    // 花瓣渐变
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, petalSize);
    gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${twinkleOpacity * 0.9})`);
    gradient.addColorStop(0.6, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${twinkleOpacity * 0.4})`);
    gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
    
    // 绘制花瓣（椭圆形）
    ctx.beginPath();
    ctx.ellipse(0, 0, petalSize * 0.4, petalSize, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 花瓣中心高光
    ctx.beginPath();
    ctx.arc(0, -petalSize * 0.3, p.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity * 0.8})`;
    ctx.fill();
  } else {
    // ✨ 细碎星光
    const starSize = p.size * 2.5;
    
    // 外层柔和光晕
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, starSize * 2);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${twinkleOpacity * 0.8})`);
    gradient.addColorStop(0.3, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${twinkleOpacity * 0.4})`);
    gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
    
    ctx.beginPath();
    ctx.arc(0, 0, starSize * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 内核高亮
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
    ctx.fill();
  }
  
  ctx.restore();
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

// 🏮 新增：绘制萤火虫
function drawFirefly(ctx: CanvasRenderingContext2D, p: Particle) {
  // 呼吸效果：利用 sin 函数计算透明度
  const breathCycle = p.twinkle * (p.pulseSpeed || 0.02);
  const alpha = 0.2 + 0.5 * Math.abs(Math.sin(breathCycle));
  
  // 徘徊运动：在 baseX/Y 附近缓慢漂移
  const hoverX = Math.sin(p.twinkle * 0.3 + (p.hoverPhase || 0)) * 25;
  const hoverY = Math.cos(p.twinkle * 0.2 + (p.hoverPhase || 0)) * 20;
  p.x = (p.baseX || p.x) + hoverX;
  p.y = (p.baseY || p.y) + hoverY;
  
  // 绘制外层柔和光晕
  const glowSize = p.size * 6;
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
  gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${alpha * 0.9})`);
  gradient.addColorStop(0.3, `hsla(${p.hue}, 70%, 60%, ${alpha * 0.4})`);
  gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);
  
  ctx.beginPath();
  ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 绘制核心亮点（更亮时才明显）
  if (alpha > 0.4) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 90%, 90%, ${alpha})`;
    ctx.fill();
  }
}

function drawNightParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  // 🌠 v9.0: 增强流星效果 - 更亮的尾迹
  const lifeRatio = p.life / p.maxLife;
  const fadeOpacity = p.opacity * Math.pow(lifeRatio, 0.5); // 更平滑的淡出
  
  // 绘制流星尾迹 - 渐变效果
  if (p.trail && p.trail.length > 1) {
    for (let i = 1; i < p.trail.length; i++) {
      const trailOpacity = (i / p.trail.length) * fadeOpacity * 0.6;
      const trailWidth = p.size * (i / p.trail.length) * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
      ctx.lineTo(p.trail[i].x, p.trail[i].y);
      ctx.strokeStyle = `hsla(${p.hue}, 90%, 70%, ${trailOpacity})`;
      ctx.lineWidth = trailWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }
  
  // 流星头部 - 更大更亮
  const headSize = p.size * 3;
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, headSize);
  gradient.addColorStop(0, `hsla(${p.hue}, 100%, 95%, ${fadeOpacity})`);  // 中心纯白
  gradient.addColorStop(0.2, `hsla(${p.hue}, 95%, 80%, ${fadeOpacity * 0.8})`);
  gradient.addColorStop(0.5, `hsla(${p.hue}, 85%, 65%, ${fadeOpacity * 0.4})`);
  gradient.addColorStop(1, `hsla(${p.hue}, 80%, 55%, 0)`);
  
  ctx.beginPath();
  ctx.arc(p.x, p.y, headSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 核心高亮
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${p.hue}, 100%, 98%, ${fadeOpacity})`;
  ctx.fill();
}

function draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    // 🖱️ P1: 鼠标斥力交互
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const interactionRadius = 120; // 感应半径
    
    if (distance < interactionRadius && distance > 0) {
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const force = (interactionRadius - distance) / interactionRadius;
      
      // 粒子受到推力
      const pushStrength = props.theme === "night" ? 3 : 2;
      p.x += forceDirectionX * force * pushStrength;
      p.y += forceDirectionY * force * pushStrength;
    }
    
    // 更新位置
    p.y += p.speedY;
    p.x += p.speedX;
    p.twinkle += 0.05;
    
    // 花瓣旋转
    if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
      p.rotation += p.rotationSpeed;
    }
    
    // 流星轨迹与生命值
    if (p.type === "meteor") {
      p.life--;
      if (p.trail) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();
      }
    }
    
    // 绘制
    if (props.theme === "morning") {
      // 清晨主题：统一使用清新风格绘制
      drawMorningParticle(ctx, p);
    } else {
      switch (p.type) {
        case "petal":
          drawMorningParticle(ctx, p);
          break;
        case "spark":
          drawSunsetParticle(ctx, p);
          break;
        case "meteor":
          drawNightParticle(ctx, p);
          break;
        case "firefly":
          drawFirefly(ctx, p);
          break;
      }
    }
    
    // 重置条件
    const needsReset = 
      (p.type === "meteor" && p.life <= 0) ||
      (p.type !== "meteor" && p.type !== "firefly" && p.y < -10) ||
      (p.type !== "firefly" && p.y > canvas.height + 10);
    
    // 萤火虫不需要重置，只是原地徘徊
    
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
  
  // 🖱️ P1: 鼠标交互监听
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseleave", onMouseLeave);
  
  if (props.active) {
    animate();
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseleave", onMouseLeave);
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
