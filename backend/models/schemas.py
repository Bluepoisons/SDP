from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any, Literal
from enum import Enum

# ==================== v8.0：指挥官系统模型 ====================

class IntentType(str, Enum):
    """对方意图枚举 - 战术分析用"""
    TESTING_BOUNDARIES = "TESTING_BOUNDARIES"      # 试探边界
    SEEKING_ATTENTION = "SEEKING_ATTENTION"        # 求关注
    EXPRESSING_AFFECTION = "EXPRESSING_AFFECTION"  # 表达好感
    VENTING_EMOTION = "VENTING_EMOTION"            # 发泄情绪
    CASUAL_CHAT = "CASUAL_CHAT"                    # 闲聊
    FLIRTING = "FLIRTING"                          # 调情
    COMPLAINING = "COMPLAINING"                    # 抱怨
    JEALOUS = "JEALOUS"                            # 吃醋
    COLD_WAR = "COLD_WAR"                          # 冷战
    UNKNOWN = "UNKNOWN"                            # 未知

class StrategyType(str, Enum):
    """应对策略枚举 - 战术执行用"""
    OFFENSIVE_FLIRT = "OFFENSIVE_FLIRT"            # 进攻调情
    DEFENSIVE_FLIRT = "DEFENSIVE_FLIRT"            # 防守调情  
    COMFORT = "COMFORT"                            # 安抚
    FREEZE = "FREEZE"                              # 冷处理
    PUSH_PULL = "PUSH_PULL"                        # 推拉战术
    DIRECT = "DIRECT"                              # 直球
    PLAYFUL = "PLAYFUL"                            # 俏皮
    IGNORE = "IGNORE"                              # 忽略
    APOLOGIZE = "APOLOGIZE"                        # 道歉
    ESCALATE = "ESCALATE"                          # 升级关系

class SituationAnalysis(BaseModel):
    """v8.0 态势感知结果 - AI 分析对方情绪与意图"""
    summary: str = Field(..., description="当前对话局势的简要战术总结")
    emotion_score: int = Field(ge=-3, le=3, description="对方情绪指数 (-3=暴怒, 0=中性, +3=心动)")
    intent: str = Field(..., description="推测的对方意图 (IntentType 枚举值)")
    strategy: str = Field(..., description="AI 建议的应对策略 (StrategyType 枚举值)")
    confidence: float = Field(ge=0.0, le=1.0, default=0.8, description="分析置信度")
    burst_detected: bool = Field(default=False, description="是否检测到连发消息模式")
    pressure_level: int = Field(ge=0, le=5, default=0, description="语境压迫感等级 (0=无, 5=极强)")

class AnalyzeRequest(BaseModel):
    """v8.0 态势感知请求"""
    user_input: str = Field(..., description="对方发来的消息 (支持多行/连发)")
    history: List[dict] = Field(default=[], description="对话历史上下文")
    
    @field_validator('history')
    @classmethod
    def validate_history(cls, v: List[dict]) -> List[dict]:
        if len(v) > 32:
            raise ValueError("历史记录不能超过32条")
        for msg in v:
            if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                raise ValueError("历史记录格式错误")
        return v

class AnalyzeResponse(BaseModel):
    """v8.0 态势感知响应"""
    success: bool = True
    analysis: SituationAnalysis
    raw_input: str = Field(..., description="原始输入（用于前端展示）")

class ExecuteRequest(BaseModel):
    """v8.0 战术执行请求 - 接受用户确认/修改后的分析"""
    user_input: str = Field(..., description="对方原始消息")
    history: List[dict] = Field(default=[], description="对话历史")
    analysis_context: SituationAnalysis = Field(..., description="经用户确认/修改的战术分析")

class ExecuteResponse(BaseModel):
    """v8.0 战术执行响应"""
    success: bool = True
    analysis: str = Field(..., description="最终采用的局势分析")
    options: List['ReplyOption'] = Field(..., min_length=3, max_length=3)

# ==================== 新版：恋爱军师模型 ====================

