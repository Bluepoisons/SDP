端边云一体化智能对话处理系统 - 技术框架

一、项目概述

项目名称：SmartDialog Processor (SDP)
核心功能：通过CV截图识别对话内容 → AI智能处理 → 用户交互选择 → 模板动态优化
技术特点：端边云三层架构、实时AI交互、个性化模板学习

二、技术栈推荐

前端（客户端）

• 框架：Electron + React（桌面应用）或 Next.js（Web应用）

• 截图库：html2canvas + canvas-area-select（Web）或 electron-screenshot（Electron）

• UI组件：Ant Design / Material-UI

• 状态管理：Zustand / Redux Toolkit

• 通信：WebSocket（实时） + REST API

后端（云服务）

• 运行时：Node.js + Express 或 Python + FastAPI

• AI集成：OpenAI API / 文心一言 API / 通义千问 API

• 数据库：PostgreSQL（主数据） + Redis（缓存/实时统计）

• OCR服务：Tesseract.js（本地）或 百度OCR API（云端）

• 任务队列：Bull（Node.js）或 Celery（Python）

边缘层（可选）

• 容器化：Docker

• 边缘运行时：Node.js微服务

• 消息队列：MQTT（轻量级设备通信）

DevOps

• 版本控制：Git + GitHub/GitLab

• CI/CD：GitHub Actions / Jenkins

• 监控：Prometheus + Grafana

• 日志：ELK Stack

三、系统架构（文字描述）


用户端 (Electron/Web)
    │
    ├─ 截图模块 → 框选 → OCR文字提取
    │
    ├─ 交互界面 → 显示AI选项 → 记录用户选择
    │
    └─ WebSocket → 实时通信
            │
            ↓
边缘网关 (Docker容器)
    │
    ├─ 请求转发/负载均衡
    ├─ 本地缓存（用户偏好）
    └─ 基础预处理（图像压缩）
            │
            ↓
云端服务器集群
    ├─ API网关层：路由、认证、限流
    ├─ 业务逻辑层：
    │   ├─ 对话处理服务：调用AI API
    │   ├─ 模板管理服务：模板存储/优化
    │   └─ 用户分析服务：统计选择数据
    ├─ 数据存储层：
    │   ├─ PostgreSQL：用户数据、对话记录
    │   ├─ Redis：实时统计、会话缓存
    │   └─ 对象存储：截图图片（可选）
    └─ 任务队列层：异步处理OCR/AI调用


四、核心模块设计

1. 前端模块


src/
├── components/
│   ├── ScreenshotTool/     # 截图组件
│   ├── DialogDisplay/      # 对话显示
│   ├── OptionButtons/      # 选项按钮组
│   └── UserPreference/     # 用户偏好设置
├── services/
│   ├── api.js             # API调用封装
│   ├── websocket.js       # WebSocket连接
│   └── ocr.js            # OCR处理（前端版）
└── stores/
    └── userStore.js       # 用户状态管理


2. 后端模块


server/
├── src/
│   ├── controllers/       # 控制器
│   │   ├── dialog.controller.js
│   │   ├── template.controller.js
│   │   └── user.controller.js
│   ├── services/         # 业务逻辑
│   │   ├── ai.service.js    # AI集成
│   │   ├── ocr.service.js   # OCR处理
│   │   └── template.service.js # 模板优化
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   └── middleware/      # 中间件
├── config/              # 配置文件
├── scripts/             # 部署脚本
└── tests/               # 测试文件


五、API接口设计（RESTful）

核心接口

# 1. 处理对话内容
POST /api/v1/dialog/process
请求体: { image: base64, userId: string }
响应: { 
  options: [string], 
  templateId: string,
  sessionId: string 
}

# 2. 记录用户选择
POST /api/v1/dialog/selection
请求体: { 
  sessionId: string, 
  selectedOption: number,
  userId: string 
}

# 3. 获取用户偏好模板
GET /api/v1/template/user/:userId
响应: { 
  template: string, 
  style: "humorous"|"cold",
  confidence: number 
}

# 4. 更新模板
PUT /api/v1/template/optimize
请求体: { 
  templateId: string, 
  selectionData: object 
}


WebSocket事件

// 客户端连接时发送
ws.send(JSON.stringify({
  type: 'register',
  userId: 'user123'
}))

// 服务器推送AI响应
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'dialog_response') {
    // 显示选项
  }
}


六、数据库设计

1. 用户表 (users)

CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50),
  language_preference VARCHAR(10) DEFAULT 'zh-CN',
  humor_level INT DEFAULT 5, -- 1-10幽默程度
  cold_level INT DEFAULT 5,  -- 1-10高冷程度
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);


2. 对话会话表 (dialog_sessions)

CREATE TABLE dialog_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  original_text TEXT,
  processed_text TEXT,
  template_id UUID,
  created_at TIMESTAMP
);


3. 用户选择表 (user_selections)

CREATE TABLE user_selections (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES dialog_sessions(id),
  option_index INT,          -- 用户选择的选项索引
  option_text TEXT,          -- 选项内容
  response_time_ms INT,      -- 响应时间（毫秒）
  created_at TIMESTAMP
);


4. 模板表 (templates)

CREATE TABLE templates (
  id UUID PRIMARY KEY,
  base_template TEXT,        -- "旮旯给木"基础模板
  style VARCHAR(20),         -- 'humorous', 'cold', 'neutral'
  success_rate FLOAT,        -- 成功率统计
  usage_count INT DEFAULT 0,
  last_optimized TIMESTAMP
);


七、AI提示词模板设计

基础模板（旮旯给木风格）

const basePrompt = `
你是一个智能对话处理器，需要根据用户对话内容生成3个回应选项。

对话内容：{{dialog_text}}

生成要求：
1. 选项1：幽默风趣风格
2. 选项2：高冷简洁风格  
3. 选项3：中性平衡风格

每个选项不超过20个字，符合中文对话习惯。
`;


模板优化算法（伪代码）

function optimizeTemplate(templateId, selectionData) {
  // 1. 统计各选项被选择频率
  const stats = calculateSelectionStats(selectionData);
  
  // 2. 分析用户语言偏好
  const userPreference = analyzeUserStyle(selectionData);
  
  // 3. 调整模板权重
  if (userPreference.humor > threshold) {
    // 增强幽默元素
    template = injectHumorElements(template);
  }
  
  // 4. A/B测试新模板
  return createVariantTemplate(template, userPreference);
}


八、部署配置

Docker Compose示例

version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: smartdialog
      POSTGRES_PASSWORD: password
  
  redis:
    image: redis:7-alpine
  
  api-server:
    build: ./server
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  edge-gateway:
    build: ./edge
    ports:
      - "8080:8080"


环境变量配置

# AI服务配置
OPENAI_API_KEY=your_key_here
AI_MODEL=gpt-4-turbo

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartdialog

# OCR配置（如果使用云端OCR）
BAIDU_OCR_API_KEY=your_key


九、开发路线图（MVP版本）

Week 1-2: 基础后端

• 设置Node.js/Express项目

• 实现基础API（处理文本、记录选择）

• 集成AI API测试

Week 3-4: 前端原型

• Electron基础框架

• 手动文本输入界面（先替代截图）

• 连接后端API

Week 5-6: CV功能

• 集成截图库

• 添加OCR文字提取

• 优化图像处理流程

Week 7-8: 模板优化系统

• 实现用户选择统计

• 开发模板A/B测试

• 添加个性化推荐算法
