<script setup lang="ts">
import { ref, computed } from "vue";
import { Flame, Sparkles, CloudFog, Heart } from "lucide-vue-next";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";

/**
 * 🎯 TacticalIntent v8.1 - 四选一战术意图按钮组
 * 
 * 「直出+热修」模式的核心组件：
 * - 默认不选中 → 系统自动推理最佳策略
 * - 用户主动点击 → 强制使用该战术意图
 * 
 * 四种战术意图：
 * 1. 高压威慑 (PRESSURE)    - 施压、强势、主导
 * 2. 示弱诱敌 (LURE)        - 撒娇、卖惨、让对方心软
 * 3. 模糊试探 (PROBE)       - 不正面回应、话里有话
 * 4. 情绪安抚 (COMFORT)     - 共情、理解、陪伴
 */

export type TacticalIntentType = 'PRESSURE' | 'LURE' | 'PROBE' | 'COMFORT' | null;

interface TacticalIntentProps {
  modelValue: TacticalIntentType;
  disabled?: boolean;
}

const props = withDefaults(defineProps<TacticalIntentProps>(), {
  modelValue: null,
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: TacticalIntentType): void;
}>();

const intents = [
  {
    value: 'PRESSURE' as const,
    label: '高压威慑',
    short: '威慑',
    icon: Flame,
    color: 'from-red-500 to-orange-500',
    hoverColor: 'hover:bg-red-500/20',
    activeColor: 'bg-red-500/30 border-red-400',
    ringColor: 'ring-red-500/50',
    description: '施压主导，强势输出',
    emoji: '🔥',
  },
  {
    value: 'LURE' as const,
    label: '示弱诱敌',
    short: '示弱',
    icon: Sparkles,
    color: 'from-pink-400 to-rose-400',
    hoverColor: 'hover:bg-pink-500/20',
    activeColor: 'bg-pink-500/30 border-pink-400',
    ringColor: 'ring-pink-500/50',
    description: '撒娇卖萌，引发保护欲',
    emoji: '✨',
  },
  {
    value: 'PROBE' as const,
    label: '模糊试探',
    short: '试探',
    icon: CloudFog,
    color: 'from-purple-400 to-indigo-400',
    hoverColor: 'hover:bg-purple-500/20',
    activeColor: 'bg-purple-500/30 border-purple-400',
    ringColor: 'ring-purple-500/50',
    description: '话里有话，不正面回应',
    emoji: '🌫️',
  },
  {
    value: 'COMFORT' as const,
    label: '情绪安抚',
    short: '安抚',
    icon: Heart,
    color: 'from-emerald-400 to-teal-400',
    hoverColor: 'hover:bg-emerald-500/20',
    activeColor: 'bg-emerald-500/30 border-emerald-400',
    ringColor: 'ring-emerald-500/50',
    description: '共情理解，温柔陪伴',
    emoji: '💚',
  },
];

const toggleIntent = (value: TacticalIntentType) => {
  if (props.disabled) return;
  // 点击已选中的 → 取消选择
  if (props.modelValue === value) {
    emit('update:modelValue', null);
  } else {
    emit('update:modelValue', value);
  }
};

const isSelected = (value: TacticalIntentType) => props.modelValue === value;
</script>

<template>
  <div class="tactical-intent-bar flex items-center gap-2">
    <!-- 标签提示 -->
    <span class="text-xs text-zinc-500 mr-1 whitespace-nowrap opacity-70">
      战术意图
    </span>
    
    <!-- 四个意图按钮 -->
    <Tooltip 
      v-for="intent in intents" 
      :key="intent.value"
      :content="`${intent.label}：${intent.description}`"
      side="top"
    >
      <button
        type="button"
        :disabled="disabled"
        @click="toggleIntent(intent.value)"
        class="
          intent-btn relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
          text-xs font-medium
          border border-white/10 backdrop-blur-sm
          transition-all duration-200 ease-out
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        :class="[
          isSelected(intent.value) 
            ? `${intent.activeColor} ring-2 ${intent.ringColor} scale-105` 
            : `bg-white/5 ${intent.hoverColor}`
        ]"
      >
        <!-- 图标 -->
        <component 
          :is="intent.icon" 
          class="w-3.5 h-3.5 transition-transform"
          :class="isSelected(intent.value) ? 'scale-110' : ''"
        />
        
        <!-- 文字 -->
        <span 
          class="transition-all"
          :class="isSelected(intent.value) ? 'text-white font-semibold' : 'text-zinc-400'"
        >
          {{ intent.short }}
        </span>
        
        <!-- 选中指示点 -->
        <span 
          v-if="isSelected(intent.value)"
          class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-pulse"
        />
      </button>
    </Tooltip>
    
    <!-- 自动模式提示 -->
    <span 
      v-if="!modelValue"
      class="text-[10px] text-zinc-600 italic ml-1"
    >
      (自动)
    </span>
  </div>
</template>

<style scoped>
.intent-btn {
  /* 玻璃质感 */
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.intent-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.intent-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* 选中时的光晕效果 */
.intent-btn.ring-2 {
  box-shadow: 
    0 0 20px currentColor,
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
</style>