class ChatRequest(BaseModel):
    """
    用户请求模型（升级版 - 支持记忆上下文）
    在新版中，style 由后端随机生成，前端只需要传对方的话
    """
    user_input: str = Field(..., description="对方发来的最新消息")
    # 可选保留 style 以兼容旧接口测试，但实际业务逻辑中主要由后端随机
    style: Optional[str] = None
    # 新增: 历史对话上下文，用于让 AI 理解前文
    # 格式: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    history: List[dict] = Field(default=[], description="对话历史上下文，最多保留32条")
    
    @field_validator('history')
    @classmethod
    def validate_history(cls, v: List[dict]) -> List[dict]:
        """验证历史记录格式并限制长度"""
        if len(v) > 32:
            raise ValueError("历史记录不能超过32条")
        # 简单校验格式
        for msg in v:
            if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                raise ValueError("历史记录格式错误，需要包含 role 和 content 字段")
        return v 

class ReplyOption(BaseModel):
    """单个回复选项 - v3.0 沉浸式情感交互"""
    style: str = Field(..., description="风格代码 (e.g. TSUNDERE) - 后端保留用于调试")
    style_name: str = Field(..., description="风格显示名称 (e.g. 傲娇) - 前端不再显示")
    text: str = Field(..., description="纯净的回复文本（不含颜文字）")
    kaomoji: str = Field(..., description="提取出的颜文字，如 (≧∇≦)/")
    score: int = Field(..., ge=-3, le=3, description="好感度/情商评分 (-3=灾难 ~ +3=心动)")

    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        if len(v) < 1:
            raise ValueError("回复内容不能为空")
        return v

class AdvisorResponse(BaseModel):
    """AI军师的最终响应"""
    analysis: str = Field(..., description="对当前局势/对方情绪的分析总结")
    options: List[ReplyOption] = Field(..., min_length=3, max_length=3, description="3个不同风格的回复建议")


# ==================== 旧版兼容模型 (保留以防报错) ====================
# 风格类型定义
StyleType = Literal["TSUNDERE", "YANDERE", "KUUDERE", "GENKI"]
MoodType = Literal["angry", "shy", "happy", "dark", "neutral", "excited", "love"]


class DialogRequest(BaseModel):
    """兼容旧版的对话请求模型"""
    text: str
    style: Optional[str] = "neutral"
    userId: Optional[str] = None
    history: Optional[List[dict]] = []
    regenerateId: Optional[str] = None
    sessionId: Optional[str] = None
    clientMessages: Optional[List[dict]] = []


# ==================== v8.1：战术意图类型 ====================

class TacticalIntentType(str, Enum):
    """v8.1 用户指定的战术意图 - 「直出+热修」模式"""
    PRESSURE = "PRESSURE"      # 高压威慑 - 施压、强势、主导
    LURE = "LURE"              # 示弱诱敌 - 撒娇、卖惨、让对方心软
    PROBE = "PROBE"            # 模糊试探 - 不正面回应、话里有话
    COMFORT = "COMFORT"        # 情绪安抚 - 共情、理解、陪伴


class LegacyGenerateRequest(BaseModel):
    """兼容前端旧版 /api/generate 接口"""
    text: str
    style: Optional[str] = "TSUNDERE"
    userId: Optional[str] = None
    history: Optional[List[dict]] = None
    sessionId: Optional[str] = None
    clientMessages: Optional[List[dict]] = None
    tacticalIntent: Optional[str] = None  # 🆕 v8.1: 战术意图

# ==================== 响应模型 ====================

