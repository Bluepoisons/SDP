<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { Heart, HeartCrack, Sparkles, Zap } from 'lucide-vue-next';
import { useUiSettings } from '@/stores/useUiSettings';
import TacticalAssessment from '@/components/TacticalAssessment.vue';

// 📋 v4.0 GALGAME 风格增强版
// 新增：悬停特效、抖动动画、属性弹窗触发
// v9.0: 打字机效果

const uiSettings = useUiSettings();

const props = defineProps<{
  option: {
    text: string;
    kaomoji?: string;
    score?: number;
    style?: string;
    style_name?: string;
  };
  selected?: boolean;
  fading?: boolean;       // v9.0: 是否正在淡出
  centering?: boolean;    // v9.0: 是否正在居中
  animationDelay?: number; // v9.0: 动画延迟(ms)
}>();

const emit = defineEmits<{
  select: [option: any];
  scorePopup: [score: number, x: number, y: number];
  typed: [];  // v9.0: 打字完成事件
}>();

const cardRef = ref<HTMLElement | null>(null);
const isHovering = ref(false);

// v9.0: 打字机状态
const displayText = ref('');
const isTypingComplete = ref(false);
const typingSpeed = 30; // ms per character

// v9.0: 打字机效果
const startTypewriter = () => {
  if (!uiSettings.optionTypewriter) {
    displayText.value = props.option.text;
    isTypingComplete.value = true;
    return;
  }
  
  const text = props.option.text;
  let index = 0;
  displayText.value = '';
  
  const typeNext = () => {
    if (index < text.length) {
      displayText.value += text[index];
      index++;
      setTimeout(typeNext, typingSpeed);
    } else {
      isTypingComplete.value = true;
      emit('typed');
    }
  };
  
  // 根据延迟开始打字
  const delay = props.animationDelay || 0;
  setTimeout(typeNext, delay + 200); // 200ms 额外等待卡片出现
};

// 监听文本变化重新打字
watch(() => props.option.text, () => {
  isTypingComplete.value = false;
  startTypewriter();
});

onMounted(() => {
  startTypewriter();
});

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
    class="option-card group relative w-full cursor-pointer overflow-hidden border-2 transition-all duration-300"
    :class="[
      colorStyle.border,
      colorStyle.bg,
      colorStyle.shadow,
      { 'option-romantic': isRomanticOption },
      { 'option-mysterious': isMysteriousOption },
      { 'option-highlight': isHovering },
      { 'shine-effect': isHovering },
      { 'option-fading': fading },
      { 'option-centering': centering },
      selected ? 'option-selected scale-[1.02] ring-2 ring-white/20' : 'hover:scale-105 active:scale-95'
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

      <!-- 📝 正文文本 - v9.0: 打字机效果 -->
      <p 
        class="text-base font-medium leading-relaxed tracking-wide transition-colors min-h-[1.5em]"
        :class="colorStyle.text"
      >
        {{ displayText }}<span v-if="!isTypingComplete" class="typing-cursor">|</span>
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

      <!-- 🎯 v12.0: 战术评估 - 胜率预测 -->
      <TacticalAssessment 
        v-if="option.successRate !== undefined && option.successRate !== null"
        :success-rate="option.successRate"
        :risk-level="option.riskLevel || 'moderate'"
        :risk-tag="option.riskTag || '战术方案'"
        class="mt-3"
      />
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
/* 🎨 v9.0: 切角设计 (Chamfered Corners) */
.option-card {
  /* 右上角切角 */
  clip-path: polygon(
    0 0,
    calc(100% - 20px) 0,
    100% 20px,
    100% 100%,
    0 100%
  );
  border-radius: 12px 0 12px 12px;
}

/* 切角装饰线 */
.option-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: linear-gradient(
    135deg,
    transparent 50%,
    currentColor 50%
  );
  opacity: 0.1;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.option-card:hover::after {
  opacity: 0.2;
}

/* 🎨 自定义动画效果 */
@keyframes pulse-glow {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.08; }
}

.group:hover .animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* ✨ Shine 扫光效果 (Master's Advice: Hover 时闪光扫过) */
.shine-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  animation: shine-sweep 0.6s ease-out forwards;
  pointer-events: none;
  z-index: 20;
}

@keyframes shine-sweep {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* 🎮 Active 按压反馈 (The Juice) */
.option-card:active {
  transform: scale(0.95) translateY(2px) !important;
  transition: transform 0.1s ease;
}

/* 💫 悬浮时轻微上浮 */
.option-card:hover {
  transform: translateY(-4px) scale(1.02);
}

/* 🎯 v9.0: 选中状态动画 */
.option-selected {
  animation: option-select-pulse 0.4s ease-out;
}

@keyframes option-select-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1.02); }
}

/* 🎯 v9.0: 淡出动画（其他选项） */
.option-fading {
  animation: option-fade-out 0.5s ease-out forwards;
  pointer-events: none;
}

@keyframes option-fade-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
}

/* 🎯 v9.0: 居中动画（选中选项） */
.option-centering {
  animation: option-center 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes option-center {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1.02);
  }
}

/* 🎬 v9.0: 打字机光标动画 */
.typing-cursor {
  animation: cursor-blink 0.8s ease-in-out infinite;
  opacity: 1;
  font-weight: 100;
  color: var(--accent-color, #06b6d4);
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
