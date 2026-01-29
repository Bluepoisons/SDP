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
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

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
