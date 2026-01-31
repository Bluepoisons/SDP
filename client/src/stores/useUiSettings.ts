import { defineStore } from "pinia";

/**
 * 🌅 v2.1 双主题系统（移除 Morning）
 * Sunset (黄昏) ↔ Night (深夜)
 */
type ThemeMode = "sunset" | "night";

// 双主题循环
const THEME_CYCLE: ThemeMode[] = ["sunset", "night"];

interface UiSettingsState {
  animationsEnabled: boolean;
  blurEnabled: boolean;
  shadowEnabled: boolean;
  memoryLimit: number;
  theme: ThemeMode;
  particlesEnabled: boolean;
  optionTypewriter: boolean;  // v9.0: 选项打字机效果
}

export const useUiSettings = defineStore("uiSettings", {
  state: (): UiSettingsState => ({
    animationsEnabled: true,   // v9.0: 默认开启
    blurEnabled: true,         // v9.0: 默认开启
    shadowEnabled: true,       // v9.0: 默认开启
    memoryLimit: 10,
    theme: "sunset",           // 🌆 默认黄昏主题
    particlesEnabled: true,
    optionTypewriter: true,    // v9.0: 默认开启选项打字机
  }),
  getters: {
    // 获取当前主题图标
    themeIcon: (state): string => {
      switch (state.theme) {
        case "sunset": return "🌆";
        case "night": return "🌙";
        default: return "🌆";
      }
    },
    // 获取下一个主题
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
    
    // 主题切换 (双态循环)
    setTheme(theme: ThemeMode) {
      // 兼容：如果是旧的 morning 主题，自动转为 sunset
      if (theme === "morning" as any) {
        theme = "sunset";
      }
      this.theme = theme;
      document.body.classList.remove("theme-morning", "theme-sunset", "theme-night");
      document.body.classList.add(`theme-${theme}`);
    },
    
    // 轮盘切换
    cycleTheme() {
      this.setTheme(this.nextTheme);
    },
    
    setParticlesEnabled(value: boolean) {
      this.particlesEnabled = value;
    },
    
    // v9.0: 选项打字机开关
    setOptionTypewriter(value: boolean) {
      this.optionTypewriter = value;
    },
    
    // 初始化主题
    initTheme() {
      // 兼容：如果存储的是 morning，自动转为 sunset
      if (this.theme === "morning" as any) {
        this.theme = "sunset";
      }
      this.setTheme(this.theme);
    },
  },
  persist: {
    key: "gal-ui-settings",
  },
});
