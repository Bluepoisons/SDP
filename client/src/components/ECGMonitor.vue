<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { Activity } from "lucide-vue-next";

/**
 * 💓 ECGMonitor v9.0 - 实时心电图情绪监视器
 * Canvas 实时绘制 + 选择后动态变化
 * 
 * 状态映射：
 * - idle: 正常心跳 60-80 BPM
 * - analyzing: 快速扫描
 * - reacting: 根据好感度预测调整幅度
 * 
 * BPM 规则（根据好感度变化）：
 * - 0: 平稳 72 BPM
 * - ±1: 轻度 100 BPM
 * - ±2: 中度 140 BPM  
 * - ±3: 强烈 180 BPM
 */

interface ECGMonitorProps {
  state?: "idle" | "analyzing" | "reacting";
  emotionScore?: number;  // -3 ~ +3 好感度
  label?: string;
}

const props = withDefaults(defineProps<ECGMonitorProps>(), {
  state: "idle",
  emotionScore: 0,
  label: "EMOTION",
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const bpmDisplay = ref(72);

// 心电图参数
let animationId: number | null = null;
let dataPoints: number[] = [];
let phase = 0;
let targetAmplitude = 1;
let currentAmplitude = 1;
let reactionTimer: number | null = null;
let currentBpm = 72;
let targetBpm = 72;
let frameCount = 0;  // v9.0: 帧计数器用于降低更新频率
let displayBpm = 72; // v9.0: 显示用的 BPM（平滑变化）

// 根据好感度计算目标 BPM
const getTargetBpm = () => {
  if (props.state === "analyzing") return 95;
  const score = Math.abs(props.emotionScore);
  if (score === 0) return 72;
  if (score === 1) return 100;  // 轻度
  if (score === 2) return 140;  // 中度
  return 180;                    // 强烈 (±3)
};

// 波形颜色
const waveColor = computed(() => {
  if (props.state === "analyzing") return "#f59e0b";
  const score = props.emotionScore;
  if (score >= 2) return "#ec4899";   // 粉色 - 心动
  if (score <= -2) return "#ef4444";  // 红色 - 危机
  if (score >= 1) return "#22c55e";   // 绿色 - 正向
  if (score <= -1) return "#f97316";  // 橙色 - 负向
  return "#10b981";                    // 默认绿色
});

// 情绪标签
const emotionLabel = computed(() => {
  if (props.state === "analyzing") return "SCANNING...";
  const score = props.emotionScore;
  if (score >= 3) return "CRITICAL♡";
  if (score >= 2) return "HIGH_LOVE";
  if (score >= 1) return "POSITIVE";
  if (score <= -3) return "DANGER!!";
  if (score <= -2) return "CRITICAL";
  if (score <= -1) return "NEGATIVE";
  return "STABLE";
});

// Glitch 效果状态
const isGlitching = computed(() => Math.abs(props.emotionScore) >= 3);

// 生成心电图波形点 - 模拟真实 PQRST 波形
// v9.0: 调整幅度让波形在可见范围内
function generateECGPoint(t: number, amplitude: number): number {
  const baseY = 20; // 中线
  const cycle = t % 1;
  // 基础幅度缩放系数 - 降低让峰值不超出画布
  const scale = 0.4 * amplitude;
  
  if (cycle < 0.1) {
    // P 波 - 小的圆顶波
    return baseY - Math.sin(cycle * Math.PI / 0.1) * 3 * scale;
  } else if (cycle < 0.15) {
    // PR 段 - 平稳
    return baseY;
  } else if (cycle < 0.18) {
    // Q 波 - 小的向下尖峰
    return baseY + (cycle - 0.15) / 0.03 * 3 * scale;
  } else if (cycle < 0.25) {
    // R 波 - 大的向上尖峰 (主峰) - 降低高度
    const rProgress = (cycle - 0.18) / 0.07;
    if (rProgress < 0.5) {
      return baseY + 3 * scale - rProgress * 2 * 18 * scale;
    } else {
      return baseY - 15 * scale + (rProgress - 0.5) * 2 * 18 * scale;
    }
  } else if (cycle < 0.3) {
    // S 波 - 小的向下尖峰
    return baseY + (0.3 - cycle) / 0.05 * 4 * scale;
  } else if (cycle < 0.35) {
    // ST 段 - 回归基线
    return baseY;
  } else if (cycle < 0.5) {
    // T 波 - 圆顶波
    return baseY - Math.sin((cycle - 0.35) * Math.PI / 0.15) * 5 * scale;
  } else {
    // 等电位线
    return baseY;
  }
}

// 绘制心电图
function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // 清空画布
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, width, height);
  
  // v9.0: 大幅降低变化速度，模仿真实医院心电图
  // 幅度变化更缓慢
  currentAmplitude += (targetAmplitude - currentAmplitude) * 0.01;
  
  // BPM 变化极其缓慢（约 5-10 秒才完成过渡）
  targetBpm = getTargetBpm();
  currentBpm += (targetBpm - currentBpm) * 0.003;
  
  // v9.0: 标准心电图速度 - 25mm/s，每个心跳约 3cm 宽度
  // 降低整体速度，让波形更清晰可见
  const beatDuration = 60 / currentBpm; // 秒
  const speed = 1 / (beatDuration * 120); // 降低一半速度
  
  // 更新相位
  phase += speed;
  if (phase >= 1) phase -= 1;
  
  // v9.0: BPM 显示每 30 帧更新一次（约 0.5 秒）
  frameCount++;
  if (frameCount % 30 === 0) {
    // 缓慢过渡到目标值，添加轻微波动模拟真实心率
    displayBpm += (currentBpm - displayBpm) * 0.3;
    bpmDisplay.value = Math.round(displayBpm + (Math.random() - 0.5) * 2);
  }
  
  // 生成新数据点
  const newPoint = generateECGPoint(phase, currentAmplitude);
  dataPoints.push(newPoint);
  
  // 保持数据点数量
  const maxPoints = width;
  if (dataPoints.length > maxPoints) {
    dataPoints = dataPoints.slice(-maxPoints);
  }
  
  // 绘制波形
  ctx.beginPath();
  ctx.strokeStyle = waveColor.value;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  // 添加发光效果
  ctx.shadowColor = waveColor.value;
  ctx.shadowBlur = 8;
  
  for (let i = 0; i < dataPoints.length; i++) {
    const x = (i / maxPoints) * width;
    const y = dataPoints[i];
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  
  // 绘制扫描线
  const scanX = (dataPoints.length / maxPoints) * width;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.strokeStyle = waveColor.value;
  ctx.lineWidth = 2;
  ctx.moveTo(scanX, 0);
  ctx.lineTo(scanX, height);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // 绘制渐变遮罩（使旧数据淡出）
  const gradient = ctx.createLinearGradient(0, 0, width * 0.3, 0);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width * 0.3, height);
  
  animationId = requestAnimationFrame(draw);
}

