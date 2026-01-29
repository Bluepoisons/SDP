"""
v3.1 后端验证脚本 - 颜文字分离测试
测试 ReplyOption 是否正确包含 text 和 kaomoji 字段
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from models.schemas import ReplyOption, AdvisorResponse
from pydantic import ValidationError

# ==================== 测试 1：模型字段验证 ====================
print("=" * 60)
print("📋 测试 1: ReplyOption 字段验证")
print("=" * 60)

fields = ReplyOption.model_fields
required_fields = ['style', 'style_name', 'text', 'kaomoji', 'score']

for field_name in required_fields:
    if field_name in fields:
        field_info = fields[field_name]
        print(f"✅ {field_name}: {field_info.description}")
    else:
        print(f"❌ 缺少字段: {field_name}")

# ==================== 测试 2：数据验证 ====================
print("\n" + "=" * 60)
print("🧪 测试 2: 数据实例化验证")
print("=" * 60)

# 正确的数据（v3.1 格式）
valid_data = {
    "style": "TSUNDERE",
    "style_name": "傲娇",
    "text": "其实...我也不是特意等你的啦",  # 纯文本
    "kaomoji": "(⁄ ⁄•⁄ω⁄•⁄ ⁄)",           # 独立颜文字
    "score": 2
}

try:
    option = ReplyOption(**valid_data)
    print("✅ 正确格式数据验证通过:")
    print(f"   text: {option.text}")
    print(f"   kaomoji: {option.kaomoji}")
    print(f"   score: {option.score}")
except ValidationError as e:
    print(f"❌ 验证失败: {e}")

# 测试缺少 kaomoji 的情况（应该失败）
print("\n🔍 测试缺少 kaomoji 字段:")
invalid_data = {
    "style": "GENKI",
    "style_name": "元气",
    "text": "今天超开心的！(≧∇≦)/",  # 错误：包含颜文字
    "score": 3
}

try:
    option = ReplyOption(**invalid_data)
    print("❌ 意外通过！应该报错 'field required'")
except ValidationError as e:
    print(f"✅ 正确拒绝：缺少 kaomoji 字段")
    print(f"   错误信息: {str(e.errors()[0]['msg'])}")

# ==================== 测试 3：完整响应验证 ====================
print("\n" + "=" * 60)
print("📦 测试 3: AdvisorResponse 完整结构")
print("=" * 60)

full_response = {
    "analysis": "对方在表达思念之情，适合用温暖或傲娇风格回应",
    "options": [
        {
            "style": "TSUNDERE",
            "style_name": "傲娇",
            "text": "谁让你想我了",
            "kaomoji": "(￣^￣)",
            "score": 1
        },
        {
            "style": "GENKI",
            "style_name": "元气",
            "text": "我也超想你的呀！",
            "kaomoji": "(≧∇≦)/",
            "score": 3
        },
        {
            "style": "COLD",
            "style_name": "高冷",
            "text": "嗯",
            "kaomoji": "(._. )",
            "score": -1
        }
    ]
}

try:
    response = AdvisorResponse(**full_response)
    print("✅ 完整响应验证通过")
    print(f"   分析: {response.analysis[:30]}...")
    print(f"   选项数量: {len(response.options)}")
    for i, opt in enumerate(response.options, 1):
        print(f"\n   选项 {i}:")
        print(f"     风格: {opt.style_name}")
        print(f"     文本: {opt.text}")
        print(f"     颜文字: {opt.kaomoji}")
        print(f"     分数: {opt.score}")
except ValidationError as e:
    print(f"❌ 验证失败: {e}")

# ==================== 测试 4：Score 范围验证 ====================
print("\n" + "=" * 60)
print("🎯 测试 4: Score 范围验证 (-3 ~ +3)")
print("=" * 60)

test_scores = [-4, -3, 0, 3, 4]
for score in test_scores:
    test_data = {
        "style": "TEST",
        "style_name": "测试",
        "text": "测试文本",
        "kaomoji": "(^_^)",
        "score": score
    }
    try:
        option = ReplyOption(**test_data)
        if -3 <= score <= 3:
            print(f"✅ Score {score:+2d}: 通过")
        else:
            print(f"❌ Score {score:+2d}: 应该被拒绝但通过了")
    except ValidationError:
        if -3 <= score <= 3:
            print(f"❌ Score {score:+2d}: 不应该被拒绝")
        else:
            print(f"✅ Score {score:+2d}: 正确拒绝（超出范围）")

print("\n" + "=" * 60)
print("🎉 所有测试完成！")
print("=" * 60)
