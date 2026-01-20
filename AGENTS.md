# SmartDialog Processor (SDP) 开发指南（详细实现版）

## 项目概述

**SmartDialog Processor (SDP)** 是一款面向 Galgame 玩家与剧情互动场景的桌面应用，结合 OCR 文字识别与 LLM 生成能力，实时产出多风格对话选项，并记录用户选择以持续优化风格偏好与模板策略。

本项目的核心目标是：
- **识别**：截屏或手动输入对话文本。
- **生成**：基于模板与风格，生成 3 个高情商回复选项。
- **学习**：记录用户的选择与反馈，用于个性化偏好画像。

---

## 技术栈

### 前端 (Client)
- **运行环境**：Electron
- **渲染层**：React（renderer 目录）与 Vue 3（src 目录）并存，当前主 UI 使用 React 渲染层
- **状态管理**：Zustand
- **样式**：Tailwind CSS v4 + 自定义 CSS
- **动效**：Framer Motion

### 后端 (Backend)
- **运行时**：Python 3.10+
- **Web 框架**：FastAPI
- **AI 服务**：OpenAI 兼容接口（SiliconFlow / DeepSeek-V3）
- **数据存储**：本地 JSON（db.json）

---

## 项目结构与每一部分实现说明

```
galonline/
├── backend/                       # Python 后端
│   ├── main.py                    # FastAPI 入口与路由
│   ├── services/                  # 业务逻辑层
│   │   ├── ai_service.py          # Prompt 构造与 LLM 调用
│   │   ├── db_service.py          # 用户/会话/选择记录存取
│   │   └── ocr_service.py         # OCR 规划占位
│   ├── models/                    # Pydantic 数据模型
│   ├── db.json                    # 本地数据存储
│   ├── .env                       # 后端环境变量
│   └── requirements.txt           # Python 依赖
├── client/                        # Electron 前端
│   ├── electron/                  # Electron 主进程
│   │   ├── main.js                # 主窗口与生命周期管理
│   │   └── preload.js             # IPC 预加载脚本
│   ├── src/                       # Vue 渲染进程（历史/备用）
│   └── src/renderer/              # React 渲染进程（当前主界面）
│       ├── components/            # UI 组件
│       ├── services/              # API 封装
│       ├── store/                 # Zustand 状态管理
│       └── styles/                # 全局样式
├── README.md                      # 项目说明
└── AGENTS.md                      # AI 开发指南（本文档）
```

---

## 后端实现细节（FastAPI）

### 1. 路由层（main.py）
**职责**：接收请求、转发到服务层、格式化响应。

- `/api/generate`
  1) 接收 `text/style/history/userId`。
  2) 调用 `ai_service.generate_dialog_options()`。
  3) 将 AI 返回的字符串选项映射为前端可用的结构体（带风格、emoji、好感度）。
  4) 保存会话并返回格式化数据。

- `/api/selection`
  1) 接收选项选择信息。
  2) 保存用户选择。
  3) 返回统计数据。

### 2. AI 服务（services/ai_service.py）
**职责**：构建 Prompt、调用模型、解析结果。

实现步骤：
- 使用环境变量配置模型、超时、最大 token 与重试次数。
- `build_prompt()` 生成包含风格约束、输出 JSON 格式的提示词。
- `generate_dialog_options()` 调用 OpenAI 兼容接口并解析 JSON。
- 返回 `{ sceneSummary, options }`。

### 3. 数据服务（services/db_service.py）
**职责**：管理本地数据存储（db.json）。

实现内容：
- 用户创建/查询：`get_or_create_user()`
- 会话记录：`create_session()`
- 选择记录：`create_selection()`
- 统计信息：`get_user_stats()`

### 4. 数据模型（models/schemas.py）
**职责**：定义后端 API 的入参与出参结构。

实现内容：
- `DialogRequest`：生成接口的请求体，包含文本、风格、用户、历史。
- `SelectionRequest`：选择上报的请求体，包含会话与选项。
- `APIResponse`：统一响应结构（成功标记与可选数据）。

---

## 后端文件级实现说明（逐文件）

### backend/main.py
- **CORS 配置**：允许 Electron/React 本地端口访问，避免跨域。
- **健康检查**：`/bridge/health` 用于前端探测后端可用性。
- **生成接口**：`/api/generate` 完成 AI 调用、风格解析、选项格式化并返回。
- **选择接口**：`/api/selection` 记录用户选择并返回统计。
- **耗时统计**：生成接口返回 `generationTimeMs` 供前端显示“思考时间”。

### backend/services/ai_service.py
- **配置读取**：从环境变量加载模型名、超时、最大 token、重试次数。
- **Prompt 构造**：`build_prompt()` 生成结构化 JSON 输出指令。
- **模型调用**：`generate_dialog_options()` 发送请求并解析 JSON。
- **错误兜底**：API 失败或 JSON 解析失败时返回默认提示。

### backend/services/db_service.py
- **本地存储**：读写 `db.json`，保持轻量数据持久化。
- **用户管理**：首次请求自动创建用户。
- **会话记录**：保存用户输入、AI 选项与场景摘要。
- **选择记录**：记录用户点击选项，形成偏好数据。

