# SDP - SmartDialog Processor

**暮光军师 v8.0** - 沉浸式恋爱战术指挥终端

一款面向 Galgame 玩家与剧情互动场景的桌面应用，结合 AI 生成能力，实时产出多风格对话选项，并记录用户选择以持续优化偏好画像。

## ✨ 核心功能

### 🎯 双阶段战术系统
- **Phase 1: 态势感知** - AI 分析对方情绪、意图与局势
- **Phase 2: 战术执行** - 基于用户确认的分析结果生成回复选项
- **用户可编辑** - 修正 AI 判断，调整情绪分数与策略方向

### 🌅 三大视觉主题
- **深潜 (Deep Dive)** - 赛博星空冷峻科技风
- **心跳 (Heartbeat)** - 恋爱中毒粉色甜蜜风  
- **黄昏 (Twilight)** - 暮光余晖温暖希望风 ⭐

### 🎮 增强交互体验
- **连发模式** - `Shift+Enter` 多行输入，模拟情绪压迫感
- **心电监视器** - 实时可视化情绪状态变化
- **光尘粒子** - 黄昏主题专属浮光特效
- **OCR 预审** - 截图识别 + 左右分轨校对

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.10+
- pnpm

### 1. 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. 前端启动
```bash
cd client
pnpm install
pnpm dev
```

### 3. 访问应用
- 应用自动打开 Electron 桌面窗口
- 后端健康检查：http://127.0.0.1:8000/bridge/health

## 📂 项目结构
```
galonline/
├── backend/           # Python FastAPI 后端
│   ├── main.py        # 入口 + API 路由  
│   ├── services/      # AI服务 + 数据库服务
│   ├── models/        # Pydantic 数据模型
│   └── db.json        # 本地数据存储
├── client/            # Electron + Vue/React 前端
│   ├── electron/      # Electron 主进程
│   ├── src/           # Vue 渲染进程（历史）
│   └── src/renderer/  # React 渲染进程（当前主界面）
└── AGENTS.md          # AI 开发指南
```

## 🎨 技术栈
- **前端**: Electron + React/Vue 3 + TypeScript
- **状态管理**: Zustand + Pinia
- **样式**: Tailwind CSS v4 + 自定义主题
- **动效**: Framer Motion + CSS 动画
- **后端**: FastAPI + Pydantic
- **AI 服务**: OpenAI 兼容接口（SiliconFlow/DeepSeek）
- **数据存储**: 本地 JSON

## ⚙️ 配置说明

### AI 模型配置
在 `backend/.env` 中配置：
```bash
SILICONFLOW_API_KEY=your_api_key
AI_MODEL=deepseek-chat
AI_MAX_TOKENS=2048
AI_TIMEOUT_READ=30
```

### 用户设置
- 记忆容量：控制对话历史上下文长度（0-60条）
- 视觉特效：动画/模糊/阴影分项开关
- 主题切换：Deep/Heartbeat/Twilight 三选一
- 粒子特效：黄昏主题专属光尘效果

## 🎯 使用流程

1. **输入对话** - 键入或粘贴对方消息
2. **态势分析** - AI 分析情绪、意图、策略建议  
3. **编辑确认** - 在战术面板中调整分析结果
4. **执行战术** - 生成 3 个高情商回复选项
5. **选择回复** - 记录选择用于偏好学习

## 📋 开发计划

- [ ] OCR 截图识别稳定集成
- [ ] 智能剪贴板监控
- [ ] 本地模型支持
- [ ] 多语言国际化
- [ ] 插件系统

## 📝 版本历史

- **v8.0** - 暮光军师：双阶段战术 + 三主题 + OCR预审
- **v7.1** - UI/UX 专业级打磨
- **v7.0** - Gal-chat 品牌系统
- **v2.1** - 历史记忆与日志系统
- **v2.0** - 恋爱军师系统

---

**最后更新**: 2026-01-30  
**作者**: SDP Team  
**开源协议**: MIT License
