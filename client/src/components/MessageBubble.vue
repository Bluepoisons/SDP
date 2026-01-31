<script setup lang="ts">
import { computed, ref } from "vue";
import { Copy, RefreshCw, ThumbsDown, ThumbsUp, Trash2, Sparkles } from "lucide-vue-next";
import Card from "@/components/ui/card/Card.vue";
import OptionCard from "@/components/OptionCard.vue"; // 🆕 v3.0 沉浸式情感交互
import ThinkingOrb from "@/components/ThinkingOrb.vue"; // 🔮 v9.0 数字灵魂
import BubbleQueue from "@/components/BubbleQueue.vue"; // 🎯 v9.0 连发气泡
import type { ChatMessage, ChoiceOption } from "@/stores/useGameStore";
import { useGameStore } from "@/stores/useGameStore";

const gameStore = useGameStore();

const props = defineProps<{
  message: ChatMessage;
  isActive: boolean;
  thinkingDuration?: number; // v9.0: 思考时长
  thinkingStage?: string;    // v9.0: 思考阶段
}>();

const emit = defineEmits<{
  (e: "select", option: ChoiceOption): void;
  (e: "regenerate", messageId: string): void;
  (e: "feedback", payload: { id: string; type: "like" | "dislike" | "reset" }): void;
  (e: "typing"): void;
  (e: "delete", messageId: string): void;
  (e: "score-popup", score: number, x: number, y: number): void;
  (e: "burst-complete", messageId: string): void; // v9.0: 连发完成
}>();

// v9.0: 连发气泡状态
const burstActive = ref(true);

// v9.0: 选项选择动画状态
const selectedOptionIdLocal = ref<string | null>(null);
const isAnimatingSelection = ref(false);

const handleBurstComplete = () => {
  gameStore.markBurstComplete(props.message.id);
  emit("burst-complete", props.message.id);
};

const handleSelect = (option: ChoiceOption) => {
  // v9.0: 触发选择动画
  selectedOptionIdLocal.value = option.id;
  isAnimatingSelection.value = true;
  
  // 动画完成后执行实际选择
  setTimeout(() => {
    emit("select", option);
    isAnimatingSelection.value = false;
  }, 600); // 等待动画完成
};

// v9.0: 判断选项是否淡出
const isOptionFading = (optionId: string) => {
  return isAnimatingSelection.value && selectedOptionIdLocal.value !== optionId;
};

// v9.0: 判断选项是否居中
const isOptionCentering = (optionId: string) => {
  return isAnimatingSelection.value && selectedOptionIdLocal.value === optionId;
};

const handleScorePopup = (score: number, x: number, y: number) => {
  emit("score-popup", score, x, y);
};

const isActionable = computed(() =>
  (props.message.role === "assistant" && props.message.type !== "thinking") || props.message.type === "options"
);

const isLiked = computed(() => props.message.feedback === "like");
const isDisliked = computed(() => props.message.feedback === "dislike");

const handleCopy = async () => {
  try {
    const content = props.message.type === "options"
      ? (props.message.options || []).map((opt, index) => `${index + 1}. ${opt.text}`).join("\n")
      : props.message.content;
    await navigator.clipboard.writeText(content || "");
  } catch {
    // ignore
  }
};

const handleRegenerate = () => {
  emit("regenerate", props.message.id);
};

const handleFeedback = (type: "like" | "dislike") => {
  if (props.message.feedback === type) {
    emit("feedback", { id: props.message.id, type: "reset" });
  } else {
    emit("feedback", { id: props.message.id, type });
  }
};

const handleDelete = () => {
  emit("delete", props.message.id);
};

const handleTypingTick = () => {
  emit("typing");
};

const parsedScene = computed(() => {
  const content = props.message.content || "";
  const match = content.match(/^(.*?)[“"「『](.+?)[”"」』](.*)$/);
  if (match) {
    const scene = `${match[1]}${match[3]}`.trim();
    const dialogue = match[2].trim();
    return { scene, dialogue: dialogue || content };
  }
  // v9.0: 场景总结添加两字符缩进（中文全角空格）
  return { scene: "", dialogue: content, isPlainSummary: true };
});

const lineClass = computed(() => {
  if (props.message.type === "thinking") {
    return "border-l-4 border-l-white/10";  // 🎨 v9.2: 淡化思考状态边框
  }
  const option = props.message.options?.[0];
  const style = (option?.type || option?.style || "").toLowerCase();
  if (style.includes("romantic") || style.includes("直球")) return "border-l-4 border-l-rose-500";
  if (style.includes("cold") || style.includes("高冷")) return "border-l-4 border-l-cyan-500";
  if (style.includes("humor") || style.includes("幽默")) return "border-l-4 border-l-amber-400";
  return "border-l-4 border-l-indigo-500";
});

