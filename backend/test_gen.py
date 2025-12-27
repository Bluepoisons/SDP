import requests
import json
import time

print("Waiting for server to start...")
time.sleep(3) # Give server a moment

url = "http://127.0.0.1:8000/api/generate"
payload = {
    "text": "测试文本：勇者走进了黑暗的洞穴",
    "style": "adventure",
    "userId": "test_user"
}

print(f"Sending request to {url}...")
try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print("Error Response:", response.text)
except Exception as e:
    print(f"Connection Error: {e}")
