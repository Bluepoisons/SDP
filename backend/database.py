"""
Neural Link Database Configuration - v11.0
神经连接数据库配置模块
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# 🧠 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sdp_users.db")

# 🔗 创建引擎
engine = create_engine(
    DATABASE_URL,
    # SQLite 特殊配置
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# 📡 会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 🏗️ 模型基类
Base = declarative_base()


def get_db():
    """
    🔌 获取数据库连接（依赖注入用）
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    🏗️ 创建所有表（首次运行时调用）
    """
    Base.metadata.create_all(bind=engine)
    print("🧠 [Neural Link] Database tables created successfully.")