const glowClass = computed(() => {
  const option = props.message.options?.[0];
  const style = (option?.type || option?.style || "").toLowerCase();
  if (style.includes("romantic") || style.includes("直球")) return "shadow-[0_0_30px_-10px_rgba(244,63,94,0.1)]";
  if (style.includes("cold") || style.includes("高冷")) return "shadow-[0_0_30px_-10px_rgba(34,211,238,0.1)]";
  if (style.includes("humor") || style.includes("幽默")) return "shadow-[0_0_30px_-10px_rgba(251,191,36,0.1)]";
  return "shadow-[0_0_30px_-10px_rgba(99,102,241,0.08)]";
});
</script>

<template>
  <div 
    class="w-full message-bubble" 
    :data-role="props.message.role"
    :data-type="props.message.type"
  >
    <!-- 🎯 v9.0: 连发气泡模式 -->
    <div
      v-if="props.message.type === 'burst'"
      class="group flex w-full flex-col items-end gap-1"
    >
      <BubbleQueue
        :lines="props.message.burstLines || []"
        :is-active="burstActive && !props.message.burstComplete"
        :interval="150"
        @queue-complete="handleBurstComplete"
      />
      <!-- 已完成时显示静态气泡 -->
      <div v-if="props.message.burstComplete" class="burst-static">
        <div
          v-for="(line, idx) in props.message.burstLines"
          :key="idx"
          class="burst-bubble-static"
        >
          {{ line }}
        </div>
      </div>
      <button
        class="opacity-0 transition-opacity group-hover:opacity-100 text-zinc-700 hover:text-red-500 mt-1"
        type="button"
        aria-label="Delete message"
        @click="handleDelete"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>

    <!-- 普通用户消息 -->
    <div
      v-else-if="props.message.role === 'user'"
      class="group flex w-full items-center justify-end gap-2"
    >
      <button
        class="opacity-0 transition-opacity group-hover:opacity-100 text-zinc-700 hover:text-red-500"
        type="button"
        aria-label="Delete message"
        @click="handleDelete"
      >
        <Trash2 class="h-4 w-4" />
      </button>
      <div class="user-bubble max-w-[70%] px-5 py-3 text-sm text-white">
        {{ props.message.content }}
      </div>
    </div>

    <div v-else-if="props.message.type === 'options'" class="group relative w-full">
      <div class="options-container flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-900/40 p-6 mb-8" :class="[lineClass, glowClass]">
        <!-- 🆕 v9.0: 选项卡片带动画效果 + 打字机 -->
        <div v-if="!props.message.selectedOptionId" class="options-grid grid gap-3">
          <OptionCard
            v-for="(option, index) in props.message.options || []"
            :key="option.id"
            :option="option"
            :fading="isOptionFading(option.id)"
            :centering="isOptionCentering(option.id)"
            :animation-delay="index * 150"
            @select="handleSelect"
            @score-popup="handleScorePopup"
          />
        </div>

        <div v-else class="relative text-xl font-bold tracking-wide">
          <span class="absolute -left-2 -top-4 text-4xl text-white/10">“</span>
          <span class="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {{ props.message.selectedText }}
          </span>
          <span class="absolute -right-2 -bottom-6 text-4xl text-white/10">”</span>
        </div>

        <div
          v-if="isActionable"
          class="mt-1 flex items-center gap-3 text-xs text-zinc-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-zinc-200"
            type="button"
            @click="handleRegenerate"
          >
            <RefreshCw class="h-4 w-4" />
            重试
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-zinc-200"
            type="button"
            @click="handleCopy"
          >
            <Copy class="h-4 w-4" />
            复制
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition"
            type="button"
            :class="isLiked ? 'text-green-500' : 'text-zinc-500 hover:text-zinc-200'"
            @click="handleFeedback('like')"
          >
            <ThumbsUp class="h-4 w-4" />
            点赞
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition"
            type="button"
            :class="isDisliked ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-200'"
            @click="handleFeedback('dislike')"
          >
            <ThumbsDown class="h-4 w-4" />
            点踩
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition text-zinc-600 hover:text-red-500"
            type="button"
            @click="handleDelete"
          >
            <Trash2 class="h-4 w-4" />
            删除
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="props.message.role === 'assistant'"
      class="group relative w-full animate-summary-popup"
    >
      <!-- 🎨 v9.2: 思考状态使用更淡的背景 -->
      <div 
        class="flex flex-col gap-4 rounded-xl border p-6 mb-8" 
        :class="[
          lineClass, 
          glowClass,
          props.message.type === 'thinking' 
            ? 'border-white/[0.02] bg-zinc-900/20' 
            : 'border-white/5 bg-zinc-900/40'
        ]"
      >
        <!-- 🔮 v9.0: ThinkingOrb 替换原有 loading -->
        <div v-if="props.message.type === 'thinking'" class="thinking-orb-wrapper">
          <ThinkingOrb
            state="thinking"
            :duration="thinkingDuration || 0"
            :stage="thinkingStage || '正在重构上下文...'"
          />
        </div>

        <template v-else>
          <div v-if="parsedScene.scene" class="flex items-start gap-2 text-sm italic text-zinc-500 leading-loose">
            <Sparkles class="mt-0.5 h-4 w-4 text-zinc-600" />
            <p class="font-serif">
              {{ parsedScene.scene }}
            </p>
          </div>

          <div class="relative text-xl font-bold tracking-wide">
            <span class="absolute -left-2 -top-4 text-4xl text-white/10">“</span>
            <span class="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {{ parsedScene.dialogue }}
            </span>
            <span class="absolute -right-2 -bottom-6 text-4xl text-white/10">”</span>
          </div>

          <div
            v-if="isActionable"
            class="mt-1 flex items-center gap-3 text-xs text-zinc-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-zinc-200"
            type="button"
            @click="handleRegenerate"
          >
            <RefreshCw class="h-4 w-4" />
            重试
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-zinc-200"
            type="button"
            @click="handleCopy"
          >
            <Copy class="h-4 w-4" />
            复制
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition"
            type="button"
            :class="isLiked ? 'text-green-500' : 'text-zinc-500 hover:text-zinc-200'"
            @click="handleFeedback('like')"
          >
            <ThumbsUp class="h-4 w-4" />
            点赞
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition"
            type="button"
            :class="isDisliked ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-200'"
            @click="handleFeedback('dislike')"
          >
            <ThumbsDown class="h-4 w-4" />
            点踩
          </button>
          <button
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 transition text-zinc-600 hover:text-red-500"
            type="button"
            @click="handleDelete"
          >
            <Trash2 class="h-4 w-4" />
            删除
          </button>
          </div>
        </template>
      </div>
    </div>

    <div
      v-else
      class="flex w-full justify-center"
    >
      <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-400">
        {{ props.message.content }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 🎯 v9.0: 用户气泡切角设计 */
.user-bubble {
  position: relative;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.2);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  border-radius: 20px 20px 4px 20px;
  backdrop-filter: blur(8px);
  min-width: 3em; /* 最小宽度，避免单字太窄 */
  
  /* 切角效果 - 右上角 */
  clip-path: polygon(
    0 0,
    calc(100% - 14px) 0,
    100% 14px,
    100% 100%,
    0 100%
  );
}

