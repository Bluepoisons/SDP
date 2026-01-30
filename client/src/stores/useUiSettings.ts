import { defineStore } from "pinia";

/**
 * 🌅 v4.0 时间轮盘主题系统
 * Morning (清晨) ➔ Sunset (黄昏) ➔ Night (深夜) ➔ Morning...
 */
type ThemeMode = "morning" | "sunset" | "night";

// 时间轮盘顺序
const THEME_CYCLE: ThemeMode[] = ["morning", "sunset", "night"];

interface UiSettingsState {
  animationsEnabled: boolean;
  blurEnabled: boolean;
  shadowEnabled: boolean;
  memoryLimit: number;
  theme: ThemeMode;
  particlesEnabled: boolean;
}

export const useUiSettings = defineStore("uiSettings", {
  state: (): UiSettingsState => ({
    animationsEnabled: false,
    blurEnabled: false,
    shadowEnabled: false,
    memoryLimit: 10,
    theme: "morning",     // 🧪 测试：默认清晨主题
    particlesEnabled: true,
  }),
  getters: {
    // v4.0: 获取当前主题图标
    themeIcon: (state): string => {
      switch (state.theme) {
        case "morning": return "☀️";
        case "sunset": return "🌆";
        case "night": return "🌙";
      }
    },
    // v4.0: 获取下一个主题
    nextTheme: (state): ThemeMode => {
      const currentIndex = THEME_CYCLE.indexOf(state.theme);
      return THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
    },
  },
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
      this.memoryLimit = Math.max(0, Math.min(60, limit));
    },
    
    // v4.0: 主题切换 (三态循环)
    setTheme(theme: ThemeMode) {
      this.theme = theme;
      // 移除所有主题 class，添加当前主题
      document.body.classList.remove("theme-morning", "theme-sunset", "theme-night");
      document.body.classList.add(`theme-${theme}`);
    },
    
    // v4.0: 轮盘切换 - 点击循环到下一个主题
    cycleTheme() {
      this.setTheme(this.nextTheme);
    },
    
    setParticlesEnabled(value: boolean) {
      this.particlesEnabled = value;
    },
    
    // 初始化主题（应用启动时调用）
    initTheme() {
      // 直接应用当前主题
      this.setTheme(this.theme);
    },
  },
  persist: {
    key: "gal-ui-settings",
  },
});

