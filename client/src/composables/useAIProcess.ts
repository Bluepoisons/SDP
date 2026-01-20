import { ref, onUnmounted } from "vue";
import { generateDialog, type GenerateResponse } from "@/services/api";

type GeneratePayload = {
  text: string;
  style?: string;
  history?: Array<Record<string, unknown>>;
  userId?: string;
  regenerateId?: string;
  sessionId?: string;
  clientMessages?: Array<Record<string, unknown>>;
};

export function useAIProcess() {
  const isThinking = ref(false);
  const thinkingDuration = ref(0);
  const thinkingStage = ref("");
  const abortController = ref<AbortController | null>(null);

  const thoughtSteps = [
    "正在重构上下文...",
    "分析情感光谱...",
    "推演对话分支...",
    "构建语气模型...",
  ];

  let startTime = 0;
  let rafId: number | null = null;

  const tick = () => {
    thinkingDuration.value = performance.now() - startTime;
    const stepIndex = Math.floor((thinkingDuration.value / 800) % thoughtSteps.length);
    thinkingStage.value = thoughtSteps[stepIndex];
    rafId = requestAnimationFrame(tick);
  };

  const cleanup = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const reset = () => {
    isThinking.value = false;
    cleanup();
    abortController.value = null;
  };

  const startThinking = async (payload: GeneratePayload): Promise<GenerateResponse | null> => {
    if (isThinking.value) return null;

    isThinking.value = true;
    thinkingDuration.value = 0;
    thinkingStage.value = thoughtSteps[0];
    abortController.value = new AbortController();

    startTime = performance.now();
    rafId = requestAnimationFrame(tick);

    try {
      const result = await generateDialog(payload, abortController.value.signal);
      return result;
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return null;
      }
      throw error;
    } finally {
      reset();
    }
  };

  const stopThinking = () => {
    if (abortController.value) {
      abortController.value.abort();
    }
    reset();
  };

  onUnmounted(() => {
    stopThinking();
  });

  return {
    isThinking,
    thinkingDuration,
    thinkingStage,
    startThinking,
    stopThinking,
  };
}
