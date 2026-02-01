"""
Neural Link User Models - v11.0
神经连接用户数据模型
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """
    🧠 核心用户表 - 神经元个体
    """
    __tablename__ = "users"

    # 🆔 唯一标识符（跨平台通用）
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # 👤 基础身份信息
    username = Column(String(50), nullable=False, index=True, default="指挥官")
    phone = Column(String(20), nullable=True, unique=True, index=True)
    email = Column(String(100), nullable=True, unique=True, index=True)
    
    # 🔐 认证信息
    hashed_password = Column(String(128), nullable=True)  # 社交登录可为空
    
    # 🎨 个人资料
    avatar = Column(String(200), nullable=True, default="/avatars/default.png")
    bio = Column(Text, nullable=True, default="正在探索二次元的奥秘...")
    
    # ⏰ 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # 🔗 关系
    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
    neural_sessions = relationship("NeuralSession", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"


class OAuthAccount(Base):
    """
    🔗 第三方账号绑定表 - 量子纠缠连接
    """
    __tablename__ = "oauth_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # 🌐 第三方平台信息
    provider = Column(String(20), nullable=False)  # "github", "google", "qq", "wechat"
    account_id = Column(String(100), nullable=False)  # 第三方平台的用户ID
    account_email = Column(String(100), nullable=True)  # 第三方平台的邮箱
    account_name = Column(String(100), nullable=True)  # 第三方平台的昵称
    
    # 🎟️ 访问令牌（可选，用于获取更多信息）
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # ⏰ 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 🔗 关系
    user = relationship("User", back_populates="oauth_accounts")

    def __repr__(self):
        return f"<OAuthAccount(provider={self.provider}, account_id={self.account_id})>"


class NeuralSession(Base):
    """
    🧠 神经连接会话表 - 对话记录的持久化
    """
    __tablename__ = "neural_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # 📝 会话信息
    title = Column(String(200), nullable=False, default="新的邂逅")
    summary = Column(Text, nullable=True)  # 会话摘要
    
    # 📊 统计信息
    message_count = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # ⏰ 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    # 🚮 软删除
    is_deleted = Column(Boolean, default=False)
    
    # 🔗 关系
    user = relationship("User", back_populates="neural_sessions")

    def __repr__(self):
        return f"<NeuralSession(id={self.id}, title={self.title})>"