### backend/models/schemas.py
- **请求模型**：`DialogRequest` / `SelectionRequest` 统一验证输入。
- **响应模型**：`APIResponse` 约束成功标记与返回数据格式。

---

## 前端实现细节（Electron + React Renderer）

### 1. Electron 主进程（client/electron/main.js）
**职责**：启动桌面窗口、加载渲染进程、处理窗口生命周期。

实现步骤：
- 创建 BrowserWindow，加载 Vite 服务器地址。
- 处理 `app.whenReady()`、`activate`、`window-all-closed` 等事件。

### 2. 渲染进程入口（client/src/renderer/index.js）
**职责**：挂载 React 根组件、载入全局样式。

### 3. 对话主流程（DialogProcessor.js）
**职责**：处理对话输入、加载状态、选项展示与用户选择。

实现细节：
- 调用 `useStore.generateOptions()` 发起生成请求。
- 将 AI 结果以消息形式写入会话状态。
- 在加载过程中展示骨架屏与实时计时。
- 统一处理选项选择并回写选择记录。

### 4. 生成输入栏（GalgameInput.js）
**职责**：提供“命运指令台”风格的输入体验。

实现细节：
- 玻璃质感容器：`backdrop-blur-xl + bg-slate-900/80`。
- 输入框无边框透明，自动高度适配。
- 生成按钮为渐变符文式 UI。
- 生成时禁用输入并显示状态文本。

### 5. 状态管理（useStore.js）
**职责**：管理 session 列表、当前对话、加载状态、请求取消。

实现细节：
- 使用 Zustand + persist 持久化用户与会话。
- 每次生成写入 user/ai 消息。
- 支持取消请求并重置 loading。

### 6. API 封装（services/api.js）
**职责**：统一对后端接口访问。

实现细节：
- `processDialog()` 调用 `/api/generate`。
- `submitSelection()` 调用 `/api/selection`。
- `checkHealth()` 用于健康检测。

---

## 前端文件级实现说明（逐文件）

### client/electron/main.js
- **窗口创建**：配置 BrowserWindow 尺寸、标题与渲染入口。
- **生命周期**：处理 `whenReady` / `activate` / `window-all-closed`。

### client/src/renderer/index.js
- **入口挂载**：创建 React 根并挂载 App。
- **样式加载**：引入全局 CSS 与主题样式。

### client/src/renderer/components/DialogProcessor.js
- **输入与提交**：收集用户文本并触发 `generateOptions()`。
- **状态管理**：读取 `isLoading`、`error`、当前会话消息。
- **消息渲染**：渲染用户与 AI 消息、历史选项。
- **加载反馈**：骨架屏 + 实时计时。
- **图像输入**：切换 OCR 上传与截图识别组件。

### client/src/renderer/components/GalgameInput.js
- **玻璃质感容器**：输入栏悬浮于底部，带虚化与阴影。
- **动效交互**：入场上滑、聚焦发光、生成时轻微收缩。
- **快捷风格**：幽默/高冷/温柔快速选择。
- **状态文本**：生成中显示“剧情同步”类提示与耗时。

### client/src/renderer/components/GalgameOptions.js
- **场景旁白**：打字机效果渲染 `sceneSummary`。
- **选项卡片**：基于风格/类型变换主题色。
- **动效入场**：Framer Motion stagger 动画。

### client/src/renderer/services/api.js
- **统一请求**：Axios 封装 baseURL 与超时。
- **接口调用**：`processDialog`/`submitSelection`/`checkHealth`。

### client/src/renderer/store/useStore.js
- **会话模型**：维护 session 列表与当前会话。
- **生成流程**：追加用户消息 → 请求后端 → 写入 AI 结果。
- **选择记录**：选择选项后提交到后端并写入本地。
- **取消请求**：使用 `AbortController` 中断生成。

---

## 启动与开发流程

### 后端
1) 进入 `backend/`
2) 安装依赖：`pip install -r requirements.txt`
3) 启动：`uvicorn main:app --reload --host 127.0.0.1 --port 8000`

### 前端
1) 进入 `client/`
2) 安装依赖：`pnpm install`
3) 启动：`pnpm dev`

---

## 环境变量说明

`.env` 中常用配置：
- `SILICONFLOW_API_KEY`：模型 API Key
- `AI_MODEL`：默认模型名
- `AI_MAX_TOKENS`：最大生成 token
- `AI_TIMEOUT_READ/CONNECT`：超时控制
- `AI_HISTORY_LIMIT`：历史上下文长度

---

## 注意事项

1. **接口响应时间** 取决于 Prompt 长度与模型负载。
2. **生成稳定性** 与 JSON 解析成功率相关，必要时可增加兜底处理。
3. **前端渲染层** 当前以 React 为主，Vue 目录为历史结构，后续需统一栈。
4. **OCR 逻辑** 为规划模块，尚未稳定集成。

---

## 资源链接

- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Framer Motion 文档](https://www.framer.com/motion/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)

**最后更新**: 2026-01-20
