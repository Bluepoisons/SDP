# SDP - SmartDialog Processor

**时间轮盘 v12.0** - 沉浸式恋爱战术指挥终端（DIEGETIC UI改造）

一款面向 Galgame 玩家与剧情互动场景的桌面应用，结合 AI 生成能力，实时产出多风格对话选项，并记录用户选择以持续优化偏好画像。

## ✨ 核心功能

### 🎯 v12.0 "神经链接"DIEGETIC UI改造
> 从"工具UI"到"故事UI" - 让界面成为叙事的一部分

#### **Pillar 1: 战术评估系统** ⭐ Phase 1 ✅
- 📊 胜率预测条（每个选项显示成功率0-100%）
- 🎯 风险等级标签（Safe/Moderate/Critical三层）
- 💡 战术建议提示（高风险自动警告）
- 参考：蔚蓝档案《推演系统》

#### **Pillar 2: 沉浸音效系统** ⭐ Phase 2 ✅  
- 🎵 9种情景化音效（点击/接收/成功/警告/错误/心动等）
- 🔊 全局音量控制与静音开关
- 📂 预加载机制（优化响应时间）
- 💫 根据选项分数自动触发（高分 = 心动音，低分 = 灾难音）

#### **Pillar 3: 动态危险等级页眉** ⭐ Phase 3 ✅
- 📈 基于情感分数实时变化的威胁等级显示
- 🌊 背景发光与进度条动画
- ⚠️ Critical状态自动警告横幅
- 💔 情绪标签 (冰冷/冷淡/平静/激动/非常激动/爆发)

#### **Pillar 4: 角色档案系统** ⏳ Phase 5 (规划中)
- 👥 Memorial Lobby - 干员档案与心情值显示
- 🏷️ 关系标签系统（Intel/Tags）
- 💕 动态Live2D展示

### 🌅 时间轮盘主题系统 (v4.0)
| 主题 | 配色风格 | 粒子特效 | 设计参考 |
|------|---------|---------|---------|
| **清晨 Morning** | 蓝白干净通透 | 微尘羽毛 | 蔚蓝档案 |
| **黄昏 Sunset** | 紫金魔幻渐变 | 金色光尘 | 你的名字 |
| **深夜 Night** | 赛博霓虹科技 | 流星数据流 | 赛博朋克 |

### 🎮 增强交互体验
- **时间轮盘** - 一键循环切换三大主题
- **连发模式** - `Shift+Enter` 多行输入
- **心电监视器** - 实时情绪可视化
- **场景粒子** - 三主题专属特效
- **动态字体** - 主题适配文字渲染

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

### 4. 配置音效（可选）
> v12.0 新增沉浸音效系统，需要添加音频文件

将音效文件放入：
```
client/public/sounds/
├── sfx/                  # 交互音效
│   ├── click.wav        # UI点击音
│   ├── success.wav      # 成功音
│   ├── romantic.wav     # 心动音
│   └── ... (参考 README.md)
└── bgm/                  # 背景音乐
    └── dialogue.mp3     # 对话场景BGM
```

如未添加音效文件，应用仍可正常运行（音量控制允许关闭）。

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
## 🆕 v12.0 新特性详解

### 🎯 Phase 1: 战术评估系统 (TacticalAssessment)
```vue
<!-- 每个选项卡片下方自动显示 -->
<TacticalAssessment 
  :success-rate="75"
  risk-level="safe"
  risk-tag="保守策略"
/>
```
- 📊 **成功率条**: 0-100%的动画进度条
- 🎯 **风险标签**: Safe (蓝)/Moderate (黄)/Critical (红)
- 💡 **战术提示**: 高风险自动提示"谨慎使用"
- 📝 **自定义标签**: 可为每个选项添加策略说明

### 🎵 Phase 2: 沉浸音效系统 (useSound)
```typescript
import { useSound } from '@/composables/useSound';

const { playClick, playSuccess, playRomantic } = useSound();

// 高分选项 (+2): 心动音效
await playRomantic();

// 低分选项 (-2): 灾难音效  
await playError();

// 其他选项: 成功音效
await playSuccess();
```

**9种预设音效**:
- `playClick` - 轻快点击音 (UI交互)
- `playReceive` - 温柔通知音 (消息到达)
- `playSuccess` - 积极反馈音 (选项确认)
- `playWarning` - 注意警告音 (高风险)
- `playError` - 消极失败音 (关系破裂)
- `playRomantic` - 心动暧昧音 (浪漫时刻)
- `playSelectConfirm` - 坚定选择音 (最终确认)
- `playDataStream` - 科技感数据音 (思考中)
- `playNotification` - 轻微通知音 (后台提示)

### 📈 Phase 3: 动态危险等级页眉 (DynamicHeader)
```vue
<DynamicHeader
  :emotion-score="75"          <!-- 0-100分 -->
  character-name="神经链接"
  last-action="生成中..."
  :is-thinking="true"
/>
```

**威胁等级三层系统**:
| 分数范围 | 等级 | 颜色 | 状态 |
|---------|------|------|------|
| 0-59 | SAFE (安全) | 蓝色 | 稳定 |
| 60-79 | WARNING (警告) | 黄色 | 闪烁 |
| 80-100 | CRITICAL (极端) | 红色 | 警报 |

**页眉组成**:
- 📡 左侧: 角色名 + 当前状态
- 🧠 中央: 思考指示器 (分析中...)
- 🚨 右侧: 威胁等级徽章
- 📊 情感条: 实时进度 + 描述文本
- 🎯 底部: 关系/稳定性/同步指示器

## 📋 开发计划

- [x] Phase 1 ✅ 战术评估系统
- [x] Phase 2 ✅ 沉浸音效系统  
- [x] Phase 3 ✅ 动态危险等级页眉
- [ ] Phase 4 ⏳ 思考态视觉增强 (数据流粒子)
- [ ] Phase 5 ⏳ 角色档案系统 (Memorial Lobby)
- [ ] Phase 6 ⏳ 字体排印优化
- [ ] OCR 截图识别稳定集成
- [ ] 智能剪贴板监控
- [ ] 本地模型支持
- [ ] 多语言国际化
- [ ] 插件系统

## 📝 版本历史

- **v12.0** - 神经链接 DIEGETIC UI改造
  - Phase 1 ✅: 战术评估 (TacticalAssessment 胜率预测条)
  - Phase 2 ✅: 沉浸音效 (useSound 9种场景音效)
  - Phase 3 ✅: 动态页眉 (DynamicHeader 情感驱动威胁等级)
  - Phase 4 ⏳: 思考态增强 (数据流、光晕粒子)
  - Phase 5 ⏳: 角色档案系统 (Memorial Lobby)
  - Phase 6 ⏳: 字体排印优化

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
