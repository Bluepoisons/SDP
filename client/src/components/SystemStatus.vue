<script setup lang="ts">
import { Settings, Wifi, WifiOff, Terminal } from 'lucide-vue-next';

/**
 * 🔧 系统状态区组件
 * 设置齿轮 + 连接状态指示灯
 * 位于 Sidebar 左下角
 */

interface SystemStatusProps {
  isConnected: boolean;
  modelName?: string;
  collapsed?: boolean;
}

const props = withDefaults(defineProps<SystemStatusProps>(), {
  isConnected: false,
  modelName: '未连接',
  collapsed: false,
});

const emit = defineEmits<{
  (e: 'openSettings'): void;
}>();
</script>

<template>
  <div class="system-status" :class="{ 'is-collapsed': collapsed }">
    <!-- 🔌 连接状态 -->
    <div class="status-indicator">
      <div class="status-dot" :class="isConnected ? 'is-online' : 'is-offline'">
        <component :is="isConnected ? Wifi : WifiOff" class="status-icon" />
      </div>
      <div v-if="!collapsed" class="status-text">
        <span class="status-label">{{ isConnected ? 'ONLINE' : 'OFFLINE' }}</span>
        <span class="model-name">{{ modelName }}</span>
      </div>
    </div>
    
    <!-- ⚙️ 设置按钮 -->
    <button 
      class="settings-btn"
      :class="{ 'is-collapsed': collapsed }"
      @click="emit('openSettings')"
      title="系统设置"
    >
      <div class="gear-ring"></div>
      <Settings class="gear-icon" />
      <span v-if="!collapsed" class="btn-label">CONFIG</span>
    </button>
  </div>
</template>

<style scoped>
.system-status {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--input-panel-border);
  transition: all 0.3s ease;
}

.system-status.is-collapsed {
  align-items: center;
  padding: 0.5rem;
}

/* 🔌 连接状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.status-dot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.is-online {
  background: rgba(16, 185, 129, 0.2);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
}

.status-dot.is-offline {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
}

.status-dot.is-online::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: status-pulse 2s ease-in-out infinite;
  background: rgba(16, 185, 129, 0.3);
}

@keyframes status-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0; }
}

.status-icon {
  width: 14px;
  height: 14px;
  color: currentColor;
}

.status-dot.is-online .status-icon {
  color: #10b981;
}

.status-dot.is-offline .status-icon {
  color: #ef4444;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.status-label {
  font-family: var(--font-tech);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--accent-color);
}

.model-name {
  font-family: var(--font-tech);
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  color: var(--bubble-text);
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

/* ⚙️ 设置按钮 */
.settings-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--input-panel-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--bubble-text);
  overflow: hidden;
}

.settings-btn.is-collapsed {
  padding: 0.5rem;
  justify-content: center;
}

.settings-btn:hover {
  background: var(--btn-primary-hover);
  border-color: var(--accent-color);
  box-shadow: 0 0 15px var(--glow-color);
}

.settings-btn:active {
  transform: scale(0.95) translateY(2px);
}

/* 🔄 齿轮动效 */
.gear-ring {
  position: absolute;
  inset: -50%;
  border: 1px dashed var(--accent-color);
  border-radius: 50%;
  opacity: 0;
  transition: all 0.5s ease;
}

.settings-btn:hover .gear-ring {
  opacity: 0.3;
  animation: gear-rotate 8s linear infinite;
}

@keyframes gear-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.gear-icon {
  width: 18px;
  height: 18px;
  color: var(--accent-color);
  transition: transform 0.5s ease;
  flex-shrink: 0;
}

.settings-btn:hover .gear-icon {
  transform: rotate(180deg);
}

.btn-label {
  font-family: var(--font-tech);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* 💗 心跳模式 */
:global(body.theme-heartbeat) .settings-btn {
  border-radius: 9999px;
}

:global(body.theme-heartbeat) .status-dot.is-online {
  background: rgba(236, 72, 153, 0.2);
  box-shadow: 0 0 12px rgba(236, 72, 153, 0.5);
}

:global(body.theme-heartbeat) .status-dot.is-online .status-icon {
  color: #ec4899;
}

:global(body.theme-heartbeat) .status-dot.is-online::before {
  background: rgba(236, 72, 153, 0.3);
}
</style>
