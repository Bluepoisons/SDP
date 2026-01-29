from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any, Literal

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
    """单个回复选项"""
    style: str = Field(..., description="风格代码 (e.g. TSUNDERE)")
    style_name: str = Field(..., description="风格显示名称 (e.g. 傲娇)")
    text: str = Field(..., description="回复内容，包含颜文字")
    score: int = Field(..., ge=-3, le=3, description="好感度/情商评分 (-3 到 3)")

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


class LegacyGenerateRequest(BaseModel):
    """兼容前端旧版 /api/generate 接口"""
    text: str
    style: Optional[str] = "TSUNDERE"
    userId: Optional[str] = None
    history: Optional[List[dict]] = None
    sessionId: Optional[str] = None
    clientMessages: Optional[List[dict]] = None

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
