from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ValidationError, conlist


class StyleCode(str, Enum):
    TSUNDERE = "TSUNDERE"
    YANDERE = "YANDERE"
    KUUDERE = "KUUDERE"
    GENKI = "GENKI"


class MoodCode(str, Enum):
    angry = "angry"
    shy = "shy"
    happy = "happy"
    sad = "sad"
    neutral = "neutral"
    excited = "excited"
    calm = "calm"
    confused = "confused"
    embarrassed = "embarrassed"


class GameRequest(BaseModel):
    """生成对话的请求体。"""

    text: str = Field(..., min_length=1, description="玩家输入文本")
    style: StyleCode = Field(default=StyleCode.TSUNDERE, description="风格代码")
    userId: Optional[str] = Field(default=None, description="用户 ID")
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="历史对话")
    sessionId: Optional[str] = Field(default=None, description="会话 ID")
    clientMessages: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="客户端消息列表")


class GameResponse(BaseModel):
    """模型输出的结构化结果（严格校验）。"""

    text: str = Field(..., min_length=1, description="角色回复")
    mood: MoodCode = Field(..., description="情绪标签")
    scene: str = Field(..., min_length=1, description="场景描述")
    options: conlist(str, min_items=1, max_items=4) = Field(..., description="选项列表")


class SelectionRequest(BaseModel):
    """选项上报请求体。"""

    sessionId: str
    optionIndex: Optional[int] = None
    optionText: Optional[str] = None
    userId: Optional[str] = None


class FeedbackRequest(BaseModel):
    messageId: str
    type: str
    scene: Optional[str] = None
    response: Optional[str] = None
    userId: Optional[str] = None


class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    errorType: Optional[str] = None
