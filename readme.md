# SDP
SmartDialog Processor (SDP) - Galgame 剧本对话辅助器

## 功能概览
- 对话输入 → AI 生成场景与选项
- 用户选择记录（用于偏好与训练数据）
- 桌面端（Electron）+ 本地 FastAPI 服务
- 视觉特效可在“设置”中分项开关（动画/模糊/阴影）

## 技术栈
- 前端：Electron + React（主渲染）/ Vue 3（历史/备用）
- 状态管理：Zustand（React 渲染）
- 样式：Tailwind CSS + 自定义 CSS
- 后端：FastAPI（Python 3.10+）
- 数据存储：本地 JSON（db.json）

## 开发指南 (Development Guide)

### 1. 环境准备
- Node.js (v18+)
- Python (v3.10+)
- pnpm

### 2. 后端设置 (Backend)
后端使用 Python FastAPI + 本地 JSON 存储。

```bash
cd backend
# 建议创建并激活虚拟环境 (可选)
# python -m venv .venv
# .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
# 启动开发服务器
cd D:\All_codes\galonline\backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**注意**：必须在 `backend` 目录中启动，否则会报 "Could not import module 'main'" 错误。

**最新更新 (2026-01-30)**：

### v8.0 - 指挥官系统 (Commander System) ⚔️🎯
**核心升级**：从"被动对话生成器"升级为"主动恋爱战术参谋系统"。

- ✅ **Phase 1: 后端架构重构**
  - 🎯 API 双阶段拆分：`/api/analyze`（态势感知） + `/api/execute`（战术执行）
  - 📊 新增 `SituationAnalysis` 数据模型（情绪分数、意图推测、策略建议）
  - 🔍 连发消息检测（`burst_detected`）与压迫感等级（`pressure_level`）
  - 💡 10种意图类型（试探边界/求关注/吃醋/冷战等）
  - ⚔️ 10种战术策略（进攻调情/防守调情/安抚/冷处理/推拉等）

- ✅ **Phase 2: 战术面板 (TacticsBoard)**
  - 📋 可视化 AI 分析结果（局势总结、情绪仪表、意图标签）
  - ✏️ 用户可编辑战术参数（修改情绪分数、切换策略）
  - 🚀 [执行战术] 按钮触发 Phase 2 生成

- ✅ **Phase 3: 连发模式 (Burst Mode)**
  - ⌨️ `Shift + Enter` 换行输入多条消息
  - ➕ 点击 [+] 按钮添加新气泡
  - 💬 实时预览气泡堆叠效果
  - 🔥 后端特别处理连发带来的"情绪压迫感"

- ✅ **Phase 4: 心电图监视器 (ECG Monitor)**
  - 💓 顶部导航栏实时情绪可视化
  - 🟢 Idle: 平缓绿色波形
  - 🟡 Analyzing: 快速黄色波形
  - 🔴 High Emotion: 剧烈红/粉色波形 + Glitch 效果
  - 📈 模拟 BPM 显示

**新流程**：`Input → Analyze → (Edit Tactics) → Execute → Options`

---

### v7.1 - UI/UX 专业级打磨 🎨
- ✅ 输入框光效简化（去除呼吸动画，仅保留 1px 边框光）
- ✅ 选项卡片 Shine 扫光效果 + 按压反馈
- ✅ 设置面板 "NEURAL_LINK::CONFIG" 主题
- ✅ 本地模型锁定状态 + 抖动动画
- ✅ 自定义滚动条（6px 细轨道）
- ✅ 情感色彩反馈（EmotionFlash）

### v7.0 - Gal-chat 品牌系统 💠
- ✅ GalChatLogo 品牌标识
- ✅ SystemStatus 侧边栏（连接状态 + 设置入口）
- ✅ ThemeToggle "Divergence Meter" 世界线切换

---

### v2.1 - 历史记忆与日志系统 🧠📝
- ✅ **Task 2 后端增强**：
  - 🧠 历史上下文记忆系统（8-32条可配置）
  - 📝 系统日志查看接口 `/api/system/logs`
  - 🔄 AI 现在能理解对话背景，给出连贯建议
  - 📊 日志自动滚动管理（10MB切分，7天保留）

- ✅ **Task 3 前端功能升级**：
  - ⚙️ 现代化设置面板（玻璃态设计 + Framer Motion动画）
  - 🎚️ 记忆深度滑块（8-32条，实时调节）
  - 🖥️ 开发者日志查看器（终端风格，实时刷新）
  - 🗑️ 一键清除所有会话记录
  - 📈 统计信息显示（会话数、记忆模式）

### v2.0 - 恋爱军师系统 💘
- ✅ 后端已重构为"恋爱军师"模式（5种风格：高冷/傲娇/元气/谄媚/中二）
- ✅ 自动随机抽取 3 种风格生成回复建议
- ✅ 每个选项包含情商评分 (-3 到 +3)
- ✅ 前端兼容性已修复（旧接口 `/api/generate` 自动转换格式）
- ✨ **新增好感度可视化系统**：
  - 根据评分显示不同颜色边框（绿色=高情商，红色=低情商）
  - 好感度标签带图标（💚💖💬💔❌）和发光效果
  - 悬停时边框光晕增强，提供即时视觉反馈
- 📄 详细说明见：
  - [TASK2_3_IMPLEMENTATION_SUMMARY.md](TASK2_3_IMPLEMENTATION_SUMMARY.md) - 完整实现总结
  - [TASK2_MEMORY_LOGS.md](backend/TASK2_MEMORY_LOGS.md) - 后端记忆与日志系统
  - [FRONTEND_COMPATIBILITY_FIX.md](backend/FRONTEND_COMPATIBILITY_FIX.md) - 后端接口兼容
  - [FAVOR_SYSTEM_DESIGN.md](client/FAVOR_SYSTEM_DESIGN.md) - 好感度视觉系统
  - [TESTING_GUIDE.md](TESTING_GUIDE.md) - 快速测试指南

### 3. 前端设置 (Client)
前端使用 Electron + React（主渲染）/ Vue 3（历史/备用）。

```bash
cd client
# 安装依赖
pnpm install
# 启动开发模式 (同时启动 Vite 和 Electron)
pnpm dev
```

### 4. 项目结构
- `backend/`: Python 后端
  - `main.py`: FastAPI 入口
  - `services/`: 业务逻辑 (AI, DB)
  - `models/`: 数据模型
  - `db.json`: 本地数据库文件
- `client/`: Electron 前端
  - `electron/`: Electron 主进程
  - `src/renderer/`: React 渲染进程（当前主界面）
  - `src/`: Vue 渲染进程（历史/备用）

## 预期补充
- OCR 模块稳定接入（截图/图片输入→文本识别）
- 统一前端栈（逐步收敛到 React 或 Vue 单一渲染层）
- 生成结果稳定性优化（JSON 解析兜底、重试与降级策略）
- 偏好画像与个性化权重策略（基于选择记录）
- 数据可视化面板（生成次数、风格偏好、命中率）
- 本地模型/可选远端模型切换与配置 UI
