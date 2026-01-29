<script setup lang="ts">
import { computed, ref } from "vue";
import { Sparkles, Send, SmilePlus, ShieldCheck, Flame, X } from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";
import Card from "@/components/ui/card/Card.vue";
import CardHeader from "@/components/ui/card/CardHeader.vue";
import CardTitle from "@/components/ui/card/CardTitle.vue";
import CardDescription from "@/components/ui/card/CardDescription.vue";
import CardContent from "@/components/ui/card/CardContent.vue";
import Badge from "@/components/ui/badge/Badge.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import OptionCard from "@/components/OptionCard.vue"; // 🆕 v3.0 沉浸式情感交互
import { recordSelection, type DialogOption } from "@/services/api";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useAIProcess } from "@/composables/useAIProcess";

const inputText = ref("");
const sceneSummary = ref("");
const sessionId = ref<string | null>(null);
const errorMessage = ref("");
const userId = ref("demo-user");

const options = ref<DialogOption[]>([]);
const feedbackText = ref("");
const activeOptionId = ref<string | null>(null);
const selectedOptionId = ref<string | null>(null);
const isSelectionLocked = ref(false);

const connectionStore = useConnectionStore();
const {
  isThinking,
  thinkingDuration,
  thinkingStage,
  startThinking,
  stopThinking,
} = useAIProcess();

const optionTag = (option: DialogOption) => {
  const tag = (option.type || option.style || "").toLowerCase();
  if (tag.includes("romantic") || tag.includes("积极")) return "romantic";
  if (tag.includes("humor") || tag.includes("幽默")) return "humor";
  return "serious";
};

const canGenerate = computed(() => inputText.value.trim().length > 0 && !isThinking.value);

const displayOptions = computed(() => {
  if (!selectedOptionId.value) return options.value;
  return options.value.filter(option => option.id === selectedOptionId.value);
});

const isSingleSelected = computed(() => Boolean(selectedOptionId.value));

const mapErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeAxios = error as { code?: string; message?: string; response?: { status?: number } };
    if (maybeAxios.code === "ECONNABORTED") return "请求超时，请稍后重试或降低输入长度。";
    if (maybeAxios.message?.includes("Network Error")) return "无法连接后端，请确认服务已启动。";
    if (maybeAxios.response?.status === 401) return "鉴权失败，请检查 API Key。";
    if (maybeAxios.response?.status === 429) return "请求过于频繁，请稍后再试。";
    if (maybeAxios.response?.status && maybeAxios.response.status >= 500) return "后端错误，请查看后端日志。";
    if (maybeAxios.message) return `请求失败：${maybeAxios.message}`;
  }
  return "请求失败，请检查后端服务是否启动。";
};

const handleGenerate = async () => {
  if (!canGenerate.value) return;
  errorMessage.value = "";
  selectedOptionId.value = null;
  isSelectionLocked.value = false;

  try {
    const res = await startThinking({
      text: inputText.value.trim(),
      style: "neutral",
      history: [],
      userId: userId.value,
    });

    if (!res) {
      errorMessage.value = "已停止生成。";
      return;
    }

    if (!res.success || !res.data) {
      errorMessage.value = res.message || "生成失败，请稍后重试。";
      return;
    }

    options.value = res.data.options || [];
    sceneSummary.value = res.data.sceneSummary || "";
    sessionId.value = res.data.sessionId;
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  }
};

const handleReset = () => {
  stopThinking();
  inputText.value = "";
  options.value = [];
  sceneSummary.value = "";
  sessionId.value = null;
  errorMessage.value = "";
  selectedOptionId.value = null;
  isSelectionLocked.value = false;
};

const handleSelect = async (option: DialogOption) => {
  if (!sessionId.value || !option.id || isSelectionLocked.value) return;
  selectedOptionId.value = option.id;
  isSelectionLocked.value = true;
  activeOptionId.value = option.id;
  feedbackText.value = `Memory Recorded: AI will lean towards ${option.style || option.type || "this"} in the future.`;
  window.setTimeout(() => {
    feedbackText.value = "";
    activeOptionId.value = null;
  }, 1500);
  try {
    await recordSelection({
      sessionId: sessionId.value,
      optionId: option.id,
      userId: userId.value,
    });
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  }
};
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">对话中心</p>
        <h1 class="mt-2 text-2xl font-semibold">智能对话生成</h1>
        <p class="mt-2 text-sm text-zinc-400">输入截图识别的文本，立即生成 3 种高情商选项。</p>
      </div>
      <Button variant="secondary" :disabled="!canGenerate" @click="handleGenerate">
        <Sparkles class="h-4 w-4" />
        {{ isThinking ? "生成中..." : "即刻生成" }}
      </Button>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>当前输入</CardTitle>
        <CardDescription>支持手动输入或来自 OCR 的文本。</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Textarea v-model="inputText" placeholder="粘贴或输入对话内容..." />
        <div class="flex flex-wrap gap-2">
          <Badge variant="info">默认风格：温和</Badge>
          <Badge variant="success">模型：DeepSeek V3</Badge>
          <Badge variant="secondary">
            延迟：{{ connectionStore.isConnected && connectionStore.latencyMs !== null ? `${connectionStore.latencyMs}ms` : "--" }}
          </Badge>
        </div>
        <div v-if="sceneSummary" class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-200">
          {{ sceneSummary }}
        </div>
        <p v-if="errorMessage" class="text-sm text-red-400">
          {{ errorMessage }}
        </p>
        <div
          v-if="isThinking"
          class="flex items-center gap-3 rounded-lg border border-primary/20 bg-muted/50 p-3 text-sm animate-pulse"
        >
          <div class="relative h-5 w-5">
            <div class="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
          <div class="flex flex-1 items-center justify-between font-mono text-muted-foreground">
            <span class="text-primary">{{ thinkingStage }}</span>
            <span class="opacity-70">{{ (thinkingDuration / 1000).toFixed(2) }}s</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
            @click="stopThinking"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        <div class="flex gap-3">
          <Button :disabled="!canGenerate" @click="handleGenerate">
            <Send class="h-4 w-4" />
            {{ isThinking ? "生成中..." : "生成选项" }}
          </Button>
          <Button variant="outline" @click="handleReset">重置输入</Button>
        </div>
      </CardContent>
    </Card>

    <TransitionGroup
      name="choice"
      tag="div"
      :class="isSingleSelected ? 'relative flex justify-center' : 'relative grid gap-4 lg:grid-cols-3'"
    >
      <transition name="toast">
        <div
          v-if="feedbackText"
          class="pointer-events-none absolute -top-10 left-1/2 w-max -translate-x-1/2 rounded-full border border-border/60 bg-background/90 px-4 py-1 text-xs text-foreground shadow-xl"
        >
          {{ feedbackText }}
        </div>
      </transition>

      <!-- 🆕 v3.0: 使用新的 OptionCard 组件 -->
      <OptionCard
        v-for="option in displayOptions"
        :key="option.id"
        :option="option"
        :selected="selectedOptionId === option.id"
        :class="isSingleSelected ? 'w-full max-w-sm' : ''"
        @select="handleSelect"
      />
    </TransitionGroup>
  </section>
</template>

<style scoped>
.choice-enter-active,
.choice-leave-active {
  transition: all 0.25s ease;
}
.choice-enter-from,
.choice-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.selected-choice {
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.4), 0 20px 40px rgba(16, 185, 129, 0.15);
  transform: translateY(-4px);
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
