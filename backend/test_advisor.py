"""
测试恋爱军师API的脚本
"""
import requests
import json

# 测试数据
test_cases = [
    "今晚月色真美",
    "我喜欢你",
    "你在干嘛呢？",
    "好无聊啊",
    "我有点不开心"
]

BASE_URL = "http://127.0.0.1:8000"

def test_chat_endpoint(user_input: str):
    """测试 /api/chat 接口"""
    print(f"\n{'='*60}")
    print(f"测试输入: {user_input}")
    print('='*60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"user_input": user_input},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n✅ 局势分析:\n{data.get('analysis', 'N/A')}\n")
            
            options = data.get('options', [])
            print(f"📋 回复建议 ({len(options)}个):")
            for idx, opt in enumerate(options, 1):
                style_name = opt.get('style_name', 'Unknown')
                text = opt.get('text', 'N/A')
                score = opt.get('score', 0)
                
                # 根据评分显示颜色提示
                score_indicator = ""
                if score >= 2:
                    score_indicator = "🟢 高情商"
                elif score >= 0:
                    score_indicator = "🟡 中性"
                else:
                    score_indicator = "🔴 低情商"
                
                print(f"\n  [{idx}] 【{style_name}】 {score_indicator} (评分: {score:+d})")
                print(f"      {text}")
            
            print()
            return True
        else:
            print(f"❌ 错误: HTTP {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 网络错误: {e}")
        return False

def test_health():
    """测试健康检查接口"""
    try:
        response = requests.get(f"{BASE_URL}/bridge/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ 后端状态:")
            print(f"   - 状态: {data.get('status')}")
            print(f"   - 模式: {data.get('mode')}")
            print(f"   - 模型: {data.get('model')}")
            return True
        else:
            print(f"❌ 健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 健康检查错误: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("恋爱军师 API 测试")
    print("="*60)
    
    # 1. 测试健康检查
    print("\n🔍 步骤 1: 健康检查")
    if not test_health():
        print("\n⚠️  后端未启动，请先运行后端服务")
        exit(1)
    
    # 2. 测试对话生成
    print("\n🔍 步骤 2: 测试对话生成\n")
    
    success_count = 0
    for test_input in test_cases:
        if test_chat_endpoint(test_input):
            success_count += 1
    
    # 总结
    print("\n" + "="*60)
    print(f"测试完成: {success_count}/{len(test_cases)} 成功")
    print("="*60)
