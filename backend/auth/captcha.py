"""
Neural Link Captcha Service - v11.0
神经连接安全协议校验模块
"""
import io
import uuid
import base64
import secrets
from typing import Dict, Tuple, Optional
from datetime import datetime, timedelta
from captcha.image import ImageCaptcha
from loguru import logger

# 🧠 内存验证码存储 (生产环境建议使用 Redis)
captcha_store: Dict[str, Dict] = {}


def generate_captcha_code() -> str:
    """
    🎲 生成验证码字符串
    使用数字+字母（排除易混淆字符 0O1I）
    """
    chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    return ''.join(secrets.choice(chars) for _ in range(4))


def create_captcha_image(code: str) -> str:
    """
    🎨 创建验证码图片 - 生成安全协议图像
    
    Args:
        code: 验证码字符串
        
    Returns:
        Base64编码的图片字符串
    """
    # 配置验证码图片样式
    image = ImageCaptcha(
        width=120,
        height=50,
        fonts=[
            # 可以指定字体文件路径，默认使用系统字体
        ]
    )
    
    # 生成图片
    img_stream = image.generate(code)
    
    # 转换为 base64
    img_base64 = base64.b64encode(img_stream.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{img_base64}"


def generate_captcha() -> Tuple[str, str]:
    """
    🔐 生成完整验证码 - 创建安全协议
    
    Returns:
        (key, image_base64) 元组
    """
    # 生成唯一键和验证码
    key = str(uuid.uuid4())
    code = generate_captcha_code()
    
    # 生成图片
    image_base64 = create_captcha_image(code)
    
    # 存储到内存（设置 5 分钟过期）
    captcha_store[key] = {
        "code": code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=5),
        "attempts": 0,  # 尝试次数
        "max_attempts": 3  # 最大尝试次数
    }
    
    logger.info(f"🔐 [Captcha] Generated: {key} -> {code}")
    
    return key, image_base64


def verify_captcha(key: str, user_input: str) -> bool:
    """
    ✅ 验证验证码 - 校验安全协议
    
    Args:
        key: 验证码键
        user_input: 用户输入的验证码
        
    Returns:
        验证是否成功
    """
    # 检查键是否存在
    if key not in captcha_store:
        logger.warning(f"⚠️ [Captcha] Key not found: {key}")
        return False
    
    captcha_data = captcha_store[key]
    
    # 检查是否过期
    if datetime.utcnow() > captcha_data["expires_at"]:
        logger.warning(f"⏰ [Captcha] Expired: {key}")
        del captcha_store[key]
        return False
    
    # 检查尝试次数
    captcha_data["attempts"] += 1
    if captcha_data["attempts"] > captcha_data["max_attempts"]:
        logger.warning(f"🚫 [Captcha] Too many attempts: {key}")
        del captcha_store[key]
        return False
    
    # 验证码校验（不区分大小写）
    is_correct = user_input.upper() == captcha_data["code"].upper()
    
    if is_correct:
        logger.success(f"✅ [Captcha] Verified: {key}")
        # 验证成功，删除验证码
        del captcha_store[key]
    else:
        logger.warning(f"❌ [Captcha] Incorrect: {key} - got '{user_input}', expected '{captcha_data['code']}'")
    
    return is_correct


def cleanup_expired_captchas():
    """
    🧹 清理过期验证码 - 定期维护
    """
    now = datetime.utcnow()
    expired_keys = [
        key for key, data in captcha_store.items()
        if now > data["expires_at"]
    ]
    
    for key in expired_keys:
        del captcha_store[key]
    
    if expired_keys:
        logger.info(f"🧹 [Captcha] Cleaned {len(expired_keys)} expired entries")


def get_captcha_stats() -> Dict:
    """
    📊 获取验证码统计信息
    """
    cleanup_expired_captchas()
    
    return {
        "active_captchas": len(captcha_store),
        "last_cleanup": datetime.utcnow().isoformat()
    }