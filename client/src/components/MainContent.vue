<script setup lang="ts">
import DashboardPanel from "@/components/panels/DashboardPanel.vue";
import CapturePanel from "@/components/panels/CapturePanel.vue";
import HistoryPanel from "@/components/panels/HistoryPanel.vue";
import SettingsPanel from "@/components/panels/SettingsPanel.vue";

defineProps<{ activeTab: string; isDark: boolean }>();
</script>

<template>
  <main
    class="flex-1 rounded-2xl border p-8 shadow-xl"
    :class="isDark
      ? 'border-zinc-800 bg-zinc-950/60'
      : 'border-zinc-200 bg-white/80'"
  >
    <DashboardPanel v-if="activeTab === 'dashboard'" />
    <CapturePanel v-else-if="activeTab === 'capture'" />
    <HistoryPanel v-else-if="activeTab === 'history'" />
    <SettingsPanel v-else-if="activeTab === 'settings'" />
  </main>
</template>
