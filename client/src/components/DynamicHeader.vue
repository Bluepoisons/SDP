<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle, AlertCircle, Zap } from 'lucide-vue-next';

/**
 * 🎯 v12.0: 动态危险等级页眉
 * 基于情感分数实时反映角色状态
 * 参考《蔚蓝档案》的战术指挥UI
 */

interface DynamicHeaderProps {
  emotionScore?: number;      // 0-100 (角色情绪)
  characterName?: string;     // 角色名
  lastAction?: string;        // 最后操作
  isThinking?: boolean;       // 正在思考
}

const props = withDefaults(defineProps<DynamicHeaderProps>(), {
  emotionScore: 50,
  characterName: '神经链接',
  lastAction: 'SYSTEM READY',
  isThinking: false
});

// 根据情感分数计算危险等级
const threatLevel = computed(() => {
  const score = props.emotionScore ?? 50;
  
  if (score >= 80) return 'critical';    // 极端 (红色)
  if (score >= 60) return 'warning';     // 警告 (黄色)
  return 'safe';                         // 安全 (蓝色)
});

// 威胁等级配置
const threatConfig = computed(() => {
  const config: Record<string, {
    label: string;
    icon: any;
    color: string;
    bgColor: string;
    glowColor: string;
    pulse: boolean;
  }> = {
    safe: {
      label: '安全',
      icon: AlertCircle,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      glowColor: 'rgba(6, 182, 212, 0.2)',
      pulse: false
    },
    warning: {
      label: '警告',
      icon: AlertTriangle,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      pulse: true
    },
    critical: {
      label: '极端',
      icon: Zap,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      glowColor: 'rgba(239, 68, 68, 0.3)',
      pulse: true
    }
  };
  return config[threatLevel.value];
});

// 格式化情感分数为百分比条
const scoreBar = computed(() => {
  const score = Math.max(0, Math.min(100, props.emotionScore ?? 50));
  return Math.round(score);
});

// 情感描述文本
const emotionLabel = computed(() => {
  const score = props.emotionScore ?? 50;
  if (score >= 90) return '爆发!';
  if (score >= 75) return '非常激动';
  if (score >= 60) return '激动';
  if (score >= 45) return '平静';
  if (score >= 30) return '冷淡';
  if (score >= 15) return '非常冷淡';
  return '冰冷!';
});
</script>

<template>
  <div 
    class="dynamic-header"
    :class="`threat-${threatLevel}`"
  >
    <!-- 🌊 背景发光效果 -->
    <div 
      class="glow-background"
      :style="{ boxShadow: `inset 0 0 30px ${threatConfig.glowColor}` }"
    ></div>

    <!-- 📡 顶部状态栏 -->
    <div class="header-top">
      <!-- 左侧：角色名与状态 -->
      <div class="status-section">
        <div class="character-name">
          <span class="label">TARGET</span>
          <span class="value">{{ characterName }}</span>
        </div>
        <div class="last-action">
          <span class="label">STATUS</span>
          <span class="value">{{ lastAction }}</span>
        </div>
      </div>

      <!-- 中央：思考指示器 -->
      <div v-if="isThinking" class="thinking-indicator">
        <div class="thinking-dot"></div>
        <span class="thinking-text">ANALYZING...</span>
      </div>

      <!-- 右侧：威胁等级 -->
      <div class="threat-indicator">
        <component :is="threatConfig.icon" class="threat-icon" />
        <span class="threat-label">{{ threatConfig.label }}</span>
      </div>
    </div>

    <!-- 📊 中央：情感条与分数 -->
    <div class="emotion-section">
      <div class="emotion-bar-container">
        <!-- 背景轨道 -->
        <div class="bar-track">
          <!-- 渐进填充 -->
          <div 
            class="bar-fill"
            :style="{ 
              width: `${scoreBar}%`,
              backgroundColor: threatConfig.color
            }"
          >
            <!-- 动画光晕 -->
            <div class="bar-glow"></div>
          </div>
        </div>

        <!-- 分数标签 -->
        <div class="score-label">
          <span class="current-score">{{ scoreBar }}</span>
          <span class="max-score">/100</span>
        </div>
      </div>

      <!-- 情感描述 -->
      <div class="emotion-description">
        <span class="emotion-text">{{ emotionLabel }}</span>
        <span class="emotion-type" :style="{ color: threatConfig.color }">
          {{ `[${threatConfig.label}]` }}
        </span>
      </div>
    </div>

    <!-- 🎯 底部：细节指示器 -->
    <div class="header-bottom">
      <div class="detail-item">
        <span class="detail-label">RELATION</span>
        <div class="detail-bar">
          <div class="detail-fill" :style="{ width: `${scoreBar}%` }"></div>
        </div>
      </div>

      <div class="detail-item">
        <span class="detail-label">STABILITY</span>
        <div class="detail-bar">
          <div 
            class="detail-fill" 
            :style="{ width: `${100 - scoreBar}%` }"
          ></div>
        </div>
      </div>

      <div class="detail-item">
        <span class="detail-label">SYNC</span>
        <div class="sync-indicator" :class="{ active: !isThinking }"></div>
      </div>
    </div>

    <!-- ⚠️ 警告横幅（仅在 critical 时显示） -->
    <transition name="warning-flash">
      <div v-if="threatLevel === 'critical'" class="warning-banner">
        <span class="warning-text">⚠️ EMOTIONAL OVERFLOW DETECTED ⚠️</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dynamic-header {
  position: relative;
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-top: none;
  padding: 1rem 1.5rem;
  padding-bottom: 1.25rem;
  margin-bottom: 0.75rem;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

/* 🌊 背景发光 */
.glow-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* 📡 顶部状态栏 */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.status-section {
  display: flex;
  gap: 1.5rem;
}

.character-name,
.last-action {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(148, 163, 184, 0.6);
  text-transform: uppercase;
}

.value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
}

