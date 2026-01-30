<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Button from "@/components/ui/button/Button.vue";
import Separator from "@/components/ui/separator/Separator.vue";
import ScrollArea from "@/components/ui/scroll-area/ScrollArea.vue";
import DestinyInput from "@/components/DestinyInput.vue";
import ChatStream from "@/components/ChatStream.vue";
import { useGameStore, type SessionSummary } from "@/stores/useGameStore";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useUiSettings } from "@/stores/useUiSettings";
import { useAIProcess } from "@/composables/useAIProcess";
import { recordFeedback, type SituationAnalysis } from "@/services/api";

// 🆕 Task 2 & 3: 设置按钮相关引入
import { Settings } from "lucide-vue-next";
import SettingsModal from "@/components/SettingsModal.vue";

// 🎨 v4.0: GALGAME 风格组件
import ThemeCycleButton from "@/components/ThemeCycleButton.vue";
import ScorePopup from "@/components/ScorePopup.vue";
import DynamicBackground from "@/components/DynamicBackground.vue";

// 🎮 v6.0: 世界线变动增强
import SystemLogo from "@/components/SystemLogo.vue";
import MouseLight from "@/components/MouseLight.vue";

// 💠 v7.0: Gal-chat 品牌系统
import GalChatLogo from "@/components/GalChatLogo.vue";
import SystemStatus from "@/components/SystemStatus.vue";

// 💔 v7.1: 情感色彩反馈
import EmotionFlash from "@/components/EmotionFlash.vue";

// 🎯 v8.0 → v8.1: 指挥官系统 → 直出+热修
import ECGMonitor from "@/components/ECGMonitor.vue";
import { type TacticalIntentType } from "@/components/TacticalIntent.vue";

// 🌅 v4.0: 时间轮盘粒子系统
import TwilightParticles from "@/components/TwilightParticles.vue";

const gameStore = useGameStore();
const connectionStore = useConnectionStore();
const uiSettings = useUiSettings();

const inputText = ref("");
const isSidebarCollapsed = ref(false);
const isSettingsOpen = ref(false);
const scorePopupRef = ref<InstanceType<typeof ScorePopup> | null>(null);
const twilightParticlesRef = ref<InstanceType<typeof TwilightParticles> | null>(null);
const emotionFlashRef = ref<InstanceType<typeof EmotionFlash> | null>(null);

// v8.1: 「直出+热修」状态
const tacticalIntent = ref<TacticalIntentType>(null);
const showOverrideButton = ref(false);
const lastGeneratedOptions = ref<any[]>([]);

// v8.1: 简化的 AI 流程 - 直出模式
const { 
  isThinking, 
  startThinking, 
  stopThinking, 
  thinkingStage, 
  thinkingDuration,
} = useAIProcess();

