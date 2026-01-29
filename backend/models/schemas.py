from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any, Literal

# 风格类型定义
StyleType = Literal["TSUNDERE", "YANDERE", "KUUDERE", "GENKI"]
MoodType = Literal["angry", "shy", "happy", "dark", "neutral", "excited", "love"]

# ==================== 请求模型 ====================

class ChatRequest(BaseModel):
    """新版聊天请求模型"""
    user_input: str = Field(..., description="用户输入的文本")
    style: StyleType = Field(default="TSUNDERE", description="对话风格")


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
