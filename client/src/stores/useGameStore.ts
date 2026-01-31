import { defineStore } from "pinia";
import { deleteSessionMessage } from "@/services/api";

export type MessageRole = "user" | "assistant" | "system";
export type MessageType = "text" | "options" | "selection" | "thinking" | "burst"; // v9.0: 连发气泡

export interface ChoiceOption {
  id: string;
  text: string;
  kaomoji?: string;    // v3.1: 独立的颜文字
  score?: number;      // v3.1: 好感度评分 (-3 ~ +3)
  style?: "romantic" | "humorous" | "cold" | "gentle" | string;
  style_name?: string; // v3.1: 风格名称
  effect?: string;
  emoji?: string;
  type?: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  timestamp: number;
  options?: ChoiceOption[];
  selectedOptionId?: string | null;
  selectedText?: string | null;
  feedback?: "like" | "dislike" | null;
  trainingWeight?: number;
  // v9.0: 连发气泡支持
  burstLines?: string[];       // 连发模式下的消息数组
  burstComplete?: boolean;     // 连发动画是否完成
}

export interface SessionSummary {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
}

interface GameState {
  sessions: SessionSummary[];
  currentSession: ChatSession;
  sessionStore: Record<string, ChatSession>;
  isLoading: boolean;
}

interface GameActions {
  createNewSession(): void;
  loadSession(id: string): void;
  addMessage(message: Omit<ChatMessage, "id" | "timestamp">): void;
  addThinkingMessage(): string;
  addBurstMessage(lines: string[]): string; // v9.0: 连发消息
  markBurstComplete(messageId: string): void; // v9.0: 标记连发完成
  updateMessage(messageId: string, patch: Partial<Omit<ChatMessage, "id">>): void;
  handleOptionSelection(option: ChoiceOption): void;
  setMessageFeedback(messageId: string, feedback: "like" | "dislike" | null): void;
  removeMessagesFromIndex(startIndex: number): void;
  deleteMessage(messageId: string): Promise<void>;
  setLoading(isLoading: boolean): void;
}

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createSession = (): ChatSession => ({
  id: createId(),
  messages: [],
});