// 触发反应动画
function triggerReaction(score: number) {
  const absScore = Math.abs(score);
  if (absScore === 0) {
    targetAmplitude = 1;
    return;
  }
  
  // 根据分数设置幅度
  if (absScore === 1) targetAmplitude = 1.3;      // 轻度
  else if (absScore === 2) targetAmplitude = 1.8; // 中度
  else targetAmplitude = 2.5;                      // 强烈
  
  // 3秒后恢复正常
  if (reactionTimer) clearTimeout(reactionTimer);
  reactionTimer = window.setTimeout(() => {
    targetAmplitude = 1;
  }, 3000);
}

// 监听情绪分数变化
watch(() => props.emotionScore, (newScore) => {
  triggerReaction(newScore);
}, { immediate: true });

// 监听状态变化
watch(() => props.state, (newState) => {
  if (newState === "analyzing") {
    targetAmplitude = 1.2;
  }
});

onMounted(() => {
  const canvas = canvasRef.value;
  if (canvas) {
    // 设置 Canvas 尺寸
    canvas.width = 140;
    canvas.height = 40;
    
    // 初始化数据点
    dataPoints = Array(canvas.width).fill(20);
    
    // 开始动画
    draw();
  }
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (reactionTimer) clearTimeout(reactionTimer);
});
</script>

<template>
  <div 
    class="ecg-monitor"
    :class="{ 
      'ecg-glitch': isGlitching,
      'ecg-analyzing': state === 'analyzing'
    }"
  >
    <!-- 标签 -->
    <div class="ecg-header">
      <Activity class="h-3 w-3" :style="{ color: waveColor }" />
      <span class="ecg-label">{{ props.label }}</span>
    </div>
    
    <!-- 波形 Canvas - 实时绘制 -->
    <div class="ecg-wave-container">
      <canvas ref="canvasRef" class="ecg-canvas" />
    </div>
    
    <!-- 状态信息 -->
    <div class="ecg-stats">
      <div class="ecg-bpm">
        <span class="bpm-value" :style="{ color: waveColor }">{{ bpmDisplay }}</span>
        <span class="bpm-unit">BPM</span>
      </div>
      <div class="ecg-status" :style="{ color: waveColor }">
        {{ emotionLabel }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ecg-monitor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 160px;
  backdrop-filter: blur(10px);
}

/* 头部 */
.ecg-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ecg-label {
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

/* 波形容器 */
.ecg-wave-container {
  position: relative;
  height: 40px;
  overflow: hidden;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.ecg-canvas {
  width: 100%;
  height: 100%;
}

/* 状态信息 */
.ecg-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ecg-bpm {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.bpm-value {
  font-size: 16px;
  font-family: var(--font-mono);
  font-weight: bold;
  line-height: 1;
}

.bpm-unit {
  font-size: 8px;
  font-family: var(--font-mono);
  color: rgba(255, 255, 255, 0.4);
}

.ecg-status {
  font-size: 8px;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

/* Glitch 效果 - 强烈情绪时 */
.ecg-glitch {
  animation: ecg-glitch-border 0.3s linear infinite;
}

@keyframes ecg-glitch-border {
  0%, 100% { 
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
  50% { 
    border-color: rgba(239, 68, 68, 0.6);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
  }
}

/* 分析中呼吸效果 */
.ecg-analyzing {
  animation: ecg-pulse 1s ease-in-out infinite;
}

@keyframes ecg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
