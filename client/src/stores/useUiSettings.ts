import { defineStore } from "pinia";

/**
 * 🌅 v2.3 双态主题系统 + 字体调谐
 * Sunset (黄昏/治愈) ↔ Night (深夜/赛博)
 */
type ThemeMode = "sunset" | "night";
type FontFamily = "rounded" | "happy" | "noto" | "serif";

// 双态主题循环
const THEME_CYCLE: ThemeMode[] = ["sunset", "night"];

// 字体映射表
const FONT_MAP: Record<FontFamily, string> = {
  rounded: '"M PLUS Rounded 1c", "Noto Sans SC", sans-serif',
  happy: '"ZCOOL KuaiLe", "Noto Sans SC", cursive',
  noto: '"Noto Sans SC", "PingFang SC", sans-serif',
  serif: '"Noto Serif SC", "SimSun", serif',
};

interface UiSettingsState {
  animationsEnabled: boolean;
  blurEnabled: boolean;
  shadowEnabled: boolean;
  memoryLimit: number;
  theme: ThemeMode;
  particlesEnabled: boolean;
  optionTypewriter: boolean;  // v9.0: 选项打字机效果
  fontFamily: FontFamily;     // v10.0: 字体选择
}

export const useUiSettings = defineStore("uiSettings", {
  state: (): UiSettingsState => ({
    animationsEnabled: true,   // v9.0: 默认开启
    blurEnabled: true,         // v9.0: 默认开启
    shadowEnabled: true,       // v9.0: 默认开启
    memoryLimit: 10,
    theme: "night",            // 🌙 默认深夜主题
    particlesEnabled: true,
    optionTypewriter: true,    // v9.0: 默认开启选项打字机
    fontFamily: "rounded",     // 🎨 默认圆润字体
  }),
  getters: {
    // 获取当前主题图标
    themeIcon: (state): string => {
      switch (state.theme) {
        case "sunset": return "🌸";  // 蔚蓝档案治愈风
        case "night": return "🌙";
        default: return "🌙";
      }
    },
    // 获取当前字体 CSS 值
    fontFamilyCSS: (state): string => {
      return FONT_MAP[state.fontFamily] || FONT_MAP.rounded;
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
    
    // 🎨 v10.0: 字体切换
    setFontFamily(font: FontFamily) {
      this.fontFamily = font;
      // 应用到 CSS 变量
      document.documentElement.style.setProperty(
        '--font-family-app', 
        FONT_MAP[font] || FONT_MAP.rounded
      );
    },
    
    // 初始化字体
    initFont() {
      this.setFontFamily(this.fontFamily);
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
      this.setTheme(this.theme);
      this.initFont(); // 同时初始化字体
    },
  },
  persist: {
    key: "gal-ui-settings",
  },
});
