import { ref, onUnmounted } from "vue";
import { 
  generateDialog, 
  analyzeMessage, 
  executeTactics,
  type GenerateResponse,
  type AnalyzeResponse,
  type ExecuteResponse,
  type SituationAnalysis,
  type TacticalIntentType,
} from "@/services/api";

type GeneratePayload = {
  text: string;
  style?: string;
  history?: Array<Record<string, unknown>>;
  userId?: string;
  regenerateId?: string;
  sessionId?: string;
  clientMessages?: Array<Record<string, unknown>>;
  tacticalIntent?: TacticalIntentType; // v8.1: 战术意图
};

// v8.0 指挥官系统状态
type CommanderPhase = "idle" | "analyzing" | "tactics" | "executing";

export function useAIProcess() {
  const isThinking = ref(false);
  const thinkingDuration = ref(0);
  const thinkingStage = ref("");
  const abortController = ref<AbortController | null>(null);

  // v8.0: 指挥官系统状态
  const commanderPhase = ref<CommanderPhase>("idle");
  const currentAnalysis = ref<SituationAnalysis | null>(null);
  const rawInput = ref("");

  const thoughtSteps = [
    "正在重构上下文...",
    "分析情感光谱...",
    "推演对话分支...",
    "构建语气模型...",
  ];

  const analyzeSteps = [
    "扫描情绪波动...",
    "解析潜在意图...",
    "评估语境压迫感...",
    "生成战术建议...",
  ];

  const executeSteps = [
    "加载战术模板...",
    "匹配最佳风格...",
    "构建回复矩阵...",
    "优化语气参数...",
  ];

  let startTime = 0;
  let rafId: number | null = null;

  const tick = (steps: string[]) => () => {
    thinkingDuration.value = performance.now() - startTime;
    const stepIndex = Math.floor((thinkingDuration.value / 800) % steps.length);
    thinkingStage.value = steps[stepIndex];
    rafId = requestAnimationFrame(tick(steps));
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

  const resetCommander = () => {
    commanderPhase.value = "idle";
    currentAnalysis.value = null;
    rawInput.value = "";
  };

  // ==================== v8.0 指挥官系统 API ====================

  /**
   * Phase 1: 态势感知 - 分析对方消息
   */
  const startAnalyze = async (
    text: string,
    history: Array<Record<string, unknown>> = []
  ): Promise<AnalyzeResponse | null> => {
    if (isThinking.value) return null;

    isThinking.value = true;
    commanderPhase.value = "analyzing";
    thinkingDuration.value = 0;
    thinkingStage.value = analyzeSteps[0];
    abortController.value = new AbortController();
    rawInput.value = text;

    startTime = performance.now();
    rafId = requestAnimationFrame(tick(analyzeSteps));

    try {
      const result = await analyzeMessage(
        { user_input: text, history },
        abortController.value.signal
      );
      
      if (result.success && result.analysis) {
        currentAnalysis.value = result.analysis;
        commanderPhase.value = "tactics"; // 进入战术确认阶段
      }
      
      return result;
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return null;
      }
      throw error;
    } finally {
      isThinking.value = false;
      cleanup();
    }
  };

  /**
   * Phase 2: 战术执行 - 基于确认的分析生成回复
   */
  const startExecute = async (
    analysis: SituationAnalysis,
    history: Array<Record<string, unknown>> = []
  ): Promise<ExecuteResponse | null> => {
    if (isThinking.value || !rawInput.value) return null;

    isThinking.value = true;
    commanderPhase.value = "executing";
    thinkingDuration.value = 0;
    thinkingStage.value = executeSteps[0];
    abortController.value = new AbortController();

    startTime = performance.now();
    rafId = requestAnimationFrame(tick(executeSteps));

    try {
      const result = await executeTactics(
        {
          user_input: rawInput.value,
          history,
          analysis_context: analysis,
        },
        abortController.value.signal
      );
      
      return result;
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return null;
      }
      throw error;
    } finally {
      reset();
      resetCommander();
    }
  };

  /**
   * 取消当前战术面板，返回输入状态
   */
  const cancelTactics = () => {
    resetCommander();
  };

  // ==================== 原有接口（保持兼容） ====================

  const startThinking = async (payload: GeneratePayload): Promise<GenerateResponse | null> => {
    if (isThinking.value) return null;

    isThinking.value = true;
    thinkingDuration.value = 0;
    thinkingStage.value = thoughtSteps[0];
    abortController.value = new AbortController();

    startTime = performance.now();
    rafId = requestAnimationFrame(tick(thoughtSteps));

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
    resetCommander();
  };

  onUnmounted(() => {
    stopThinking();
  });

  return {
    // 原有状态
    isThinking,
    thinkingDuration,
    thinkingStage,
    startThinking,
    stopThinking,
    
    // v8.0 指挥官系统
    commanderPhase,
    currentAnalysis,
    rawInput,
    startAnalyze,
    startExecute,
    cancelTactics,
  };
}