// 🎯 处理属性弹窗 + 情感闪烁
const handleScorePopup = (score: number, x: number, y: number) => {
  scorePopupRef.value?.trigger('好感度', score, x, y, 'favor');
  // 💔 触发情感色彩反馈
  emotionFlashRef.value?.triggerFlash(score);
};

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

  // v8.1: 「直出」模式 - 输入即生成，无需确认
  gameStore.addMessage({ role: "user", content: text, type: "text" });
  const thinkingId = gameStore.addThinkingMessage();
  gameStore.setLoading(true);

  try {
    // 根据记忆上限截取历史记录
    const allMessages = gameStore.currentSession.messages;
    const limit = uiSettings.memoryLimit;
    const recentMessages = limit > 0 ? allMessages.slice(-limit) : [];
    const history = buildHistoryPayload(recentMessages);

    // v8.1: 直接调用生成接口，传入战术意图
    const res = await startThinking({
      text,
      style: "neutral",
      history,
      userId: "demo-user",
      sessionId: gameStore.currentSession.id,
      clientMessages: buildClientMessages(gameStore.currentSession.messages),
      tacticalIntent: tacticalIntent.value, // 🆕 传入战术意图
    });

    if (!res || !res.success || !res.data) {
      gameStore.updateMessage(thinkingId, {
        role: "system",
        content: res?.message || "生成失败，请稍后重试。",
        type: "text",
      });
      return;
    }

    // 更新 thinking 消息为分析结果
    gameStore.updateMessage(thinkingId, {
      role: "assistant",
      content: res.data.sceneSummary || "",
      type: "text",
    });

    // 添加选项消息
    gameStore.addMessage({
      role: "assistant",
      content: "",
      type: "options",
      options: res.data.options || [],
      selectedOptionId: null,
      selectedText: null,
    });

    // v8.1: 生成成功后显示「介入指挥」按钮
    lastGeneratedOptions.value = res.data.options || [];
    showOverrideButton.value = true;

    inputText.value = "";
    tacticalIntent.value = null; // 重置战术意图
    
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

// v8.1: 「热修」- 介入指挥（重新生成，使用用户指定的战术意图）
const handleOverride = async () => {
  // 找到最后一条用户消息
  const messages = gameStore.currentSession.messages;
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return;

  // 移除最后的选项消息和分析消息（使用兼容的 reverse + findIndex）
  const reversed = [...messages].reverse();
  const reverseOptionsIdx = reversed.findIndex(m => m.type === 'options');
  const lastOptionsIdx = reverseOptionsIdx > -1 ? messages.length - 1 - reverseOptionsIdx : -1;
  
  if (lastOptionsIdx > -1) {
    // 向前找到对应的分析消息（assistant text）
    const sliced = messages.slice(0, lastOptionsIdx);
    const reversedSlice = [...sliced].reverse();
    const reverseAnalysisIdx = reversedSlice.findIndex(m => m.role === 'assistant' && m.type === 'text');
    const analysisIdx = reverseAnalysisIdx > -1 ? sliced.length - 1 - reverseAnalysisIdx : -1;
    const removeFrom = analysisIdx > -1 ? analysisIdx : lastOptionsIdx;
    gameStore.removeMessagesFromIndex(removeFrom);
  }

  // 隐藏介入按钮
  showOverrideButton.value = false;

  // 以用户选择的战术意图重新生成
  const thinkingId = gameStore.addThinkingMessage();
  gameStore.setLoading(true);

  try {
    const allMessages = gameStore.currentSession.messages;
    const limit = uiSettings.memoryLimit;
    const recentMessages = limit > 0 ? allMessages.slice(-limit) : [];
    const history = buildHistoryPayload(recentMessages);

    const res = await startThinking({
      text: lastUserMsg.content,
      style: "neutral",
      history,
      userId: "demo-user",
      sessionId: gameStore.currentSession.id,
      clientMessages: buildClientMessages(gameStore.currentSession.messages),
      tacticalIntent: tacticalIntent.value, // 使用用户选择的战术意图
    });

    if (!res || !res.success || !res.data) {
      gameStore.updateMessage(thinkingId, {
        role: "system",
        content: res?.message || "重新生成失败，请稍后重试。",
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

    lastGeneratedOptions.value = res.data.options || [];
    showOverrideButton.value = true;
    tacticalIntent.value = null;

  } catch (error: any) {
    gameStore.updateMessage(thinkingId, {
      role: "system",
      content: error?.message || "重新生成失败，请稍后重试。",
      type: "text",
    });
  } finally {
    gameStore.setLoading(false);
  }
};

// 旧版生成方法（保留兼容）
const handleLegacyGenerate = async () => {
  const text = inputText.value.trim();
  if (!text || isThinking.value) return;

  gameStore.addMessage({ role: "user", content: text, type: "text" });
  const thinkingId = gameStore.addThinkingMessage();
  gameStore.setLoading(true);

  try {
    // 🆕 Task 2 & 3: 根据记忆上限截取历史记录
    const allMessages = gameStore.currentSession.messages;
    const limit = uiSettings.memoryLimit;
    const recentMessages = limit > 0 ? allMessages.slice(-limit) : [];
    
    const history = buildHistoryPayload(recentMessages);

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
  // v4.0: 初始化时间轮盘主题
  const theme = uiSettings.theme;
  document.body.classList.remove("theme-morning", "theme-sunset", "theme-night");
  document.body.classList.add(`theme-${theme}`);
});

// v8.1: 计算粒子强度
const particleIntensity = computed(() => {
  if (isThinking.value) return 'active';
  return 'idle';
});

// v8.0: 触发粒子爆发（执行战术时）
const triggerParticleBurst = (x?: number, y?: number) => {
  twilightParticlesRef.value?.burst(x, y);
};

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
  <!-- 🌌 v6.0: 动态背景 + 鼠标光源 -->
  <DynamicBackground />
  <MouseLight />
  
  <!-- 🌅 v4.0: 时间轮盘粒子系统 -->
  <TwilightParticles 
    ref="twilightParticlesRef"
    :active="uiSettings.particlesEnabled"
    :theme="uiSettings.theme"
    :intensity="particleIntensity"
  />
  
  <div class="h-screen w-screen overflow-hidden text-[var(--bubble-text)]">
    <div class="relative flex h-full w-full">
      <aside
        class="flex h-full w-[280px] flex-col border-r border-[var(--input-panel-border)] bg-[var(--bg-secondary)]/50 px-4 py-6 transition backdrop-blur-lg"
        :class="isSidebarCollapsed ? 'w-[92px]' : ''"
      >
        <!-- 🏷️ v7.0: Gal-chat 品牌 Logo -->
        <div class="mb-4">
          <GalChatLogo :collapsed="isSidebarCollapsed" />
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" @click="toggleSidebar" class="ml-auto">
              {{ isSidebarCollapsed ? '›' : '‹' }}
            </Button>
          </div>

          <Button
            class="btn-skew w-full bg-gradient-to-r from-[var(--btn-primary-from)] to-[var(--btn-primary-to)] text-white shadow-lg"
            style="box-shadow: 0 4px 20px var(--btn-primary-shadow);"
            @click="gameStore.createNewSession"
          >
            <span>{{ isSidebarCollapsed ? '+' : '新建对话' }}</span>
          </Button>
        </div>

        <Separator class="my-4 bg-[var(--input-panel-border)]" />

        <ScrollArea class="flex-1 pr-2">
          <div class="space-y-6">
            <div v-for="(items, label) in groupedSessions" :key="label" v-show="items.length">
              <p v-if="!isSidebarCollapsed" class="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {{ label }}
              </p>
              <div class="mt-2 space-y-2">
                <Button
                  v-for="session in items"
                  :key="session.id"
                  variant="ghost"
                  class="session-btn w-full justify-start truncate border border-transparent px-3 py-2 transition-all hover:translate-x-1"
                  :class="session.id === gameStore.currentSession.id ? 'session-btn-active' : ''"
                  @click="gameStore.loadSession(session.id)"
                >
                  <span class="truncate">{{ isSidebarCollapsed ? '💬' : (session.title || '未命名对话') }}</span>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator class="my-4" />

        <!-- 🔧 v7.0: 系统状态区 (左下角) -->
        <SystemStatus 
          :is-connected="connectionStore.isConnected"
          :model-name="connectionStore.modelName || '未连接'"
          :collapsed="isSidebarCollapsed"
          @open-settings="isSettingsOpen = true"
        />
      </aside>

      <section class="relative flex flex-1 flex-col overflow-hidden">
        <header class="flex items-center justify-between border-b border-white/5 px-8 py-5">
          <div>
            <p class="text-xs uppercase tracking-[0.25em] text-zinc-500">The Narrative Stream</p>
            <h2 class="text-lg font-semibold text-zinc-100">
              {{ connectionStore.modelName || '模型未就绪' }}
            </h2>
          </div>
          
          <!-- 🩺 v8.0: 心电图监视器 -->
          <ECGMonitor
            :state="isThinking ? 'analyzing' : 'idle'"
            :emotion-score="0"
            label="EMOTION"
          />
          
          <!-- �📊 状态指示器 (简化版) -->
          <div class="flex items-center gap-3">
            <span 
              class="inline-block h-2 w-2 rounded-full animate-pulse"
              :class="connectionStore.isConnected ? 'bg-emerald-400' : 'bg-red-400'"
            ></span>
            <span class="text-xs text-zinc-500 font-mono tracking-wider">
              {{ connectionStore.isConnected ? 'LINK.OK' : 'LINK.ERR' }}
            </span>
          </div>
        </header>

        <div class="pointer-events-none absolute inset-0"></div>

        <div class="relative flex-1 overflow-hidden">
          <div class="mx-auto h-full max-w-3xl px-6 py-6 gpu-accelerated">
            <ChatStream 
              @regenerate="handleRegenerate" 
              @feedback="handleFeedback"
              @score-popup="handleScorePopup"
            />
          </div>
        </div>

        <div class="input-bottom-bar absolute bottom-0 left-0 right-0 border-t gpu-accelerated effects-blur">
          <div class="mx-auto max-w-3xl px-6 py-4">
            <DestinyInput
              v-model="inputText"
              :loading="isThinking"
              :status-text="statusText"
              :tactical-intent="tacticalIntent"
              :show-override-button="showOverrideButton && !isThinking"
              placeholder="输入对话内容..."
              @generate="handleGenerate"
              @cancel="handleCancel"
              @override="handleOverride"
              @update:tactical-intent="(v) => tacticalIntent = v"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- 🆕 Task 2 & 3: 设置面板模态框 -->
    <SettingsModal :open="isSettingsOpen" @close="isSettingsOpen = false" />
    
    <!-- 🔄 v4.0: 时间轮盘切换按钮 -->
    <ThemeCycleButton />
    
    <!-- 💫 v4.0: 属性弹窗容器 -->
    <ScorePopup ref="scorePopupRef" />
    
    <!-- 💔 v7.1: 情感色彩反馈 -->
    <EmotionFlash ref="emotionFlashRef" />
  </div>
</template>
