<script setup lang="ts">
import { computed, ref } from 'vue';
import { Heart, HeartCrack, Sparkles, Zap } from 'lucide-vue-next';

// 📋 v4.0 GALGAME 风格增强版
// 新增：悬停特效、抖动动画、属性弹窗触发

const props = defineProps<{
  option: {
    text: string;
    kaomoji?: string;
    score?: number;
    style?: string;
    style_name?: string;
  };
  selected?: boolean;
}>();

const emit = defineEmits<{
  select: [option: any];
  scorePopup: [score: number, x: number, y: number];
}>();

const cardRef = ref<HTMLElement | null>(null);
const isHovering = ref(false);

// 🐛 调试：检查数据完整性
if (process.env.NODE_ENV === 'development') {
  if (props.option.score === undefined) {
    console.warn('⚠️ OptionCard: score is undefined', props.option);
  }
  if (!props.option.kaomoji) {
    console.warn('⚠️ OptionCard: kaomoji is missing', props.option);
  }
}

// 🎨 动态样式计算 - 基于 score 的颜色映射
const colorStyle = computed(() => {
  const s = props.option.score ?? 0; // 默认值 0
  
  // 💖 心动/高情商 (+3, +2)
  if (s >= 2) return {
    border: 'border-pink-500/50 hover:border-pink-400',
    bg: 'bg-pink-950/10 hover:bg-pink-900/20',
    text: 'text-pink-100',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    glow: 'group-hover:opacity-[0.15]',
  };
  
  // 💔 灾难/掉价 (-3, -2)
  if (s <= -2) return {
    border: 'border-purple-600/50 hover:border-purple-500',
    bg: 'bg-purple-950/10 hover:bg-purple-900/20',
    text: 'text-purple-100',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    shadow: 'hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]',
    glow: 'group-hover:opacity-[0.12]',
  };
  
  // 🔵 安全/标准 (+1, 0, -1)
  return {
    border: 'border-cyan-500/30 hover:border-cyan-400',
    bg: 'bg-cyan-950/10 hover:bg-cyan-900/20',
    text: 'text-zinc-100',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    shadow: 'hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    glow: 'group-hover:opacity-[0.08]',
  };
});

// 💯 好感度显示逻辑
const formattedScore = computed(() => {
  const s = props.option.score;
  if (s === undefined || s === null) return '?'; // 兜底显示
  return s > 0 ? `+${s}` : `${s}`;
});

// 🎭 悬浮提示文案
const scoreLabel = computed(() => {
  const s = props.option.score ?? 0;
  if (s >= 3) return '完美应答';
  if (s >= 2) return '高情商';
  if (s >= 1) return '温和回复';
  if (s === 0) return '中立态度';
  if (s >= -1) return '稍显生硬';
  if (s >= -2) return '容易尴尬';
  return '关系危机';
});

// 🎯 判断是否为特殊选项（用于高亮动画）
const isRomanticOption = computed(() => {
  const s = props.option.score ?? 0;
  return s >= 2; // 高分=暧昧选项
});

const isMysteriousOption = computed(() => {
  const style = (props.option.style || '').toLowerCase();
  return style.includes('chunibyo') || style.includes('cold');
});

const handleClick = (event: MouseEvent) => {
  emit('select', props.option);
  
  // 🎯 触发属性弹窗
  if (props.option.score !== undefined && props.option.score !== null) {
    emit('scorePopup', props.option.score, event.clientX, event.clientY);
  }
  
  // 🎬 分支过渡动画
  if (cardRef.value) {
    cardRef.value.classList.add('transition-branch');
  }
};
</script>

<template>
  <div 
    ref="cardRef"
    class="option-card group relative w-full cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-300"
    :class="[
      colorStyle.border,
      colorStyle.bg,
      colorStyle.shadow,
      { 'option-romantic': isRomanticOption },
      { 'option-mysterious': isMysteriousOption },
      { 'option-highlight': isHovering },
      selected ? 'scale-[1.02] ring-2 ring-white/20' : 'hover:scale-[1.03]'
    ]"
    @click="handleClick"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <!-- 📦 内容容器 -->
    <div class="relative z-10 flex flex-col gap-3 p-4">
      
      <!-- 🏷️ 顶部：好感度徽章 (替代原本的 style name) -->
      <div class="flex items-center justify-between">
        <div 
          class="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide backdrop-blur-md transition-all"
          :class="[colorStyle.badge, { 'effect-heartbeat': isHovering && isRomanticOption }]"
          :title="scoreLabel"
        >
          <!-- 💖 根据正负分显示不同的心形图标 -->
          <Heart v-if="option.score >= 0" class="h-3 w-3 fill-current" />
          <HeartCrack v-else class="h-3 w-3" />
          
          <span>{{ formattedScore }}</span>
        </div>

        <!-- ✨ 悬停特效图标 -->
        <Transition name="fade">
          <Sparkles 
            v-if="isHovering && isRomanticOption" 
            class="h-4 w-4 text-pink-400 effect-star"
          />
          <Zap 
            v-else-if="isHovering && isMysteriousOption"
            class="h-4 w-4 text-purple-400 effect-star"
          />
        </Transition>
      </div>

      <!-- 📝 正文文本 -->
      <p 
        class="text-base font-medium leading-relaxed tracking-wide transition-colors"
        :class="colorStyle.text"
      >
        {{ option.text }}
      </p>

      <!-- 🎭 底部右侧：颜文字 (独立排版) -->
      <div v-if="option.kaomoji" class="flex justify-end">
        <span 
          class="font-mono text-sm opacity-60 transition-opacity group-hover:opacity-100"
          :class="option.score >= 2 ? 'text-pink-300' : option.score <= -2 ? 'text-purple-300' : 'text-cyan-300'"
        >
          {{ option.kaomoji }}
        </span>
      </div>
    </div>

    <!-- 🌊 背景装饰：巨大的半透明颜文字水印 -->
    <div 
      v-if="option.kaomoji"
      class="absolute -bottom-4 -right-4 z-0 select-none opacity-[0.03] transition-all duration-500"
      :class="colorStyle.glow"
    >
      <span class="font-mono text-6xl font-black">{{ option.kaomoji }}</span>
    </div>

    <!-- ✨ 选中状态指示器 -->
    <div 
      v-if="selected" 
      class="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
    >
      <span class="text-xs">✓</span>
    </div>
  </div>
</template>

<style scoped>
/* 🎨 自定义动画效果 */
@keyframes pulse-glow {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.08; }
}

.group:hover .animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
</style>
