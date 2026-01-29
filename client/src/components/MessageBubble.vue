<script setup lang="ts">
import { computed } from "vue";
import { Copy, RefreshCw, ThumbsDown, ThumbsUp, Trash2, Sparkles } from "lucide-vue-next";
import Card from "@/components/ui/card/Card.vue";
import OptionCard from "@/components/OptionCard.vue"; // 🆕 v3.0 沉浸式情感交互
import type { ChatMessage, ChoiceOption } from "@/stores/useGameStore";

const props = defineProps<{
  message: ChatMessage;
  isActive: boolean;
}>();

const emit = defineEmits<{
  (e: "select", option: ChoiceOption): void;
  (e: "regenerate", messageId: string): void;
  (e: "feedback", payload: { id: string; type: "like" | "dislike" | "reset" }): void;
  (e: "typing"): void;
  (e: "delete", messageId: string): void;
  (e: "score-popup", score: number, x: number, y: number): void; // 🎨 v4.0: 属性弹窗事件
}>();

const handleSelect = (option: ChoiceOption) => {
  emit("select", option);
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
  return { scene: "", dialogue: content };
});

const lineClass = computed(() => {
  if (props.message.type === "thinking") {
    return "border-l-4 border-l-white/20";
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
  <div class="w-full">
    <div
      v-if="props.message.role === 'user'"
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
      <div class="max-w-[70%] rounded-2xl bg-zinc-800/60 px-5 py-3 text-sm text-white">
        {{ props.message.content }}
      </div>
    </div>

    <div v-else-if="props.message.type === 'options'" class="group relative w-full">
      <div class="flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-900/40 p-6 mb-8" :class="[lineClass, glowClass]">
        <!-- 🆕 v3.0: 使用新的 OptionCard 组件 -->
        <div v-if="!props.message.selectedOptionId" class="grid gap-3">
          <OptionCard
            v-for="option in props.message.options || []"
            :key="option.id"
            :option="option"
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
      class="group relative w-full"
    >
      <div class="flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-900/40 p-6 mb-8" :class="[lineClass, glowClass]">
        <div v-if="props.message.type === 'thinking'" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-zinc-500">
          ...
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
