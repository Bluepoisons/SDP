"""
Neural Link Authentication Utilities - v11.0
神经连接认证工具模块
"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# 🔐 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🎟️ JWT 配置
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24小时


def hash_password(password: str) -> str:
    """
    🔒 加密密码 - 神经密码锁定
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    🔓 验证密码 - 神经密码解锁
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    🎫 创建访问令牌 - 签发神经连接证书
    
    Args:
        data: 要编码的数据 (通常包含 user_id)
        expires_delta: 过期时间间隔
        
    Returns:
        JWT访问令牌字符串
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.utcnow()})
    to_encode.update({"type": "neural_access"})  # 令牌类型标记
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    🔍 解码访问令牌 - 解析神经连接证书
    
    Args:
        token: JWT令牌字符串
        
    Returns:
        解码后的数据字典，失败返回 None
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 检查令牌类型
        if payload.get("type") != "neural_access":
            return None
            
        return payload
        
    except JWTError:
        return None


def generate_random_username() -> str:
    """
    🎲 生成随机用户名 - 神经元代号
    """
    prefixes = [
        "指挥官", "探索者", "旅行者", "冒险家", "先锋者", 
        "学者", "魔法使", "剑士", "弓手", "法师",
        "星光", "银河", "彗星", "流星", "恒星"
    ]
    
    suffixes = [
        str(secrets.randbelow(9999)).zfill(4),
        secrets.token_hex(3).upper(),
        f"{secrets.randbelow(99):02d}{chr(ord('A') + secrets.randbelow(26))}"
    ]
    
    prefix = secrets.choice(prefixes)
    suffix = secrets.choice(suffixes)
    
    return f"{prefix}-{suffix}"


def generate_avatar_url() -> str:
    """
    🎨 生成随机头像 - 神经元外观
    """
    # 预设的二次元头像ID（实际部署时需要准备这些图片）
    avatar_ids = [
        "neural_01", "neural_02", "neural_03", "neural_04", "neural_05",
        "neural_06", "neural_07", "neural_08", "neural_09", "neural_10",
        "quantum_01", "quantum_02", "quantum_03", "quantum_04", "quantum_05",
    ]
    
    avatar_id = secrets.choice(avatar_ids)
    return f"/avatars/{avatar_id}.png"