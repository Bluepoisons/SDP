<script setup lang="ts">
import { computed } from "vue";
import { useUiSettings } from "@/stores/useUiSettings";

/**
 * 🔄 ThemeCycleButton v4.0 - 时间轮盘切换按钮
 * 
 * 点击循环：Morning (☀️) → Sunset (🌆) → Night (🌙) → Morning...
 */

const uiSettings = useUiSettings();

// 直接计算主题图标
const themeIcon = computed(() => {
  switch (uiSettings.theme) {
    case "morning": return "☀️";
    case "sunset": return "🌆";
    case "night": return "🌙";
    default: return "🌆";
  }
});

const currentTheme = computed(() => uiSettings.theme);

// 主题对应的提示文字
const themeHint = computed(() => {
  switch (currentTheme.value) {
    case "morning": return "点击切换至黄昏";
    case "sunset": return "点击切换至深夜";
    case "night": return "点击切换至清晨";
    default: return "切换主题";
  }
});

// 时间轮盘顺序
const THEME_CYCLE = ["morning", "sunset", "night"] as const;
type ThemeMode = typeof THEME_CYCLE[number];

const handleClick = () => {
  const currentIndex = THEME_CYCLE.indexOf(uiSettings.theme as ThemeMode);
  const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
  
  // 直接更新 state 和 DOM
  uiSettings.$patch({ theme: nextTheme });
  document.body.classList.remove("theme-morning", "theme-sunset", "theme-night");
  document.body.classList.add(`theme-${nextTheme}`);
};
</script>

<template>
  <button
    class="theme-cycle-btn"
    :class="`theme-${currentTheme}`"
    :title="themeHint"
    @click="handleClick"
  >
    <span class="icon-wrapper">{{ themeIcon }}</span>
    
    <!-- 光晕效果 -->
    <span class="glow-ring"></span>
  </button>
</template>

<style scoped>
.theme-cycle-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--card-bg, rgba(15, 23, 42, 0.8));
  border: 1px solid var(--card-border, rgba(34, 211, 238, 0.2));
  backdrop-filter: blur(12px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 100;
  box-shadow: var(--card-shadow, 0 4px 20px rgba(0, 0, 0, 0.3));
  overflow: hidden;
}

.icon-wrapper {
  font-size: 1.4rem;
  z-index: 2;
  transition: transform 0.3s ease;
}

.glow-ring {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    var(--accent-color, #22d3ee) 10%,
    transparent 20%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: rotate-glow 3s linear infinite paused;
}

@keyframes rotate-glow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.theme-cycle-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 0 30px var(--glow-color, rgba(34, 211, 238, 0.5));
}

.theme-cycle-btn:hover .icon-wrapper {
  transform: rotate(20deg) scale(1.1);
}

.theme-cycle-btn:hover .glow-ring {
  opacity: 0.6;
  animation-play-state: running;
}

.theme-cycle-btn:active {
  transform: scale(0.95);
}

/* 主题特定样式 */
.theme-cycle-btn.theme-morning {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(14, 165, 233, 0.3);
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.2);
}

.theme-cycle-btn.theme-morning:hover {
  box-shadow: 0 0 30px rgba(14, 165, 233, 0.4);
}

.theme-cycle-btn.theme-sunset {
  background: rgba(30, 10, 60, 0.8);
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
}

.theme-cycle-btn.theme-sunset:hover {
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
}

.theme-cycle-btn.theme-night {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(34, 211, 238, 0.3);
  box-shadow: 0 4px 20px rgba(34, 211, 238, 0.2);
}

.theme-cycle-btn.theme-night:hover {
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.5);
}
</style>
