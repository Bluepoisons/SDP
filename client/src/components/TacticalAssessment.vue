<script setup lang="ts">
import { computed } from 'vue';
import { Shield, TrendingUp, AlertCircle } from 'lucide-vue-next';

/**
 * 🎯 v12.0: 战术评估条
 * 为每个AI生成的选项添加"成功率预测"
 * 参考《蔚蓝档案》的战术推演系统
 */

interface TacticalAssessmentProps {
  successRate: number; // 0-100
  riskLevel?: 'safe' | 'moderate' | 'critical'; // 风险等级
  riskTag?: string; // 风险标签，如"保守策略"、"激进策略"、"整活"
}

const props = withDefaults(defineProps<TacticalAssessmentProps>(), {
  riskLevel: 'moderate',
  riskTag: '战术方案'
});

// 根据成功率计算风险等级
const computedRiskLevel = computed(() => {
  if (props.successRate >= 80) return 'safe';
  if (props.successRate >= 40) return 'moderate';
  return 'critical';
});

// 风险等级的显示名称和颜色
const riskConfig = computed(() => {
  const config: Record<string, { name: string; color: string; bgColor: string; icon: any }> = {
    safe: {
      name: '低风险',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      icon: Shield
    },
    moderate: {
      name: '中等风险',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      icon: TrendingUp
    },
    critical: {
      name: '高风险',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      icon: AlertCircle
    }
  };
  return config[computedRiskLevel.value];
});
</script>

<template>
  <div class="tactical-assessment">
    <!-- 📊 成功率进度条 -->
    <div class="probability-container">
      <div class="probability-bar">
        <div 
          class="probability-fill"
          :style="{ 
            width: `${successRate}%`,
            backgroundColor: riskConfig.color
          }"
        >
          <!-- ✨ 动画光辉 -->
          <div class="probability-glow"></div>
        </div>
      </div>
      <span class="probability-text" :style="{ color: riskConfig.color }">
        SUCCESS RATE: {{ successRate }}%
      </span>
    </div>

    <!-- 🎯 风险评估标签 -->
    <div class="risk-assessment">
      <div 
        class="risk-tag"
        :style="{ backgroundColor: riskConfig.bgColor, borderColor: riskConfig.color }"
      >
        <component :is="riskConfig.icon" class="risk-icon" :style="{ color: riskConfig.color }" />
        <span class="risk-name">{{ riskConfig.name }}</span>
      </div>
      <div class="risk-description">
        <span class="risk-label">{{ riskTag }}</span>
      </div>
    </div>

    <!-- 💡 战术建议提示 -->
    <div v-if="successRate < 50" class="tactical-hint">
      <AlertCircle class="hint-icon" />
      <span class="hint-text">⚠️ 高风险选项，谨慎使用</span>
    </div>
  </div>
</template>

<style scoped>
.tactical-assessment {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

/* 📊 成功率进度条 */
.probability-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.probability-bar {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.probability-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

/* ✨ 进度条光辉特效 */
.probability-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.probability-text {
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: color 0.3s ease;
}

/* 🎯 风险评估 */
.risk-assessment {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.risk-tag {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid;
  transition: all 0.3s ease;
}

.risk-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.risk-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.risk-name {
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.risk-description {
  flex: 1;
  text-align: right;
}

.risk-label {
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

/* 💡 战术建议 */
.tactical-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border-left: 2px solid #ef4444;
  border-radius: 4px;
  animation: warningPulse 2s ease-in-out infinite;
}

@keyframes warningPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.hint-icon {
  width: 14px;
  height: 14px;
  color: #ef4444;
  flex-shrink: 0;
}

.hint-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.65rem;
  color: #fecaca;
  font-weight: 500;
}

/* 🌙 夜晚模式增强 */
:global(body.theme-night) .tactical-assessment {
  border-color: rgba(0, 255, 255, 0.1);
}

:global(body.theme-sunset) .tactical-assessment {
  border-color: rgba(255, 182, 193, 0.1);
}
</style>
