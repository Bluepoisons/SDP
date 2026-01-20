import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 20000,
});

export const checkHealth = async () => {
  const { data } = await api.get("/bridge/health");
  return data;
};

export interface DialogOption {
  id: string;
  text: string;
  style?: string;
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

export const generateDialog = async (
  payload: {
    text: string;
    style?: string;
    history?: Array<Record<string, unknown>>;
    userId?: string;
    regenerateId?: string;
    sessionId?: string;
    clientMessages?: Array<Record<string, unknown>>;
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
