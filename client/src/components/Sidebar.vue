<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { Bot, Camera, History, Settings, User } from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useAuthStore } from "@/stores/useAuthStore";

const props = defineProps<{
  activeTab: string;
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: "update:activeTab", value: string): void;
}>();

const tabs = [
  { id: "dashboard", label: "对话面板", icon: Bot },
  { id: "capture", label: "屏幕捕获", icon: Camera },
  { id: "history", label: "对话历史", icon: History },
  { id: "settings", label: "系统设置", icon: Settings },
];

const titleClass = computed(() =>
  "text-sm font-medium uppercase tracking-[0.2em] text-zinc-500"
);

const panelClass = computed(() => "flex w-full flex-col gap-6");

const subtitleClass = computed(() => "text-xs text-zinc-400");

const navActiveClass = computed(() => "bg-white/10 text-white border-l-2 border-indigo-500");

const navInactiveClass = computed(() => "text-zinc-300 hover:bg-white/5");

const statusCardClass = computed(() => "mt-auto rounded-xl border border-white/10 bg-white/5 p-4");

const statusTextClass = computed(() => "text-xs text-zinc-400");

const handleSelect = (id: string) => emit("update:activeTab", id);

const connectionStore = useConnectionStore();
const authStore = useAuthStore();

const statusLabel = computed(() =>
  connectionStore.isConnected ? "连接正常" : "未连接"
);

const latencyLabel = computed(() => {
  if (!connectionStore.isConnected || connectionStore.latencyMs === null) return "--";
  return `${connectionStore.latencyMs}ms`;
});

onMounted(() => {
  connectionStore.startAutoCheck();
});

onBeforeUnmount(() => {
  connectionStore.stopAutoCheck();
});
</script>

<template>
  <aside :class="panelClass">
    <div>
      <div class="flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
          <Bot class="h-5 w-5" />
        </div>
        <div>
          <p class="logo-text text-xl font-semibold bg-gradient-to-r from-indigo-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            SmartDialog
          </p>
          <p :class="subtitleClass">Galgame AI 助手</p>
        </div>
      </div>
      <p class="mt-4 text-sm text-zinc-400">
        用更懂人性的回复，点亮每一次剧情分叉。
      </p>
    </div>

    <div class="space-y-3">
      <p :class="titleClass">导航</p>
      <div class="flex flex-col gap-2">
        <Button
          v-for="tab in tabs"
          :key="tab.id"
          variant="ghost"
          class="justify-start border-l-2 border-transparent transition-all"
          :class="props.activeTab === tab.id ? navActiveClass : navInactiveClass"
          @click="handleSelect(tab.id)"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </Button>
      </div>
    </div>

    <!-- 🔐 v10.0: 用户信息卡片 -->
    <div class="rounded-xl border border-[var(--accent-color)]/20 bg-[var(--accent-color)]/5 p-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-color)]/20 text-[var(--accent-color)]">
          <User class="h-5 w-5" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">{{ authStore.username || 'Unknown' }}</p>
          <p class="text-xs text-[var(--accent-color)]">NEURAL LINKED</p>
        </div>
        <div class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="在线"></div>
      </div>
    </div>

    <div :class="statusCardClass">
      <p class="text-sm font-medium">今日状态</p>
      <div class="mt-2 flex items-center gap-2" :class="statusTextClass">
        <span
          class="h-2 w-2 rounded-full"
          :class="connectionStore.isConnected ? 'bg-emerald-400' : 'bg-red-400'"
        />
        <span>后端：{{ statusLabel }}</span>
        <span v-if="connectionStore.isConnected">· 延迟 {{ latencyLabel }}</span>
      </div>
      <p v-if="connectionStore.errorMessage" class="mt-2 text-xs text-red-400">
        {{ connectionStore.errorMessage }}
      </p>
      <Button
        v-if="!connectionStore.isConnected"
        class="mt-3 w-full"
        variant="secondary"
        :disabled="connectionStore.isStarting"
        @click="connectionStore.startBackend"
      >
        {{ connectionStore.isStarting ? "启动中..." : "启动后端" }}
      </Button>
    </div>
  </aside>
</template>