class GameResponse(BaseModel):
    """游戏响应模型 - 包含内心独白与实际对话"""
    summary: str = Field(..., description="角色的内心独白，不带颜文字，冷静或符合内心人设的吐槽")
    text: str = Field(..., description="角色的对话，必须带颜文字")
    mood: MoodType = Field(default="neutral", description="情绪标签")
    scene: str = Field(default="default", description="当前场景描述")
    options: List[str] = Field(..., min_length=1, max_length=4, description="后续选项")

    @field_validator('text')
    @classmethod
    def text_must_have_content(cls, v: str) -> str:
        """验证对话内容不能太短（面试亮点：数据完整性校验）"""
        if len(v) < 2:
            raise ValueError("对话内容太短，至少需要2个字符")
        return v

    @field_validator('mood', mode='before')
    @classmethod
    def validate_mood(cls, v: str) -> str:
        """验证情绪标签，无效值默认为 neutral"""
        valid_moods = ["angry", "shy", "happy", "dark", "neutral", "excited", "love"]
        return v if v in valid_moods else "neutral"


class SelectionRequest(BaseModel):
    """用户选择请求"""
    sessionId: str
    optionIndex: Optional[int] = None
    optionText: Optional[str] = None
    userId: Optional[str] = None


class FeedbackRequest(BaseModel):
    """用户反馈请求"""
    messageId: str
    type: str
    scene: Optional[str] = None
    response: Optional[str] = None
    userId: Optional[str] = None


class APIResponse(BaseModel):
    """统一 API 响应格式"""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    errorType: Optional[str] = None


class DialogOption(BaseModel):
    id: str
    text: str
    style: str


class DialogOutput(BaseModel):
    sceneSummary: str
    options: List[DialogOption]


# ==================== v10.0：视觉智能模型 ====================

class VisionAnalyzeRequest(BaseModel):
    """v10.0 视觉分析请求 - 截图战术流"""
    image_base64: str = Field(..., description="Base64 编码的截图图片")
    hint: Optional[str] = Field(None, description="用户补充提示（如：这是微信聊天记录）")

class VisionBubble(BaseModel):
    """OCR 识别的对话气泡"""
    text: str = Field(..., description="对话文本内容")
    is_me: bool = Field(..., description="是否是主角说的话")
    confidence: float = Field(ge=0.0, le=1.0, default=0.9, description="识别置信度")

class VisionIntelligence(BaseModel):
    """v10.0 视觉情报分析结果"""
    summary: str = Field(..., description="情报摘要 - 用一句话总结当前局势")
    bubbles: List[VisionBubble] = Field(default=[], description="识别出的对话气泡列表")
    emotion_detected: str = Field(default="中性", description="检测到的对方情绪")
    emotion_score: int = Field(ge=-3, le=3, default=0, description="情绪评分 (-3=愤怒, +3=心动)")
    context_hint: str = Field(default="", description="上下文提示（如：对方在试探你）")
    tactical_suggestion: str = Field(default="", description="战术建议")
    confidence: float = Field(ge=0.0, le=1.0, default=0.8, description="整体分析置信度")

class VisionAnalyzeResponse(BaseModel):
    """v10.0 视觉分析响应"""
    success: bool = True
    intelligence: VisionIntelligence
    raw_text: str = Field(default="", description="原始 OCR 文本（用于调试）")
    analysis_time_ms: int = Field(default=0, description="分析耗时(ms)")

class VisionExecuteRequest(BaseModel):
    """v10.0 视觉战术执行请求 - 用户修正后提交"""
    summary: str = Field(..., description="用户确认/修改后的情报摘要")
    bubbles: List[VisionBubble] = Field(..., description="用户修正后的对话列表")
    emotion_score: int = Field(ge=-3, le=3, default=0, description="用户确认的情绪评分")
    history: List[dict] = Field(default=[], description="历史对话上下文")


# ==================== v11.0：Neural Link 身份认证模型 ====================

class CaptchaResponse(BaseModel):
    """🔐 验证码响应模型"""
    key: str = Field(..., description="验证码唯一标识")
    image: str = Field(..., description="Base64 编码的验证码图片")
    expires_in: int = Field(default=300, description="过期时间(秒)")

