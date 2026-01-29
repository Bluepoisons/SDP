<script setup lang="ts">
import { ref } from "vue";
import { useGameStore, type ChoiceOption } from "@/stores/useGameStore";
import OptionCard from "@/components/OptionCard.vue"; // 🆕 v3.0 沉浸式情感交互

const props = defineProps<{
  options: ChoiceOption[];
}>();

const gameStore = useGameStore();

const feedbackText = ref("");
const activeOptionId = ref<string | null>(null);

const styleClass = (option: ChoiceOption) => {
  if (option.style === "romantic") return "hover:border-l-rose-500";
  if (option.style === "humorous") return "hover:border-l-amber-500";
  if (option.style === "cold") return "hover:border-l-cyan-500";
  if (option.style === "gentle") return "hover:border-l-indigo-500";
  return "hover:border-l-primary";
};

const handleSelect = (option: ChoiceOption) => {
  activeOptionId.value = option.id;
  feedbackText.value = `Memory Recorded: AI will lean towards ${option.style || "this"} in the future.`;
  window.setTimeout(() => {
    feedbackText.value = "";
    activeOptionId.value = null;
  }, 1500);
  gameStore.handleOptionSelection(option);
};
</script>

<template>
  <div class="fixed inset-0 z-30 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
    <div class="relative z-10 w-full max-w-3xl px-6">
      <p class="mb-4 text-center text-xs uppercase tracking-[0.4em] text-zinc-400">
        Destiny Choice
      </p>
      <!-- 🆕 v3.0: 使用新的 OptionCard 组件 -->
      <TransitionGroup name="choice" tag="div" class="grid gap-4">
        <OptionCard
          v-for="option in props.options"
          :key="option.id"
          :option="option"
          :selected="activeOptionId === option.id"
          @select="handleSelect"
        />
      </TransitionGroup>

      <transition name="toast">
        <div
          v-if="feedbackText"
          class="pointer-events-none absolute -top-10 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-1 text-xs text-zinc-100 shadow-xl"
        >
          {{ feedbackText }}
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.choice-enter-active,
.choice-leave-active {
  transition: all 0.3s ease;
}
.choice-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.choice-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px);
}

.animate-float {
  animation: float-up 0.8s ease-out both;
}

@keyframes float-up {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
