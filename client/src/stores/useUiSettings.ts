import { defineStore } from "pinia";

interface UiSettingsState {
  animationsEnabled: boolean;
  blurEnabled: boolean;
  shadowEnabled: boolean;
}

export const useUiSettings = defineStore("uiSettings", {
  state: (): UiSettingsState => ({
    animationsEnabled: false,
    blurEnabled: false,
    shadowEnabled: false,
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
  },
  persist: {
    key: "gal-ui-settings",
  },
});
