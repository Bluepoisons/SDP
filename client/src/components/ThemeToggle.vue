<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

/**
 * 🌀 世界线变动开关 (Divergence Meter) v7.0
 * 
 * 设计灵感: 《命运石之门》世界线变动率计
 * 功能: Deep Dive (深潜/赛博) ↔ Heartbeat (心跳/恋爱)
 * 技术: 纯 CSS 变量切换，无动态 CSS 加载
 */

const isHeartbeat = ref(false);
const isTransitioning = ref(false);

// 🎲 世界线变动率 (装饰性数字)
const divergenceNumber = computed(() => {
  return isHeartbeat.value ? '1.048596' : '0.571024';
});

const toggleTheme = async () => {
  if (isTransitioning.value) return;
  
  isTransitioning.value = true;
  
  // 🌀 Phase 1: 触发 Glitch 全屏特效
  document.body.classList.add('world-shift-active');
  
  // 等待 Glitch 动画高潮
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 🔄 Phase 2: 切换主题 (使用 CSS 变量，无文件加载)
  isHeartbeat.value = !isHeartbeat.value;
  
  // 使用 data-theme 属性 (更符合现代规范)
  document.documentElement.setAttribute('data-theme', isHeartbeat.value ? 'heartbeat' : 'deepdive');
  document.body.classList.toggle('theme-heartbeat', isHeartbeat.value);
  
  // 持久化用户偏好
  localStorage.setItem('gal-theme', isHeartbeat.value ? 'heartbeat' : 'deepdive');
  
  // 🌀 Phase 3: 移除转场效果
  await new Promise(resolve => setTimeout(resolve, 200));
  document.body.classList.remove('world-shift-active');
  isTransitioning.value = false;
};

onMounted(() => {
  // 读取用户偏好 (不报警告)
  const savedTheme = localStorage.getItem('gal-theme');
  if (savedTheme === 'heartbeat') {
    isHeartbeat.value = true;
    document.documentElement.setAttribute('data-theme', 'heartbeat');
    document.body.classList.add('theme-heartbeat');
  } else {
    document.documentElement.setAttribute('data-theme', 'deepdive');
  }
});
</script>

<template>
  <button
    class="divergence-toggle group"
    :class="{ 'is-transitioning': isTransitioning, 'mode-heartbeat': isHeartbeat }"
    @click="toggleTheme"
    :title="isHeartbeat ? '世界线跳跃：切换到【深潜】' : '世界线跳跃：切换到【心跳】'"
    :aria-label="isHeartbeat ? '切换到深潜模式' : '切换到心跳模式'"
  >
    <!-- 🔮 外层：旋转边框环 -->
    <div class="toggle-outer-ring"></div>
    
    <!-- 📟 世界线变动率显示 -->
    <div class="divergence-display">
      <span class="divergence-number">{{ divergenceNumber }}</span>
      <span class="divergence-unit">%</span>
    </div>
    
    <!-- 🏷️ 模式标签 -->
    <span class="mode-label">
      {{ isHeartbeat ? 'β世界线' : 'α世界线' }}
    </span>
    
    <!-- ⚡ Glitch 装饰线 -->
    <div class="glitch-lines">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </button>
</template>

<style scoped>
/* 🌀 世界线变动开关 - 命运石之门风格 */
.divergence-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  overflow: hidden;
  transform: skewX(var(--skew-angle-subtle, -6deg));
}

.divergence-toggle > * {
  transform: skewX(calc(var(--skew-angle-subtle, -6deg) * -1));
}

/* 心跳模式：圆润 */
.divergence-toggle.mode-heartbeat {
  transform: skewX(0);
  border-radius: 16px;
  border-color: var(--accent-color);
}

.divergence-toggle.mode-heartbeat > * {
  transform: skewX(0);
}

/* 🔮 外圈旋转环 */
.toggle-outer-ring {
  position: absolute;
  inset: -4px;
  border: 2px dashed var(--accent-color);
  border-radius: inherit;
  opacity: 0.2;
  pointer-events: none;
}

.divergence-toggle:hover .toggle-outer-ring {
  opacity: 0.5;
  animation: ring-rotate 10s linear infinite;
}

@keyframes ring-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 📟 世界线变动率 */
.divergence-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.divergence-number {
  font-family: var(--font-tech, 'Rajdhani', monospace);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--accent-color);
  text-shadow: 0 0 10px var(--glow-color);
  transition: all 0.3s ease;
}

.divergence-unit {
  font-family: var(--font-tech);
  font-size: 0.7rem;
  color: var(--accent-secondary);
  opacity: 0.7;
}

/* 🏷️ 模式标签 */
.mode-label {
  font-family: var(--font-tech);
  font-size: 0.55rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--bubble-text);
  opacity: 0.6;
}

/* ⚡ Glitch 装饰线 */
.glitch-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
}

.glitch-lines span {
  position: absolute;
  width: 100%;
  height: 1px;
  background: var(--accent-color);
  left: 0;
}

.glitch-lines span:nth-child(1) { top: 20%; }
.glitch-lines span:nth-child(2) { top: 50%; }
.glitch-lines span:nth-child(3) { top: 80%; }

/* Hover 效果 */
.divergence-toggle:hover {
  box-shadow: 0 0 25px var(--glow-color);
  border-color: var(--glow-strong);
}

.divergence-toggle:hover .divergence-number {
  text-shadow: 0 0 20px var(--glow-strong);
}

/* Active 物理反馈 */
.divergence-toggle:active {
  transform: skewX(var(--skew-angle-subtle, -6deg)) scale(0.95) translateY(2px);
}

.divergence-toggle.mode-heartbeat:active {
  transform: scale(0.95) translateY(2px);
}

/* 🌀 转场中状态 */
.divergence-toggle.is-transitioning {
  pointer-events: none;
  animation: glitch-shift 0.3s steps(3) infinite;
}

.divergence-toggle.is-transitioning .glitch-lines {
  opacity: 1;
}

.divergence-toggle.is-transitioning .glitch-lines span {
  animation: glitch-line 0.1s steps(2) infinite;
}

@keyframes glitch-shift {
  0%, 100% { 
    transform: skewX(var(--skew-angle-subtle, -6deg)) translateX(0);
    filter: hue-rotate(0deg);
  }
  33% { 
    transform: skewX(var(--skew-angle-subtle, -6deg)) translateX(-3px);
    filter: hue-rotate(90deg);
  }
  66% { 
    transform: skewX(var(--skew-angle-subtle, -6deg)) translateX(3px);
    filter: hue-rotate(-90deg);
  }
}

@keyframes glitch-line {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>