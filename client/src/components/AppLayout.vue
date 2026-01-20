<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Button from "@/components/ui/button/Button.vue";
import Separator from "@/components/ui/separator/Separator.vue";
import ScrollArea from "@/components/ui/scroll-area/ScrollArea.vue";
import DestinyInput from "@/components/DestinyInput.vue";
import ChatStream from "@/components/ChatStream.vue";
import { useGameStore, type SessionSummary } from "@/stores/useGameStore";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useAIProcess } from "@/composables/useAIProcess";
import { recordFeedback } from "@/services/api";

const gameStore = useGameStore();
const connectionStore = useConnectionStore();

const inputText = ref("");
const isSidebarCollapsed = ref(false);

const { isThinking, startThinking, stopThinking, thinkingStage, thinkingDuration } = useAIProcess();

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const groupedSessions = computed(() => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const groups: Record<string, SessionSummary[]> = {
    "今天": [],
    "昨天": [],
    "过去 7 天": [],
    "更早": [],
  };

  gameStore.sessions
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((session) => {
      if (session.timestamp >= startOfToday) groups["今天"].push(session);
      else if (session.timestamp >= startOfYesterday) groups["昨天"].push(session);
      else if (session.timestamp >= startOfWeek) groups["过去 7 天"].push(session);
      else groups["更早"].push(session);
    });

  return groups;
});

const handleGenerate = async () => {
  const text = inputText.value.trim();
  if (!text || isThinking.value) return;

  gameStore.addMessage({ role: "user", content: text, type: "text" });
  const thinkingId = gameStore.addThinkingMessage();
  gameStore.setLoading(true);

  try {
    const history = buildHistoryPayload(gameStore.currentSession.messages);

    const res = await startThinking({
      text,
      style: "neutral",
      history,
      userId: "demo-user",
      sessionId: gameStore.currentSession.id,
      clientMessages: buildClientMessages(gameStore.currentSession.messages),
    });

    if (!res || !res.success || !res.data) {
      gameStore.updateMessage(thinkingId, {
        role: "system",
        content: res?.message || "生成失败，请稍后重试。",
        type: "text",
      });
      return;
    }

    gameStore.updateMessage(thinkingId, {
      role: "assistant",
      content: res.data.sceneSummary || "",
      type: "text",
    });

    gameStore.addMessage({
      role: "assistant",
      content: "",
      type: "options",
      options: res.data.options || [],
      selectedOptionId: null,
      selectedText: null,
    });

    inputText.value = "";
  } catch (error: any) {
    gameStore.updateMessage(thinkingId, {
      role: "system",
      content: error?.message || "生成失败，请稍后重试。",
      type: "text",
    });
  } finally {
    gameStore.setLoading(false);
  }
};

