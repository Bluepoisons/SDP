import { defineStore } from "pinia";

interface UiSettingsState {
  animationsEnabled: boolean;
  blurEnabled: boolean;
  shadowEnabled: boolean;
  memoryLimit: number; // 🆕 Task 2 & 3: 记忆上限 (消息条数)
}

export const useUiSettings = defineStore("uiSettings", {
  state: (): UiSettingsState => ({
    animationsEnabled: false,
    blurEnabled: false,
    shadowEnabled: false,
    memoryLimit: 10, // 🆕 默认 10 条消息 (5 轮对话)
  }),
  actions: {
    setAnimationsEnabled(value: boolean) {
      this.animationsEnabled = value;
    },
    setBlurEnabled(value: boolean) {
      this.blurEnabled = value;
    },
    setShadowEnabled(value: boolean) {
      this.shadowEnabled = value;
    },
    setMemoryLimit(limit: number) {
      // 🆕 Task 2 & 3: 设置记忆上限
      this.memoryLimit = Math.max(0, Math.min(60, limit)); // 限制范围 0-60
    },
  },
  persist: {
    key: "gal-ui-settings",
  },
});
