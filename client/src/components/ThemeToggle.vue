<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Waves, Heart } from 'lucide-vue-next';

/**
 * 🌀 世界线切换器 v6.0
 * 深潜 (Deep Dive) ↔ 心跳 (Heartbeat)
 */

const isHeartbeat = ref(false);
const isTransitioning = ref(false);

const toggleTheme = async () => {
  if (isTransitioning.value) return;
  
  isTransitioning.value = true;
  
  // 🌀 触发 Glitch 转场
  document.body.classList.add('world-shift-active');
  
  // 等待动画
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 切换主题
  isHeartbeat.value = !isHeartbeat.value;
  document.body.classList.toggle('theme-heartbeat', isHeartbeat.value);
  
  // 保存到 localStorage
  localStorage.setItem('theme', isHeartbeat.value ? 'heartbeat' : 'deepdive');
  
  // 移除转场效果
  await new Promise(resolve => setTimeout(resolve, 200));
  document.body.classList.remove('world-shift-active');
  isTransitioning.value = false;
};

onMounted(() => {
  // 读取用户偏好
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'heartbeat') {
    isHeartbeat.value = true;
    document.body.classList.add('theme-heartbeat');
  }
});
</script>

<template>
  <button
    class="world-toggle group"
    :class="{ 'is-transitioning': isTransitioning }"
    @click="toggleTheme"
    :title="isHeartbeat ? '切换到【深潜】模式' : '切换到【心跳】模式'"
  >
    <!-- 外圈装饰 -->
    <div class="toggle-ring"></div>
    
    <!-- 图标 -->
    <Transition name="glitch" mode="out-in">
      <Waves v-if="!isHeartbeat" class="toggle-icon text-cyan-400" />
      <Heart v-else class="toggle-icon text-pink-500 fill-current" />
    </Transition>
    
    <!-- 模式标签 -->
    <span class="toggle-label">
      {{ isHeartbeat ? 'HEARTBEAT' : 'DEEP_DIVE' }}
    </span>
  </button>
</template>

<style scoped>
.world-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--input-panel-bg);
  border: 1px solid var(--input-panel-border);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 50;
  transform: skewX(var(--skew-angle-subtle));
}

.world-toggle > * {
  transform: skewX(calc(var(--skew-angle-subtle) * -1));
}

:global(body.theme-heartbeat) .world-toggle {
  transform: skewX(0);
  border-radius: 9999px;
}

:global(body.theme-heartbeat) .world-toggle > * {
  transform: skewX(0);
}

.world-toggle:hover {
  box-shadow: 0 0 20px var(--glow-color);
  border-color: var(--accent-color);
}

.world-toggle.is-transitioning {
  pointer-events: none;
  animation: glitch-shake 0.3s ease;
}

@keyframes glitch-shake {
  0%, 100% { transform: skewX(var(--skew-angle-subtle)) translateX(0); }
  20% { transform: skewX(var(--skew-angle-subtle)) translateX(-3px); }
  40% { transform: skewX(var(--skew-angle-subtle)) translateX(3px); }
  60% { transform: skewX(var(--skew-angle-subtle)) translateX(-2px); }
  80% { transform: skewX(var(--skew-angle-subtle)) translateX(2px); }
}

.toggle-ring {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 1px solid var(--accent-color);
  opacity: 0;
  transition: opacity 0.3s;
}

.world-toggle:hover .toggle-ring {
  opacity: 0.5;
  animation: border-breathe 2s ease-in-out infinite;
}

.toggle-icon {
  width: 1rem;
  height: 1rem;
  transition: all 0.3s;
}

.toggle-label {
  font-family: var(--font-tech);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--accent-color);
  opacity: 0.8;
}

/* Glitch 转场动画 */
.glitch-enter-active,
.glitch-leave-active {
  transition: all 0.15s ease;
}

.glitch-enter-from {
  opacity: 0;
  transform: translateY(-5px) scale(0.8);
  filter: blur(4px);
}

.glitch-leave-to {
  opacity: 0;
  transform: translateY(5px) scale(0.8);
  filter: blur(4px);
}
</style>