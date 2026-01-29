<script setup lang="ts">
import { ref } from 'vue';
import { Heart } from 'lucide-vue-next';

/**
 * 💠 Gal-chat 品牌 Logo 组件
 * 图片 + 斜体文字 + 像素爱心 + 中二副标题
 */

interface LogoProps {
  collapsed?: boolean;
}

defineProps<LogoProps>();

// 图片加载失败时的后备
const imgError = ref(false);
const handleImgError = () => {
  imgError.value = true;
};
</script>

<template>
  <div class="gal-logo" :class="{ 'is-collapsed': collapsed }">
    <!-- 🖼️ App Icon -->
    <div class="logo-icon-wrap">
      <!-- 有图片时显示 -->
      <img 
        v-if="!imgError"
        src="/images/avatar.png" 
        alt="Gal-chat" 
        class="logo-icon"
        @error="handleImgError"
      />
      <!-- 图片缺失时的后备图标 -->
      <div v-else class="logo-icon-fallback">
        <Heart class="fallback-icon" />
      </div>
      <!-- 在线状态环 -->
      <div class="status-ring"></div>
    </div>
    
    <!-- 📝 品牌文字 (仅展开时显示) -->
    <div v-if="!collapsed" class="logo-text-wrap">
      <h1 class="logo-title">
        <span class="title-gal">Gal</span>
        <span class="title-heart">♥</span>
        <span class="title-chat">chat</span>
      </h1>
      <p class="logo-subtitle">NEURAL LINK SYSTEM v3.0</p>
    </div>
  </div>
</template>

<style scoped>
.gal-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--input-panel-border);
  transition: all 0.3s ease;
}

.gal-logo:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-color);
  box-shadow: 0 0 20px var(--glow-color);
}

.gal-logo.is-collapsed {
  justify-content: center;
  padding: 0.5rem;
}

/* 🖼️ 图标容器 */
.logo-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid var(--accent-color);
  box-shadow: 0 0 15px var(--glow-color);
  transition: all 0.3s ease;
}

.gal-logo:hover .logo-icon {
  transform: scale(1.05);
  box-shadow: 0 0 25px var(--glow-strong);
}

/* 后备图标样式 */
.logo-icon-fallback {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid var(--accent-color);
  background: linear-gradient(135deg, var(--btn-primary-from), var(--btn-primary-to));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px var(--glow-color);
  transition: all 0.3s ease;
}

.fallback-icon {
  width: 24px;
  height: 24px;
  color: white;
  fill: currentColor;
  animation: heartbeat 1.5s ease-in-out infinite;
}

.gal-logo:hover .logo-icon-fallback {
  transform: scale(1.05);
  box-shadow: 0 0 25px var(--glow-strong);
}

/* 💚 状态环 */
.status-ring {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #10b981, #34d399);
  border-radius: 50%;
  border: 2px solid var(--bg-primary);
  animation: pulse-ring 2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
}

/* 📝 文字区域 */
.logo-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.logo-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.02em;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0;
}

.title-gal {
  color: var(--accent-color);
  text-shadow: 0 0 10px var(--glow-color);
}

.title-heart {
  color: #ec4899;
  font-size: 0.85em;
  animation: heartbeat 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.8));
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2); }
  35% { transform: scale(1); }
  45% { transform: scale(1.15); }
  55% { transform: scale(1); }
}

.title-chat {
  color: var(--bubble-text);
}

/* 🔧 副标题 */
.logo-subtitle {
  font-family: var(--font-tech);
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent-secondary);
  opacity: 0.7;
  margin: 0;
  white-space: nowrap;
}

/* 💗 心跳模式适配 */
:global(body.theme-heartbeat) .logo-icon,
:global(body.theme-heartbeat) .logo-icon-fallback {
  border-color: var(--accent-color);
}

:global(body.theme-heartbeat) .status-ring {
  background: linear-gradient(135deg, #ec4899, #f472b6);
}

:global(body.theme-heartbeat) .title-gal {
  color: var(--accent-color);
}

:global(body.theme-heartbeat) .title-heart {
  color: #ec4899;
}
</style>