export const useGameStore = defineStore<"game", GameState, {}, GameActions>("game", {
  state: (): GameState => {
    const session = createSession();
    return {
      sessions: [
        {
          id: session.id,
          title: "新对话",
          lastMessage: "",
          timestamp: Date.now(),
        },
      ],
      currentSession: session,
      sessionStore: {
        [session.id]: session,
      },
      isLoading: false,
    };
  },
  actions: {
    createNewSession() {
      const session = createSession();
      this.currentSession = session;
      this.sessionStore[session.id] = session;
      this.sessions = [
        {
          id: session.id,
          title: "新对话",
          lastMessage: "",
          timestamp: Date.now(),
        },
        ...this.sessions,
      ];
    },
    loadSession(id: string) {
      const session = this.sessionStore[id];
      if (!session) return;
      this.currentSession = session;
      this.sessions = this.sessions.map((item) =>
        item.id === id ? { ...item, timestamp: Date.now() } : item
      );
    },
    addMessage(message: Omit<ChatMessage, "id" | "timestamp">) {
      const newMessage: ChatMessage = {
        ...message,
        id: createId(),
        timestamp: Date.now(),
      };
      this.currentSession.messages.push(newMessage);
      this.sessionStore[this.currentSession.id] = this.currentSession;

      const summaryIndex = this.sessions.findIndex(
        (session) => session.id === this.currentSession.id
      );
      const lastText = newMessage.content ||
        (newMessage.type === "options" ? "生成了选项" : "");
      const titleSource = this.currentSession.messages.find(
        (item) => item.role === "user"
      )?.content;
      const nextSummary: SessionSummary = {
        id: this.currentSession.id,
        title: titleSource ? titleSource.slice(0, 18) : "新对话",
        lastMessage: lastText,
        timestamp: Date.now(),
      };

      if (summaryIndex >= 0) {
        this.sessions.splice(summaryIndex, 1, nextSummary);
      } else {
        this.sessions.unshift(nextSummary);
      }
    },
    addThinkingMessage() {
      const message: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: "思考中...",
        type: "thinking",
        timestamp: Date.now(),
      };
      this.currentSession.messages.push(message);
      this.sessionStore[this.currentSession.id] = this.currentSession;
      return message.id;
    },
    // v9.0: 添加连发气泡消息
    addBurstMessage(lines: string[]) {
      const message: ChatMessage = {
        id: createId(),
        role: "user",
        content: lines.join('\n'), // 完整内容用于 AI 请求
        type: "burst",
        timestamp: Date.now(),
        burstLines: lines,
        burstComplete: false,
      };
      this.currentSession.messages.push(message);
      this.sessionStore[this.currentSession.id] = this.currentSession;
      
      // 更新会话摘要
      const summaryIndex = this.sessions.findIndex(
        (session) => session.id === this.currentSession.id
      );
      const nextSummary: SessionSummary = {
        id: this.currentSession.id,
        title: lines[0].slice(0, 18) || "新对话",
        lastMessage: `[${lines.length}条连发]`,
        timestamp: Date.now(),
      };
      if (summaryIndex >= 0) {
        this.sessions.splice(summaryIndex, 1, nextSummary);
      } else {
        this.sessions.unshift(nextSummary);
      }
      
      return message.id;
    },
    // v9.0: 标记连发完成
    markBurstComplete(messageId: string) {
      const message = this.currentSession.messages.find((msg) => msg.id === messageId);
      if (message && message.type === "burst") {
        message.burstComplete = true;
      }
    },
    updateMessage(messageId: string, patch: Partial<Omit<ChatMessage, "id">>) {
      const message = this.currentSession.messages.find((msg) => msg.id === messageId);
      if (!message) return;
      Object.assign(message, patch);
    },
    handleOptionSelection(option: ChoiceOption) {
      const lastOptions = [...this.currentSession.messages]
        .reverse()
        .find((msg) => msg.type === "options");
      if (lastOptions && !lastOptions.selectedOptionId) {
        lastOptions.selectedOptionId = option.id;
        lastOptions.selectedText = option.text;
      }

      this.addMessage({
        role: "user",
        content: option.text,
        type: "selection",
      });
    },
    setMessageFeedback(messageId: string, feedback: "like" | "dislike" | null) {
      const message = this.currentSession.messages.find((msg) => msg.id === messageId);
      if (!message) return;
      message.feedback = feedback;
      if (feedback === "like") message.trainingWeight = 2.0;
      else if (feedback === "dislike") message.trainingWeight = 0.0;
      else message.trainingWeight = 1.0;
    },
    removeMessagesFromIndex(startIndex: number) {
      if (startIndex < 0) return;
      this.currentSession.messages.splice(startIndex);
      this.sessionStore[this.currentSession.id] = this.currentSession;
    },
    async deleteMessage(messageId: string) {
      const sessionId = this.currentSession.id;
      this.currentSession.messages = this.currentSession.messages.filter(
        (msg) => msg.id !== messageId
      );
      this.sessionStore[sessionId] = this.currentSession;

      const lastMessage = [...this.currentSession.messages].reverse().find((msg) => msg.content);
      const summaryIndex = this.sessions.findIndex((session) => session.id === sessionId);
      if (summaryIndex >= 0) {
        this.sessions.splice(summaryIndex, 1, {
          ...this.sessions[summaryIndex],
          lastMessage: lastMessage?.content || "",
          timestamp: Date.now(),
        });
      }

      try {
        await deleteSessionMessage(sessionId, messageId);
      } catch {
        // ignore sync error
      }
    },
    setLoading(isLoading: boolean) {
      this.isLoading = isLoading;
    },
    // v10.0: 从 Vision API 添加 AI 响应
    addAIResponse(result: { sceneSummary?: string; options: ChoiceOption[] }) {
      // 如果有场景摘要，添加系统消息
      if (result.sceneSummary) {
        this.addMessage({
          role: "system",
          content: result.sceneSummary,
          type: "text",
        });
      }
      
      // 添加选项消息
      this.addMessage({
        role: "assistant",
        content: "",
        type: "options",
        options: result.options,
      });
    },
  },
  persist: {
    key: "gal-game-store",
  },
});
