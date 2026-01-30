import { defineStore } from "pinia";

// v8.0: 主题类型
type ThemeMode = "deep" | "heartbeat" | "twilight";

interface UiSettingsState {
  animationsEnabled: boolean;
  blurEnabled: boolean;
  shadowEnabled: boolean;
  memoryLimit: number; // 🆕 Task 2 & 3: 记忆上限 (消息条数)
  theme: ThemeMode;    // v8.0: 当前主题
  particlesEnabled: boolean; // v8.0: 粒子特效开关
}

export const useUiSettings = defineStore("uiSettings", {
  state: (): UiSettingsState => ({
    animationsEnabled: false,
    blurEnabled: false,
    shadowEnabled: false,
    memoryLimit: 10, // 🆕 默认 10 条消息 (5 轮对话)
    theme: "twilight", // v8.0: 默认黄昏主题
    particlesEnabled: true, // v8.0: 默认开启粒子
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
    // v8.0: 主题切换
    setTheme(theme: ThemeMode) {
      this.theme = theme;
      // 更新 body class
      document.body.classList.remove("theme-heartbeat", "theme-twilight");
      if (theme === "heartbeat") {
        document.body.classList.add("theme-heartbeat");
      } else if (theme === "twilight") {
        document.body.classList.add("theme-twilight");
      }
    },
    // v8.0: 粒子开关
    setParticlesEnabled(value: boolean) {
      this.particlesEnabled = value;
    },
    // v8.0: 初始化主题（应用启动时调用）
    initTheme() {
      this.setTheme(this.theme);
    },
  },
  persist: {
    key: "gal-ui-settings",
  },
});

