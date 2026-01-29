"""
快速诊断脚本 - 检查 score 和 kaomoji 数据流
运行: python diagnose_data_flow.py
"""
import requests
import json

API_BASE = "http://127.0.0.1:8000"

print("=" * 60)
print("🔍 诊断 v3.1 数据流 - score & kaomoji")
print("=" * 60)

# 测试 1: 检查后端健康
print("\n📡 测试 1: 后端健康检查")
try:
    resp = requests.get(f"{API_BASE}/bridge/health", timeout=3)
    if resp.status_code == 200:
        print("✅ 后端运行正常")
    else:
        print(f"❌ 后端状态异常: {resp.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ 无法连接后端: {e}")
    print("💡 请先启动后端: cd backend && uvicorn main:app --reload")
    exit(1)

# 测试 2: 调用 /api/chat (新接口)
print("\n📨 测试 2: /api/chat 接口 (新版)")
payload = {
    "user_input": "今天想你了",
    "history": []
}
try:
    resp = requests.post(f"{API_BASE}/api/chat", json=payload, timeout=15)
    data = resp.json()
    
    print(f"状态码: {resp.status_code}")
    print(f"响应结构: {list(data.keys())}")
    
    if "options" in data:
        print(f"\n选项数量: {len(data['options'])}")
        for i, opt in enumerate(data['options'], 1):
            print(f"\n选项 {i}:")
            print(f"  text: {opt.get('text', 'N/A')[:40]}...")
            print(f"  kaomoji: {opt.get('kaomoji', '❌ 缺失')}")
            print(f"  score: {opt.get('score', '❌ 缺失')}")
            print(f"  style: {opt.get('style', 'N/A')}")
            
            # 检查必需字段
            if opt.get('kaomoji') is None:
                print("  ⚠️ WARNING: kaomoji 字段缺失!")
            if opt.get('score') is None:
                print("  ⚠️ WARNING: score 字段缺失!")
    else:
        print("❌ 响应中没有 options 字段")
        print(f"完整响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
        
except Exception as e:
    print(f"❌ 请求失败: {e}")

# 测试 3: 调用 /api/generate (兼容接口)
print("\n\n📨 测试 3: /api/generate 接口 (兼容层)")
payload = {
    "text": "今天想你了",
    "style": "neutral",
    "userId": "test-user",
    "history": []
}
try:
    resp = requests.post(f"{API_BASE}/api/generate", json=payload, timeout=15)
    data = resp.json()
    
    print(f"状态码: {resp.status_code}")
    print(f"success: {data.get('success', False)}")
    
    if data.get('success') and 'data' in data:
        options = data['data'].get('options', [])
        print(f"\n选项数量: {len(options)}")
        
        for i, opt in enumerate(options, 1):
            print(f"\n选项 {i}:")
            print(f"  id: {opt.get('id', 'N/A')}")
            print(f"  text: {opt.get('text', 'N/A')[:40]}...")
            print(f"  kaomoji: {opt.get('kaomoji', '❌ 缺失')}")
            print(f"  score: {opt.get('score', '❌ 缺失')}")
            print(f"  style_name: {opt.get('style_name', 'N/A')}")
            
            # 前端需要的关键字段
            missing_fields = []
            if 'kaomoji' not in opt or opt['kaomoji'] == '':
                missing_fields.append('kaomoji')
            if 'score' not in opt or opt['score'] is None:
                missing_fields.append('score')
            
            if missing_fields:
                print(f"  ❌ 前端需要但缺失: {', '.join(missing_fields)}")
            else:
                print("  ✅ 前端所需字段完整")
    else:
        print("❌ 请求失败或响应格式错误")
        print(f"完整响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
        
except Exception as e:
    print(f"❌ 请求失败: {e}")

# 总结
print("\n" + "=" * 60)
print("📊 诊断总结")
print("=" * 60)
print("""
✅ 检查清单:
1. 后端是否运行？
2. /api/chat 响应是否包含 kaomoji 和 score？
3. /api/generate 响应是否包含 kaomoji 和 score？

🔧 如果字段缺失，可能原因:
- AI 模型未遵循 Prompt 要求
- 后端数据转换逻辑有误
- 后端 .env 配置的模型不支持结构化输出

💡 解决方案:
1. 检查 backend/config/styles.py 的 Prompt 模板
2. 检查 backend/main.py 的 generate_dialog 函数
3. 确认 AI_MODEL 是否支持 response_format=json_object
""")
