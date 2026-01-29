# Vue 版本 - 记忆容量功能测试指南

## 📋 已实现内容

### 1. **useUiSettings.ts** - 状态管理
- ✅ 添加 `memoryLimit: number` 到状态接口
- ✅ 默认值设为 `10`（5 轮对话）
- ✅ 添加 `setMemoryLimit(limit)` action
- ✅ 范围限制：`0-60` 消息
- ✅ 持久化存储：`localStorage` key: `gal-ui-settings`

### 2. **SettingsPanel.vue** - UI 组件
- ✅ 添加 `memoryLimit` computed 属性（双向绑定）
- ✅ 新增"🧠 记忆容量"卡片
- ✅ 滑块组件：range 0-60, step 2
- ✅ 实时显示当前值（indigo-400 颜色）
- ✅ 超过 30 时显示性能警告（amber 橙色）
- ✅ 灵活上限策略说明文案

### 3. **AppLayout.vue** - 逻辑集成
- ✅ 导入 `useUiSettings` store
- ✅ 在 `handleGenerate` 中读取 `uiSettings.memoryLimit`
- ✅ 截取历史记录：`allMessages.slice(-limit)`
- ✅ 处理 0 值情况（失忆模式 = 空数组）

---

## 🚀 启动前端测试

### 步骤 1：确保 Vite 开发服务器运行
```bash
cd client
npm run dev
# 或 pnpm dev
```

### 步骤 2：强制刷新浏览器
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **DevTools**: 右键刷新按钮 → 「清空缓存并硬性重新加载」

### 步骤 3：访问设置面板
1. 打开应用主界面
2. 点击右上角**齿轮图标**（Settings）
3. 查看是否有「🧠 记忆容量」卡片

---

## ✅ 功能验证清单

### UI 验证
- [ ] 设置面板中显示「🧠 记忆容量」卡片
- [ ] 滑块可以从 0 拖动至 60
- [ ] 当前值实时更新（紫色数字）
- [ ] 值 > 30 时显示橙色警告框
- [ ] 滑块下方显示三个刻度标签（0/30/60）

### 功能验证
- [ ] 调整滑块后关闭设置面板
- [ ] 刷新页面，设置值仍然保持（持久化）
- [ ] 发送消息时，检查浏览器控制台 Network 标签
- [ ] POST `/api/generate` 请求体中 `history` 数组长度 ≤ 设定值

### 边界测试
- [ ] **0 值测试**：设为 0 → 发送消息 → history 应为空数组
- [ ] **小于历史长度**：有 20 条历史，设为 10 → 只发送最后 10 条
- [ ] **大于历史长度**：有 3 条历史，设为 10 → 发送全部 3 条
- [ ] **60 值测试**：设为 60 → 长对话中最多发送 60 条

---

## 🐛 调试方法

### 1. 检查 localStorage
打开浏览器控制台：
```javascript
// 查看存储值
console.log(localStorage.getItem('gal-ui-settings'))
// 应输出包含 memoryLimit 的 JSON 字符串
```

### 2. 检查 Vue DevTools
- 打开 Vue DevTools → Pinia
- 查看 `uiSettings` store
- 确认 `memoryLimit` 字段存在且值正确

### 3. 检查网络请求
- 打开 DevTools → Network 标签
- 发送消息
- 查看 `POST /api/generate` 请求
- 点击「Payload」查看 `history` 数组长度

### 4. 检查控制台日志
```javascript
// 在 AppLayout.vue handleGenerate 中添加临时日志
console.log('记忆上限:', uiSettings.memoryLimit)
console.log('全部消息数:', allMessages.length)
console.log('截取后消息数:', recentMessages.length)
console.log('构建的历史:', history)
```

---

## 📊 预期行为

| memoryLimit | 实际消息数 | 发送历史长度 | 说明 |
|------------|----------|------------|------|
| 0          | 任意      | 0          | 失忆模式 |
| 10         | 3        | 3          | 少于上限，全部发送 |
| 10         | 50       | 10         | 超过上限，截取最后 10 条 |
| 60         | 100      | 60         | 最大上限 |

---

## 🔄 故障排除

### 问题 1：设置面板没有显示新卡片
**原因**：文件未保存 / Vite 热更新失败
**解决**：
1. 检查编辑器文件标题有无未保存标记（圆点）
2. `Ctrl + S` 保存所有文件
3. 终端 `Ctrl + C` 停止 Vite
4. 重新运行 `npm run dev`

### 问题 2：滑块不动 / 值不更新
**原因**：computed 属性未正确绑定
**检查**：
```vue
<!-- SettingsPanel.vue -->
const memoryLimit = computed({
  get: () => uiSettings.memoryLimit,
  set: (val: number) => uiSettings.setMemoryLimit(val),
});
```

### 问题 3：后端收到的历史长度不对
**原因**：AppLayout.vue 未导入 store
**检查**：
```typescript
import { useUiSettings } from "@/stores/useUiSettings";
const uiSettings = useUiSettings();
```

---

## 🎯 后续优化建议

1. **日志查看器**：参考 React 版本实现
2. **性能监控**：显示实际 token 消耗
3. **智能推荐**：根据对话复杂度动态建议记忆深度
4. **历史预览**：显示当前将发送的历史记录

---

**测试完成时间**: _____  
**测试人员**: _____  
**测试结果**: ✅ 通过 / ❌ 失败  
**问题记录**: ___________________
