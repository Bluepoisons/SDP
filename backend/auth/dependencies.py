"""
Neural Link Authentication Dependencies - v11.0
神经连接认证依赖函数
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from auth.utils import decode_access_token
from models.schemas import AuthErrorCodes

# 🔒 JWT Bearer 认证方案
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    🧠 获取当前用户 - 神经连接身份验证
    
    这是一个依赖函数，用于保护需要登录的 API 端点。
    会自动验证 Authorization Bearer Token，并返回当前用户信息。
    
    Args:
        credentials: HTTP Bearer 凭据
        db: 数据库会话
        
    Returns:
        当前登录的用户对象
        
    Raises:
        HTTPException: 认证失败时抛出 401 异常
    """
    # 解码 JWT 令牌
    token_payload = decode_access_token(credentials.credentials)
    
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": AuthErrorCodes.TOKEN_INVALID,
                "error_message": "神经连接证书损坏，请重新接入系统",
                "neural_status": "CERTIFICATE_CORRUPTED"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 获取用户ID
    user_id = token_payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": AuthErrorCodes.TOKEN_INVALID,
                "error_message": "神经连接证书缺失身份标识",
                "neural_status": "IDENTITY_MISSING"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 从数据库查询用户
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": AuthErrorCodes.USER_NOT_FOUND,
                "error_message": "神经元个体档案缺失，可能已被系统清理",
                "neural_status": "NEURAL_ID_NOT_FOUND"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    🔓 可选的用户认证 - 支持游客模式
    
    用于那些既支持登录用户也支持游客的 API。
    如果有有效 token 则返回用户，否则返回 None。
    
    Args:
        credentials: HTTP Bearer 凭据（可选）
        db: 数据库会话
        
    Returns:
        用户对象或 None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        # 认证失败，返回 None（游客模式）
        return None


def require_admin():
    """
    👑 管理员权限要求
    
    这是一个依赖函数，用于保护管理员专用的 API。
    TODO: 实现管理员角色系统
    """
    async def admin_dependency(current_user: User = Depends(get_current_user)):
        # TODO: 检查用户是否为管理员
        # if not current_user.is_admin:
        #     raise HTTPException(...)
        return current_user
    
    return admin_dependency