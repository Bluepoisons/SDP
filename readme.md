# SDP - SmartDialog Processor

**时间轮盘 v4.0** - 沉浸式恋爱战术指挥终端

一款面向 Galgame 玩家与剧情互动场景的桌面应用，结合 AI 生成能力，实时产出多风格对话选项，并记录用户选择以持续优化偏好画像。

## ✨ 核心功能

### 🎯 双阶段战术系统
- **Phase 1: 态势感知** - AI 分析对方情绪、意图与局势
- **Phase 2: 战术执行** - 基于用户确认的分析结果生成回复选项
- **用户可编辑** - 修正 AI 判断，调整情绪分数与策略方向

### 🌅 时间轮盘主题系统 (v4.0 新增)
> ☀️ Morning → 🌆 Sunset → 🌙 Night → ☀️ ...

| 主题 | 配色风格 | 粒子特效 | 设计参考 |
|------|---------|---------|---------|
| **清晨 Morning** | 蓝白干净通透 | 微尘羽毛 | 蔚蓝档案 |
| **黄昏 Sunset** | 紫金魔幻渐变 | 金色光尘 | 你的名字 |
| **深夜 Night** | 赛博霓虹科技 | 流星数据流 | 赛博朋克 |

### 🎮 增强交互体验
- **时间轮盘** - 一键循环切换三大主题
- **连发模式** - `Shift+Enter` 多行输入，模拟情绪压迫感
- **心电监视器** - 实时可视化情绪状态变化
- **场景粒子** - 三主题专属粒子特效系统
- **动态字体** - 自动适配各主题的最佳可读性

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
├── client/            # Electron + Vue 前端
│   ├── electron/      # Electron 主进程
│   └── src/           # Vue 渲染进程
│       ├── assets/    # 主题样式系统
│       ├── components/ # UI 组件
│       └── stores/    # Pinia 状态管理
└── AGENTS.md          # AI 开发指南
```

## 🎨 技术栈
- **前端**: Electron + Vue 3 + TypeScript
- **状态管理**: Pinia (persist)
- **样式**: Tailwind CSS v4 + 自定义主题系统
- **动效**: CSS 动画 + Canvas 粒子
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
- **记忆容量**: 控制对话历史上下文长度（0-60条）
- **视觉特效**: 动画/模糊/阴影分项开关
- **时间轮盘**: Morning/Sunset/Night 三态循环
- **场景粒子**: 各主题专属粒子特效开关

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

- **v4.0** - 时间轮盘：三态主题循环 + 新清晨主题 + 重做黄昏配色 + 场景粒子系统
- **v8.0** - 暮光军师：双阶段战术 + OCR预审
- **v7.1** - UI/UX 专业级打磨
- **v7.0** - Gal-chat 品牌系统
- **v2.1** - 历史记忆与日志系统
- **v2.0** - 恋爱军师系统

---

**最后更新**: 2026-01-30  
**作者**: SDP Team  
**开源协议**: MIT License
