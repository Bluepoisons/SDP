"""
Neural Link Authentication Routes - v11.0
神经连接身份认证路由
"""
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db, create_tables
from models.user import User
from models.schemas import (
    CaptchaResponse, RegisterRequest, LoginRequest, TokenResponse, UserInfo,
    AuthErrorResponse, AuthErrorCodes, APIResponse
)
from auth.captcha import generate_captcha, verify_captcha, get_captcha_stats
from auth.utils import (
    hash_password, verify_password, create_access_token,
    generate_random_username, generate_avatar_url
)
from auth.dependencies import get_current_user
from loguru import logger

# 🧠 创建认证路由
router = APIRouter(prefix="/api/auth", tags=["Neural Link Authentication"])


@router.on_event("startup")
async def setup_database():
    """🏗️ 启动时创建数据库表"""
    create_tables()


@router.get("/captcha", response_model=CaptchaResponse)
async def get_captcha():
    """
    🔐 获取验证码 - 生成安全协议
    
    生成一个图形验证码，用于注册和登录时的安全校验。
    验证码有效期为5分钟，最多可尝试3次。
    """
    try:
        key, image_base64 = generate_captcha()
        
        return CaptchaResponse(
            key=key,
            image=image_base64,
            expires_in=300  # 5分钟
        )
        
    except Exception as e:
        logger.error(f"❌ [Auth] Generate captcha failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": AuthErrorCodes.SERVER_ERROR,
                "error_message": "安全协议生成器离线，请稍后重试",
                "neural_status": "SECURITY_SYSTEM_DOWN"
            }
        )


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    📝 用户注册 - 神经连接申请
    
    创建新的神经元个体档案，建立与系统的连接。
    支持手机号或邮箱注册，必须通过安全协议校验。
    """
    try:
        # 1. 验证验证码
        if not verify_captcha(request.captcha_key, request.captcha_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": AuthErrorCodes.CAPTCHA_INVALID,
                    "error_message": "安全协议校验失败，请重新获取验证码",
                    "neural_status": "SECURITY_PROTOCOL_FAILED"
                }
            )
        
        # 2. 检查账号是否已存在
        existing_user = None
        if request.phone:
            existing_user = db.query(User).filter(User.phone == request.phone).first()
        elif request.email:
            existing_user = db.query(User).filter(User.email == request.email).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error_code": AuthErrorCodes.USER_EXISTS,
                    "error_message": "检测到神经元冲突，该身份标识已被占用",
                    "neural_status": "NEURAL_CONFLICT_DETECTED"
                }
            )
        
        # 3. 创建新用户
        new_user = User(
            username=request.username or generate_random_username(),
            phone=request.phone,
            email=request.email,
            hashed_password=hash_password(request.password),
            avatar=generate_avatar_url(),
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.success(f"🎉 [Auth] New neural registered: {new_user.id} - {new_user.username}")
        
        # 4. 生成访问令牌
        access_token = create_access_token({"user_id": new_user.id})
        
        # 5. 构建响应
        user_info = UserInfo(
            id=new_user.id,
            username=new_user.username,
            avatar=new_user.avatar,
            bio=new_user.bio,
            phone=new_user.phone[:3] + "****" + new_user.phone[-4:] if new_user.phone else None,
            email=new_user.email[:3] + "***" + new_user.email[new_user.email.find('@'):] if new_user.email else None,
            created_at=new_user.created_at.isoformat(),
            last_login=None
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=1440 * 60,  # 24小时（秒）
            user_info=user_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Auth] Register failed: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": AuthErrorCodes.SERVER_ERROR,
                "error_message": "神经连接系统故障，请稍后重试",
                "neural_status": "NEURAL_SYSTEM_MALFUNCTION"
            }
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    🔑 用户登录 - 神经连接验证
    
    验证用户身份并建立安全连接。
    支持手机号、邮箱或用户名登录。
    """
    try:
        # 1. 验证验证码
        if not verify_captcha(request.captcha_key, request.captcha_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": AuthErrorCodes.CAPTCHA_INVALID,
                    "error_message": "安全协议校验失败，请重新获取验证码",
                    "neural_status": "SECURITY_PROTOCOL_FAILED"
                }
            )
        
        # 2. 查找用户（支持多种登录方式）
        user = db.query(User).filter(
            (User.phone == request.account) |
            (User.email == request.account) |
            (User.username == request.account)
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error_code": AuthErrorCodes.USER_NOT_FOUND,
                    "error_message": "神经元个体档案不存在，请检查身份标识",
                    "neural_status": "NEURAL_ID_NOT_FOUND"
                }
            )
        
        # 3. 验证密码
        if not user.hashed_password or not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error_code": AuthErrorCodes.INVALID_CREDENTIALS,
                    "error_message": "神经同步率过低，拒绝访问",
                    "neural_status": "NEURAL_SYNC_FAILED"
                }
            )
        
        # 4. 更新最后登录时间
        user.last_login = datetime.utcnow()
        db.commit()
        
        logger.success(f"🔗 [Auth] Neural linked: {user.id} - {user.username}")
        
        # 5. 生成访问令牌
        token_expires = timedelta(days=7) if request.remember_me else timedelta(hours=24)
        access_token = create_access_token(
            {"user_id": user.id}, 
            expires_delta=token_expires
        )
        
        # 6. 构建响应
        user_info = UserInfo(
            id=user.id,
            username=user.username,
            avatar=user.avatar,
            bio=user.bio,
            phone=user.phone[:3] + "****" + user.phone[-4:] if user.phone else None,
            email=user.email[:3] + "***" + user.email[user.email.find('@'):] if user.email else None,
            created_at=user.created_at.isoformat(),
            last_login=user.last_login.isoformat() if user.last_login else None
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=int(token_expires.total_seconds()),
            user_info=user_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Auth] Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": AuthErrorCodes.SERVER_ERROR,
                "error_message": "神经连接系统故障，请稍后重试",
                "neural_status": "NEURAL_SYSTEM_MALFUNCTION"
            }
        )


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    👤 获取当前用户信息 - 神经元档案查询
    
    返回当前登录用户的详细信息。
    """
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        avatar=current_user.avatar,
        bio=current_user.bio,
        phone=current_user.phone[:3] + "****" + current_user.phone[-4:] if current_user.phone else None,
        email=current_user.email[:3] + "***" + current_user.email[current_user.email.find('@'):] if current_user.email else None,
        created_at=current_user.created_at.isoformat(),
        last_login=current_user.last_login.isoformat() if current_user.last_login else None
    )


@router.post("/logout")
async def logout():
    """
    🔌 用户登出 - 断开神经连接
    
    由于使用JWT，服务端无状态，登出主要由前端处理（删除token）。
    这里只是提供一个标准的登出端点。
    """
    return APIResponse(
        success=True,
        message="神经连接已安全断开，期待下次相遇"
    )


@router.get("/captcha/stats")
async def get_captcha_statistics():
    """
    📊 验证码统计信息 - 安全协议状态
    
    管理员接口，查看验证码系统状态。
    """
    stats = get_captcha_stats()
    return APIResponse(
        success=True,
        data=stats
    )