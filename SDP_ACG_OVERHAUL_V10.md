# 🎮 SDP v10.0: Project "Neural Dive" - 二次元深度重构计划

> **参考源**: `ChatGPT-Next-Web-Pro` (架构逻辑/配置管理) + `User Idea` (OCR流)
> **设计哲学**: **UI 即世界观 (UI as Lore)**。
> **目标**: 将通用聊天工具的"设置、视觉、鉴权"重构为 Galgame 的"系统菜单、战术分析、登入界面"。
> **最后更新**: 2026-02-01

---

## 目录
1.  [🔐 登入系统：Title Screen (标题画面)](#1-登入系统title-screen-标题画面)
2.  [⚙️ 设置系统：System Config (终端调校)](#2-设置系统system-config-终端调校)
3.  [👁️ 视觉智能：Tactical Vision (战术目视 - 截图流)](#3-视觉智能tactical-vision-战术目视---截图流)
4.  [🏗️ 架构参考：从 React 到 Vue 的迁移策略](#4-架构参考从-react-到-vue-的-迁移策略)
5.  [✅ 实现状态](#5-实现状态)

---

## 1. 🔐 登入系统：Title Screen (标题画面)

**参考点**: NextChat 的 Auth 只是一个简单的输入框。
**二游化改造**: 这是一个**游戏的开始**。它不叫"登录"，叫 **"Link Start" (连接/潜入)**。

### A. 视觉设计：Start Menu ✅ 已实现
* **背景**: 动态的 `TwilightParticles`（根据时间自动切换流星/萤火虫）。
* **Logo**: 巨大的 `Gal♥chat` Logo 居中呼吸，带有渐变特效。
* **交互**:
    * 界面上默认没有输入框，只有一行闪烁的文字：`[ PRESS ANY KEY TO START ]`。
    * 按下任意键后，镜头推近 (CSS Scale In)，Logo 上移，下方浮现出玻璃态的"身份验证卡片"。

### B. 组件设计：`LoginPage.vue` ✅ 已实现
* **卡片设计**: 模仿 ID 卡或通行证。
* **注册 (New Game)**:
    * 文案: "建立新档案 / Register Protocol"
    * 特效: 输入框聚焦时，会有扫描线扫过。
* **登录 (Continue)**:
    * 文案: "神经连接 / Link Start"
    * 按钮: 渐变色发光按钮。
    * **Loading**: 点击登录后，播放一段"系统初始化"的进度条动画（System Initializing... Memory Loaded... Emotion Module Online...），而不是枯燥的转圈圈。

### C. 相关文件
- `src/components/LoginPage.vue` - 登录页面主组件
- `src/stores/useAuthStore.ts` - 认证状态管理
- `src/App.vue` - 路由守卫集成

---

## 2. ⚙️ 设置系统：System Config (终端调校)

**参考点**: NextChat 的 `Settings` 包含模型配置、界面设置、Mask（面具）等。
**二游化改造**: 将其包装为**"战术终端的控制面板"**。

### A. 入口与布局 ✅ 已实现
* **触发**: 侧边栏底部的齿轮图标。点击后，弹出科技风格的 Modal。
* **Tab 分类**:
    1.  **📺 显像管 (Graphics)**: 字体（圆体/宋体）、字号、主题（时间轮盘）、背景粒子开关。
    2.  **🧠 核心逻辑 (Core)**: 模型选择 (Qwen/GPT-4)、温度 (创造力/随机性)、记忆上限 (History Limit)。
    3.  **🔊 声波 (Audio)**: TTS 语音包选择（毒舌/温柔）、音效音量。[规划中]
    4.  **💾 档案管理 (Data)**: 导出对话、清除记忆、同步云端。[规划中]

### B. 字体选择器 (Font Selector) ✅ 已实现
参考 NextChat 的 Slider/Select 实现，但增加**实时预览**。
* **组件**: `FontTuner.vue`
* **UI**:
    * 左侧是字体列表（方块状，展示 "Aa"）。
    * 右侧是预览区：显示一句经典的二次元台词，随着左侧选择实时变化字体。
* **逻辑**: 绑定 `useUiSettings` Store，直接修改 CSS Variable `--font-primary`。

### C. 相关文件
- `src/components/SettingsModal.vue` - 设置弹窗容器
- `src/components/panels/SettingsPanel.vue` - 设置面板内容
- `src/components/FontTuner.vue` - 字体选择器组件

---

## 3. 👁️ 视觉智能：Tactical Vision (战术目视 - 截图流)

**参考点**: NextChat 的图片上传、压缩、Base64 处理逻辑。
**结合你的思路**: **"拖入 -> 自动感知 -> 战术白板 -> 决策"**。

### A. 交互流程 (The Flow) ✅ 已实现

1.  **Drop Zone (拖入感应)**:
    * 当用户拖拽截图进入窗口时，整个界面变暗，显示高亮的虚线框，中心显示 `[ ANALYZE TARGET ]`。

2.  **Staging Area (战术情报板)**:
    * 图片上传后，**不**直接发给 AI。而是弹出一个**"情报确认"**面板（覆盖在聊天流之上）。
    * **左侧**: 图片预览（带缩放功能）。
    * **右侧**: OCR 识别出的文本流（气泡状）。
    * **AI 预判**: 顶部显示 AI 的初步判断 `[检测到高压情绪: 愤怒] (Confidence: 85%)`。

3.  **Edit & Execute (指挥官决策)**:
    * 用户可以点击 OCR 文本进行修正（防止识别错误）。
    * 可以切换每条对白的"说话人"（主角/NPC）。
    * 点击底部的 **"开始战术推演"** 按钮，此时才将整理好的 Prompt 发送给 LLM 生成回复。

### B. 关键组件：`ScreenshotAnalyzer.vue` ✅ 已实现

功能特性:
- 图片预览（支持缩放）
- OCR 气泡编辑
- 角色切换（主角/NPC）
- AI 情绪预判显示
- 置信度指示

---

## 4. 🏗️ 架构参考：从 React 到 Vue 的迁移策略

NextChat 是 React + Zustand。我们使用 Vue 3 + Pinia。

### A. 配置持久化 (Persist Store) ✅ 已实现

使用 `pinia-plugin-persistedstate` 将设置存入 LocalStorage。

* **已持久化字段**: 
  - `theme` (主题)
  - `animationsEnabled` (动画开关)
  - `blurEnabled` (模糊开关)
  - `shadowEnabled` (阴影开关)
  - `memoryLimit` (记忆上限)
  - `particlesEnabled` (粒子开关)
  - `optionTypewriter` (打字机效果)
  - `isAuthenticated` / `username` (认证信息)

### B. 多模态处理 (Vision Model) 🚧 规划中

NextChat 处理图片时，会先压缩图片再转 Base64，防止 Token 爆炸。

* **规划方案**:
  * 创建一个 `useVision` Composable。
  * 实现 `compressImage(file, maxSize)` 函数。
  * 实现 `fileToBase64(file)` 函数。
  * 检查模型是否支持 vision，不支持则调用 OCR 转纯文本。

### C. 路由守卫 (Auth Guard) ✅ 已实现

通过 `App.vue` 中的条件渲染实现：
- 未登录时显示 `LoginPage`
- 登录后显示 `AppLayout`
- 登录状态持久化到 LocalStorage

---

## 5. ✅ 实现状态

### P0 - 核心功能 ✅
- [x] `LoginPage.vue` - Link Start 登录界面
- [x] `useAuthStore.ts` - 认证状态管理
- [x] App.vue 路由守卫集成

### P1 - 设置系统 ✅
- [x] `FontTuner.vue` - 字体选择器（带实时预览）
- [x] `SettingsPanel.vue` - 增加字体选择和登出功能
- [x] `Sidebar.vue` - 显示当前用户信息

### P2 - 截图分析 ✅
- [x] `ScreenshotAnalyzer.vue` - 战术目视面板
- [ ] OCR 服务集成（待后端支持）
- [ ] 图片压缩 Composable

### P3 - 增强功能 🚧
- [ ] TTS 语音设置
- [ ] 对话导出功能
- [ ] 云端同步

---

## 📁 新增文件清单

```
client/src/
├── components/
│   ├── LoginPage.vue          # 🆕 Link Start 登录页
│   ├── FontTuner.vue          # 🆕 字体选择器
│   └── ScreenshotAnalyzer.vue # 🆕 截图分析器
└── stores/
    └── useAuthStore.ts        # 🆕 认证状态
```

---

## 🎨 设计原则回顾

1. **UI 即世界观**: 每个界面都是游戏世界的一部分
2. **沉浸式反馈**: 用动画和特效替代枯燥的提示
3. **二游化配色**: 渐变、发光、玻璃质感
4. **欢喜体标题**: 使用 ZCOOL KuaiLe 字体增加活力
5. **科技感装饰**: 扫描线、呼吸灯、进度条动画

---

**文档版本**: v10.0
**最后更新**: 2026-02-01
