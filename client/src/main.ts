import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import "./assets/main.css";
// ❌ 已移除 galgame-theme.css 重复引用，main.css 内部已 @import

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.mount("#app");