/* 切角装饰线 */
.user-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: linear-gradient(
    135deg,
    transparent 50%,
    rgba(var(--accent-rgb, 139, 92, 246), 0.5) 50%
  );
  pointer-events: none;
}

/* 🔮 ThinkingOrb 容器 */
.thinking-orb-wrapper {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

/* 🎯 v9.0: 弹入动画 */
.animate-summary-popup {
  animation: summary-popup 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes summary-popup {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 🎯 v9.0: 场景总结缩进（两个中文全角空格） */
.summary-indent {
  text-indent: 2em;
}

/* 🎯 v9.0: 选项容器弹入动画 */
.options-container {
  animation: options-container-popup 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes options-container-popup {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 🎯 v9.0: 选项卡片依次弹入 */
.options-grid :deep(.option-card) {
  animation: option-card-popup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.options-grid :deep(.option-card:nth-child(1)) { animation-delay: 0.05s; }
.options-grid :deep(.option-card:nth-child(2)) { animation-delay: 0.15s; }
.options-grid :deep(.option-card:nth-child(3)) { animation-delay: 0.25s; }
.options-grid :deep(.option-card:nth-child(4)) { animation-delay: 0.35s; }
.options-grid :deep(.option-card:nth-child(5)) { animation-delay: 0.45s; }

@keyframes option-card-popup {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 🎯 连发气泡静态显示 */
.burst-static {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.burst-bubble-static {
  max-width: 75%;
  padding: 10px 20px 10px 16px; /* 右侧增加内边距 */
  font-size: 14px;
  line-height: 1.5;
  color: var(--bubble-text, #fff);
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.2);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  border-radius: 18px 18px 4px 18px;
  backdrop-filter: blur(8px);
  word-break: break-word;
  
  /* 切角效果 */
  clip-path: polygon(
    0 0,
    calc(100% - 12px) 0,
    100% 12px,
    100% 100%,
    0 100%
  );
}
</style>