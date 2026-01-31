<script setup lang="ts">
import { ref, computed } from "vue";
import { useGameStore, type ChoiceOption } from "@/stores/useGameStore";
import OptionCard from "@/components/OptionCard.vue";

const props = defineProps<{
  options: ChoiceOption[];
}>();

const gameStore = useGameStore();

const feedbackText = ref("");
const selectedId = ref<string | null>(null);
const isSelectionLocked = ref(false);  // 🎯 v9.2: 选择锁定状态

// 🎯 v9.2: 计算每个选项的状态
const getOptionState = (optionId: string) => {
  if (!selectedId.value) return 'normal';
  if (selectedId.value === optionId) return 'selected';
  return 'fading';  // 其他未选中的选项
};

const handleSelect = (option: ChoiceOption) => {
  if (isSelectionLocked.value) return;  // 防止重复点击
  
  // 🎯 锁定选择
  isSelectionLocked.value = true;
  selectedId.value = option.id;
  
  // 🎭 命运选定的反馈文案
  feedbackText.value = `命运已定：${option.style_name || option.style || '未知风格'}`;
  
  // ⏱️ 等待动画完成后再提交
  window.setTimeout(() => {
    gameStore.handleOptionSelection(option);
    
    // 清理状态（延迟以保证动画完整）
    window.setTimeout(() => {
      feedbackText.value = "";
      selectedId.value = null;
      isSelectionLocked.value = false;
    }, 300);
  }, 400);  // 400ms 等待淡出动画
};
</script>

<template>
  <div class="fixed inset-0 z-30 flex items-center justify-center">
    <!-- 🎭 背景遮罩 - 选择时加深 -->
    <div 
      class="absolute inset-0 backdrop-blur-sm transition-all duration-500"
      :class="selectedId ? 'bg-black/80' : 'bg-black/60'"
    ></div>
    
    <div class="relative z-10 w-full max-w-3xl px-6">
      <!-- 🎯 标题 - 选择后变化 -->
      <p class="mb-4 text-center text-xs uppercase tracking-[0.4em] transition-all duration-300"
         :class="selectedId ? 'text-amber-400' : 'text-zinc-400'">
        {{ selectedId ? '✦ Destiny Sealed ✦' : 'Destiny Choice' }}
      </p>
      
      <!-- 🎮 v9.2: 命运选项矩阵 -->
      <TransitionGroup 
        name="staggered-choice" 
        tag="div" 
        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
        appear
      >
        <div
          v-for="(option, index) in props.options"
          :key="option.id"
          class="option-wrapper transition-all duration-500"
          :class="{
            'option-selected-wrapper': selectedId === option.id,
            'option-fading-wrapper': selectedId && selectedId !== option.id
          }"
          :style="{ transitionDelay: selectedId ? '0ms' : `${index * 80}ms` }"
        >
          <OptionCard
            :option="option"
            :selected="selectedId === option.id"
            :fading="selectedId !== null && selectedId !== option.id"
            :animation-delay="index * 80"
            @select="handleSelect"
          />
        </div>
      </TransitionGroup>

      <!-- 🎭 命运确认提示 -->
      <Transition name="destiny-toast">
        <div
          v-if="feedbackText"
          class="pointer-events-none absolute -bottom-16 left-1/2 w-max -translate-x-1/2 rounded-full border border-amber-500/30 bg-amber-950/80 px-5 py-2 text-sm font-medium text-amber-200 shadow-xl backdrop-blur-md"
        >
          <span class="mr-2">✦</span>{{ feedbackText }}<span class="ml-2">✦</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* 🎮 v9.2: 交错入场动画 */
.staggered-choice-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.staggered-choice-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}
.staggered-choice-leave-active {
  transition: all 0.4s ease-out;
}
.staggered-choice-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 🎯 选项包装器状态 */
.option-wrapper {
  transform-origin: center center;
}

/* ✨ 选中的选项：高亮 + 微放大 */
.option-selected-wrapper {
  transform: scale(1.02);
  z-index: 10;
  filter: brightness(1.1);
}

/* 💫 未选中的选项：模糊 + 缩小 + 淡出 */
.option-fading-wrapper {
  opacity: 0.3;
  transform: scale(0.95);
  filter: blur(2px) grayscale(0.5);
  pointer-events: none;
}

/* 🎭 命运确认提示动画 */
.destiny-toast-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.destiny-toast-leave-active {
  transition: all 0.3s ease-out;
}
.destiny-toast-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.8);
}
.destiny-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px) scale(0.9);
}
</style>
