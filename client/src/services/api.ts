import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 30000, // v8.0: 增加超时时间以适应双阶段请求
});

export const checkHealth = async () => {
  const { data } = await api.get("/bridge/health");
  return data;
};

// ==================== v8.0 指挥官系统类型定义 ====================

export interface SituationAnalysis {
  summary: string;
  emotion_score: number;
  intent: string;
  strategy: string;
  confidence: number;
  burst_detected: boolean;
  pressure_level: number;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis: SituationAnalysis;
  raw_input: string;
  analysisTimeMs?: number;
  message?: string;
}

export interface ExecuteResponse {
  success: boolean;
  data?: {
    originalText: string;
    sceneSummary: string;
    options: DialogOption[];
    executionTimeMs: number;
    appliedStrategy: string;
  };
  message?: string;
}

// ==================== 原有类型定义 ====================

export interface DialogOption {
  id: string;
  text: string;
  kaomoji?: string;        // v3.1: 独立的颜文字
  score?: number;          // v3.1: 好感度评分 (-3 ~ +3)
  style?: string;
  style_name?: string;     // v3.1: 风格名称
  effect?: string;
  emoji?: string;
  favorChange?: number;
  type?: string;
  description?: string;
}

export interface GenerateResponse {
  success: boolean;
  data?: {
    sessionId: string | null;
    originalText: string;
    options: DialogOption[];
    sceneSummary?: string;
    style?: string;
  };
  message?: string;
}

// ==================== v8.0 指挥官系统 API ====================

/**
 * Phase 1: 态势感知 - 分析对方消息的情绪和意图
 */
export const analyzeMessage = async (
  payload: {
    user_input: string;
    history?: Array<Record<string, unknown>>;
  },
  signal?: AbortSignal
): Promise<AnalyzeResponse> => {
  const { data } = await api.post<AnalyzeResponse>("/api/analyze", payload, { signal });
  return data;
};

/**
 * Phase 2: 战术执行 - 基于确认的战术分析生成回复
 */
export const executeTactics = async (
  payload: {
    user_input: string;
    history?: Array<Record<string, unknown>>;
    analysis_context: SituationAnalysis;
  },
  signal?: AbortSignal
): Promise<ExecuteResponse> => {
  const { data } = await api.post<ExecuteResponse>("/api/execute", payload, { signal });
  return data;
};

// ==================== 原有 API（保持兼容） ====================

// v8.1: 战术意图类型
export type TacticalIntentType = 'PRESSURE' | 'LURE' | 'PROBE' | 'COMFORT' | null;

export const generateDialog = async (
  payload: {
    text: string;
    style?: string;
    history?: Array<Record<string, unknown>>;
    userId?: string;
    regenerateId?: string;
    sessionId?: string;
    clientMessages?: Array<Record<string, unknown>>;
    tacticalIntent?: TacticalIntentType; // 🆕 v8.1: 战术意图
  },
  signal?: AbortSignal
) => {
  const { data } = await api.post<GenerateResponse>("/api/generate", payload, { signal });
  return data;
};

export const recordSelection = async (payload: {
  sessionId: string;
  optionId: string;
  userId: string;
}) => {
  const { data } = await api.post("/api/selection", payload);
  return data;
};

export const recordFeedback = async (payload: {
  messageId: string;
  type: "like" | "dislike" | "reset";
  scene?: string;
  response?: string;
  userId?: string;
}) => {
  const { data } = await api.post("/api/feedback", payload);
  return data;
};

export const deleteSessionMessage = async (sessionId: string, messageId: string) => {
  const { data } = await api.delete(`/api/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`);
  return data;
};
