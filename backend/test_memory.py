"""
测试后端记忆功能和日志接口
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_chat_with_history():
    """测试带历史上下文的对话"""
    print("\n=== 测试 1: 带历史上下文的对话 ===")
    
    # 第一轮对话
    response1 = requests.post(
        f"{BASE_URL}/api/chat",
        json={
            "user_input": "我喜欢你",
            "history": []
        }
    )
    
    print(f"✅ 第一轮响应状态: {response1.status_code}")
    data1 = response1.json()
    print(f"📊 分析: {data1['analysis'][:50]}...")
    print(f"💡 选项数: {len(data1['options'])}")
    
    # 模拟用户选择了第一个选项
    selected_option = data1['options'][0]
    print(f"\n用户选择: {selected_option['text'][:30]}...")
    
    # 第二轮对话 - 带上前面的历史
    history = [
        {"role": "user", "content": "我喜欢你"},
        {"role": "assistant", "content": selected_option['text']}
    ]
    
    response2 = requests.post(
        f"{BASE_URL}/api/chat",
        json={
            "user_input": "你为什么不回应我？",
            "history": history
        }
    )
    
    print(f"\n✅ 第二轮响应状态: {response2.status_code}")
    data2 = response2.json()
    print(f"📊 分析（应该考虑前文）: {data2['analysis']}")
    print(f"💡 第一个建议: {data2['options'][0]['text']}")


def test_logs_endpoint():
    """测试日志查看接口"""
    print("\n\n=== 测试 2: 日志查看接口 ===")
    
    response = requests.get(f"{BASE_URL}/api/system/logs?lines=20")
    
    print(f"✅ 日志接口状态: {response.status_code}")
    logs = response.text
    
    if logs:
        lines = logs.split('\n')
        print(f"📄 返回日志行数: {len(lines)}")
        print(f"\n最后 5 行日志:")
        for line in lines[-5:]:
            if line.strip():
                print(f"  {line}")
    else:
        print("❌ 日志为空")


def test_history_validation():
    """测试历史记录验证（超过32条应该报错）"""
    print("\n\n=== 测试 3: 历史记录限制验证 ===")
    
    # 构造超过 32 条的历史
    long_history = [
        {"role": "user", "content": f"消息 {i}"}
        for i in range(35)
    ]
    
    response = requests.post(
        f"{BASE_URL}/api/chat",
        json={
            "user_input": "测试",
            "history": long_history
        }
    )
    
    print(f"状态码: {response.status_code}")
    if response.status_code != 200:
        print(f"✅ 正确拒绝了超长历史: {response.json()}")
    else:
        print(f"❌ 应该拒绝但接受了")


if __name__ == "__main__":
    print("🚀 开始测试后端 Task 2 新功能...\n")
    
    try:
        # 检查后端是否运行
        health = requests.get(f"{BASE_URL}/bridge/health")
        print(f"✅ 后端运行正常: {health.json()}\n")
        
        # 执行测试
        test_chat_with_history()
        test_logs_endpoint()
        test_history_validation()
        
        print("\n\n✅ 所有测试完成！")
        
    except requests.exceptions.ConnectionError:
        print("❌ 错误: 无法连接到后端，请先启动后端服务")
        print("运行: cd backend && uvicorn main:app --reload")