const buildHistoryPayload = (messages: typeof gameStore.currentSession.messages) =>
  messages
    .filter((message) => message.type === "text" || message.type === "selection")
    .map((message) => ({
      id: message.id,
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

const buildClientMessages = (messages: typeof gameStore.currentSession.messages) =>
  messages
    .filter((message) => message.type !== "thinking")
    .map((message) => ({
      id: message.id,
      role: message.role,
      type: message.type,
      content: message.content,
      selectedOptionId: message.selectedOptionId,
      selectedText: message.selectedText,
      options: message.options,
    }));

const handleRegenerate = async (messageId: string) => {
  if (isThinking.value) return;

  const messages = gameStore.currentSession.messages;
  const targetIndex = messages.findIndex((msg) => msg.id === messageId);
  if (targetIndex === -1) return;

  const hasLaterUser = messages.slice(targetIndex + 1).some((msg) => msg.role === "user");
  if (hasLaterUser) {
    gameStore.addMessage({
      role: "system",
      content: "仅支持重试最新一轮回复。",
      type: "text",
    });
    return;
  }

  const userIndex = [...messages]
    .slice(0, targetIndex)
    .map((msg, index) => ({ msg, index }))
    .reverse()
    .find((item) => item.msg.role === "user")?.index;

  if (userIndex === undefined) return;

  const userMessage = messages[userIndex];
  const history = buildHistoryPayload(messages.slice(0, userIndex + 1));

  gameStore.removeMessagesFromIndex(targetIndex);
  gameStore.setLoading(true);

  try {
    const res = await startThinking({
      text: userMessage.content,
      style: "neutral",
      history,
      userId: "demo-user",
      regenerateId: messageId,
      sessionId: gameStore.currentSession.id,
      clientMessages: buildClientMessages(gameStore.currentSession.messages),
    });

    if (!res || !res.success || !res.data) {
      gameStore.addMessage({
        role: "system",
        content: res?.message || "重试失败，请稍后再试。",
        type: "text",
      });
      return;
    }

    gameStore.addMessage({
      role: "assistant",
      content: res.data.sceneSummary || "",
      type: "text",
    });

    gameStore.addMessage({
      role: "assistant",
      content: "",
      type: "options",
      options: res.data.options || [],
      selectedOptionId: null,
      selectedText: null,
    });
  } catch (error: any) {
    gameStore.addMessage({
      role: "system",
      content: error?.message || "重试失败，请稍后再试。",
      type: "text",
    });
  } finally {
    gameStore.setLoading(false);
  }
};

const handleFeedback = async (payload: { id: string; type: "like" | "dislike" | "reset" }) => {
  const messageIndex = gameStore.currentSession.messages.findIndex((msg) => msg.id === payload.id);
  const message = gameStore.currentSession.messages[messageIndex];
  if (!message || message.type === "thinking") return;

  const responseText = message.type === "options"
    ? (message.options || []).map((opt) => opt.text).join("\n")
    : message.content;

  const scene = [...gameStore.currentSession.messages]
    .slice(0, messageIndex)
    .reverse()
    .find((msg) => msg.role === "user")?.content;

  if (payload.type === "reset") {
    gameStore.setMessageFeedback(payload.id, null);
  } else {
    gameStore.setMessageFeedback(payload.id, payload.type);
  }

  try {
    await recordFeedback({
      messageId: payload.id,
      type: payload.type,
      scene,
      response: responseText,
      userId: "demo-user",
    });
  } catch {
    // ignore
  }
};

const statusText = computed(() => {
  if (!isThinking.value) return "准备就绪";
  const stage = thinkingStage.value || "正在构建命运轨迹...";
  return `${stage} ${(thinkingDuration.value / 1000).toFixed(2)}s`;
});

const handleCancel = () => {
  stopThinking();
  gameStore.setLoading(false);
};

onMounted(() => {
  connectionStore.startAutoCheck();
});

const orbClass = computed(() => {
  const options = [...gameStore.currentSession.messages]
    .reverse()
    .find((message) => message.type === "options" && !message.selectedOptionId)?.options;
  if (!options || options.length === 0) return "bg-indigo-500/20";
  const style = options[0]?.style?.toLowerCase() || "";
  if (style.includes("romantic")) return "bg-rose-500/20";
  if (style.includes("cold")) return "bg-cyan-500/20";
  if (style.includes("humor")) return "bg-amber-500/20";
  return "bg-indigo-500/20";
});
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-[#0a0a0b] text-zinc-100">
    <div class="fixed inset-0 -z-10 bg-[#0a0a0b]"></div>
    <div class="relative flex h-full w-full">
      <aside
        class="flex h-full w-[280px] flex-col border-r border-white/5 bg-black/20 px-4 py-6 transition effects-blur"
        :class="isSidebarCollapsed ? 'w-[92px]' : ''"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-white/10"></div>
              <div>
                <p class="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  SmartDialog
                </p>
                <p class="text-xs text-zinc-400">Memory Archives</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" @click="toggleSidebar">
              {{ isSidebarCollapsed ? '›' : '‹' }}
            </Button>
          </div>

          <Button
            class="w-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30"
            @click="gameStore.createNewSession"
          >
            新建对话
          </Button>
        </div>

        <Separator class="my-4" />

        <ScrollArea class="flex-1 pr-2">
          <div class="space-y-6">
            <div v-for="(items, label) in groupedSessions" :key="label" v-show="items.length">
              <p class="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {{ label }}
              </p>
              <div class="mt-2 space-y-2">
                <Button
                  v-for="session in items"
                  :key="session.id"
                  variant="ghost"
                  class="w-full justify-start truncate border border-transparent bg-white/0 px-3 py-2 text-zinc-300 transition-all hover:bg-white/5 hover:translate-x-1"
                  :class="session.id === gameStore.currentSession.id ? 'bg-white/10 text-white border-indigo-500/60' : ''"
                  @click="gameStore.loadSession(session.id)"
                >
                  <span class="truncate">{{ session.title || '未命名对话' }}</span>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator class="my-4" />

        <div class="space-y-2 text-xs text-zinc-400">
          <div class="flex items-center gap-2">
            <span
              class="h-2 w-2 rounded-full"
              :class="connectionStore.isConnected ? 'bg-emerald-400' : 'bg-red-400'"
            />
            <span>模型：{{ connectionStore.modelName || '模型未就绪' }}</span>
          </div>
          <div>后端：{{ connectionStore.isConnected ? '已连接' : '未连接' }}</div>
        </div>
      </aside>

      <section class="relative flex flex-1 flex-col overflow-hidden">
        <header class="flex items-center justify-between border-b border-white/5 px-8 py-5">
          <div>
            <p class="text-xs uppercase tracking-[0.25em] text-zinc-500">The Narrative Stream</p>
            <h2 class="text-lg font-semibold text-zinc-100">
              {{ connectionStore.modelName || '模型未就绪' }}
            </h2>
          </div>
          <div class="text-xs text-zinc-400">
            {{ connectionStore.isConnected ? '连接正常' : '未连接' }}
          </div>
        </header>

        <div class="pointer-events-none absolute inset-0"></div>

        <div class="relative flex-1 overflow-hidden">
          <div class="mx-auto h-full max-w-3xl px-6 py-6 gpu-accelerated">
            <ChatStream @regenerate="handleRegenerate" @feedback="handleFeedback" />
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-black/60 gpu-accelerated effects-blur">
          <div class="mx-auto max-w-3xl px-6 py-4">
            <DestinyInput
              v-model="inputText"
              :loading="isThinking"
              :status-text="statusText"
              placeholder="输入对话内容..."
              @generate="handleGenerate"
              @cancel="handleCancel"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