/* 🧠 思考指示器 */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(129, 140, 248, 0.9);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  background: #818cf8;
  border-radius: 50%;
  animation: thinking-pulse 1s ease-in-out infinite;
}

@keyframes thinking-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

/* 🚨 威胁指示器 */
.threat-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid;
  transition: all 0.3s ease;
}

.threat-icon {
  width: 16px;
  height: 16px;
}

.threat-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* 威胁等级颜色 */
.threat-safe .threat-indicator {
  border-color: rgba(6, 182, 212, 0.3);
  color: #06b6d4;
}

.threat-warning .threat-indicator {
  border-color: rgba(245, 158, 11, 0.4);
  color: #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
}

.threat-critical .threat-indicator {
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.3);
  animation: threat-pulse 1s ease-in-out infinite;
}

@keyframes threat-pulse {
  0%, 100% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 24px rgba(239, 68, 68, 0.5); }
}

/* 📊 情感条 */
.emotion-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.emotion-bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: rgba(51, 65, 85, 0.6);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.bar-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: bar-shimmer 2s infinite;
}

@keyframes bar-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.score-label {
  display: flex;
  gap: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #f1f5f9;
  min-width: 3.5rem;
  text-align: right;
}

.max-score {
  color: rgba(148, 163, 184, 0.5);
  font-weight: 400;
}

/* 情感描述 */
.emotion-description {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
  min-width: 6rem;
}

.emotion-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e2e8f0;
}

.emotion-type {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* 🎯 底部细节指示器 */
.header-bottom {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  position: relative;
  z-index: 1;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.detail-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(148, 163, 184, 0.6);
  text-transform: uppercase;
  min-width: 4rem;
}

.detail-bar {
  flex: 1;
  height: 4px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.detail-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #0ea5e9);
  transition: width 0.6s ease;
}

.sync-indicator {
  width: 8px;
  height: 8px;
  background: rgba(107, 114, 128, 0.5);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.sync-indicator.active {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  animation: sync-pulse 1.5s ease-in-out infinite;
}

@keyframes sync-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
  50% { box-shadow: 0 0 12px rgba(16, 185, 129, 0.8); }
}

/* ⚠️ 警告横幅 */
.warning-banner {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
  border-top: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.5rem;
  text-align: center;
  animation: warning-slide-up 0.3s ease-out;
}

@keyframes warning-slide-up {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.warning-text {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #fca5a5;
  text-transform: uppercase;
  animation: warning-blink 1s ease-in-out infinite;
}

@keyframes warning-blink {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* 🎬 过渡动画 */
.warning-flash-enter-active,
.warning-flash-leave-active {
  transition: all 0.3s ease;
}

.warning-flash-enter-from,
.warning-flash-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 🌙 暗色主题 */
:global(body.theme-night) .dynamic-header {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 25, 0.95));
  border-color: rgba(6, 182, 212, 0.15);
}

:global(body.theme-sunset) .dynamic-header {
  background: linear-gradient(180deg, rgba(25, 30, 40, 0.95), rgba(15, 20, 30, 0.95));
  border-color: rgba(245, 158, 11, 0.15);
}

/* 📱 响应式设计 */
@media (max-width: 768px) {
  .dynamic-header {
    padding: 0.75rem 1rem;
    padding-bottom: 1rem;
  }

  .header-top {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .status-section {
    width: 100%;
    justify-content: space-between;
  }

  .emotion-section {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .emotion-bar-container {
    width: 100%;
  }

  .header-bottom {
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  .detail-item {
    gap: 0.5rem;
  }
}
</style>