class RegisterRequest(BaseModel):
    """📝 注册请求模型 - 神经连接申请"""
    username: Optional[str] = Field(None, min_length=2, max_length=20, description="用户昵称")
    phone: Optional[str] = Field(None, description="手机号")
    email: Optional[str] = Field(None, description="邮箱地址")
    password: str = Field(..., min_length=6, max_length=50, description="密码")
    confirm_password: str = Field(..., description="确认密码")
    captcha_key: str = Field(..., description="验证码键")
    captcha_code: str = Field(..., description="验证码")
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('密码确认不匹配')
        return v
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v and not v.isdigit():
            raise ValueError('手机号格式无效')
        return v

class LoginRequest(BaseModel):
    """🔑 登录请求模型 - 神经连接验证"""
    account: str = Field(..., description="账号（手机/邮箱/用户名）")
    password: str = Field(..., description="密码")
    captcha_key: str = Field(..., description="验证码键")
    captcha_code: str = Field(..., description="验证码")
    remember_me: bool = Field(default=False, description="记住登录")

class TokenResponse(BaseModel):
    """🎫 令牌响应模型 - 神经连接证书"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间(秒)")
    user_info: 'UserInfo'

class UserInfo(BaseModel):
    """👤 用户信息模型 - 神经元个体档案"""
    id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户昵称")
    avatar: str = Field(..., description="头像URL")
    bio: Optional[str] = Field(None, description="个人简介")
    phone: Optional[str] = Field(None, description="手机号（脱敏）")
    email: Optional[str] = Field(None, description="邮箱（脱敏）")
    created_at: str = Field(..., description="注册时间")
    last_login: Optional[str] = Field(None, description="最后登录时间")

class GuestModeRequest(BaseModel):
    """👻 游客模式请求 - 匿名潜入"""
    guest_id: str = Field(..., description="临时游客ID")
    device_info: Optional[str] = Field(None, description="设备信息")

class OAuth2LoginRequest(BaseModel):
    """🔗 第三方登录请求 - 量子纠缠连接"""
    provider: str = Field(..., description="第三方平台名称")
    code: str = Field(..., description="授权码")
    state: Optional[str] = Field(None, description="状态参数")
    redirect_uri: str = Field(..., description="重定向URI")

class BindAccountRequest(BaseModel):
    """🔗 绑定账号请求 - 神经链接扩展"""
    phone: Optional[str] = Field(None, description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    password: str = Field(..., min_length=6, description="设置密码")
    captcha_key: str = Field(..., description="验证码键")
    captcha_code: str = Field(..., description="验证码")

class UpdateProfileRequest(BaseModel):
    """✏️ 更新资料请求 - 神经元个性化"""
    username: Optional[str] = Field(None, min_length=2, max_length=20)
    bio: Optional[str] = Field(None, max_length=200)
    avatar: Optional[str] = Field(None, description="头像URL")

class AuthErrorResponse(BaseModel):
    """❌ 认证错误响应 - 神经连接异常"""
    error_code: str = Field(..., description="错误代码")
    error_message: str = Field(..., description="错误信息")
    neural_status: str = Field(default="CONNECTION_FAILED", description="神经连接状态")
    
# 错误代码定义
class AuthErrorCodes:
    INVALID_CREDENTIALS = "NEURAL_SYNC_FAILED"  # 凭据无效
    CAPTCHA_INVALID = "SECURITY_PROTOCOL_FAILED"  # 验证码错误
    USER_NOT_FOUND = "NEURAL_ID_NOT_FOUND"  # 用户不存在
    USER_EXISTS = "NEURAL_CONFLICT_DETECTED"  # 用户已存在
    TOKEN_EXPIRED = "NEURAL_CERTIFICATE_EXPIRED"  # 令牌过期
    TOKEN_INVALID = "NEURAL_CERTIFICATE_CORRUPTED"  # 令牌无效
    PERMISSION_DENIED = "NEURAL_ACCESS_DENIED"  # 权限不足
    RATE_LIMIT = "NEURAL_OVERLOAD_DETECTED"  # 请求过于频繁
    SERVER_ERROR = "NEURAL_SYSTEM_MALFUNCTION"  # 服务器错误
