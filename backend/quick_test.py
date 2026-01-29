import requests
import json

url = "http://127.0.0.1:8000/api/chat"
data = {"user_input": "今晚月色真美"}

print("发送请求...")
response = requests.post(url, json=data)
print(f"状态码: {response.status_code}\n")

if response.status_code == 200:
    result = response.json()
    print("="*60)
    print(f"分析: {result['analysis']}\n")
    print("回复选项:")
    for i, opt in enumerate(result['options'], 1):
        print(f"\n{i}. [{opt['style_name']}] (评分: {opt['score']:+d})")
        print(f"   {opt['text']}")
    print("="*60)
else:
    print("错误:", response.text)
