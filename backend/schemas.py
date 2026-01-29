from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


StyleType = Literal["TSUNDERE", "YANDERE", "KUUDERE", "GENKI"]
MoodType = Literal["angry", "shy", "happy", "dark", "neutral", "excited", "love"]


class ChatRequest(BaseModel):
    user_input: str
    style: StyleType = "TSUNDERE"


class LegacyGenerateRequest(BaseModel):
    text: str
    style: Optional[str] = "TSUNDERE"
    userId: Optional[str] = None
    history: Optional[List[dict]] = None
    sessionId: Optional[str] = None
    clientMessages: Optional[List[dict]] = None


class GameResponse(BaseModel):
    summary: str = Field(..., description="角色的内心独白/心理活动（无颜文字，冷静或符合内心人设的吐槽）")
    text: str = Field(..., description="角色实际对玩家说出口的话（必须包含大量颜文字 Kaomoji）")
    mood: str = Field(default="neutral", description="情绪标签")
    scene: str = Field(default="default", description="场景描述")
    options: List[str] = Field(..., min_length=1, max_length=4, description="给玩家的选项")

    @field_validator("mood", mode="before")
    @classmethod
    def validate_mood(cls, value: str) -> str:
        valid_moods = ["angry", "shy", "happy", "dark", "neutral", "excited", "love"]
        return value if value in valid_moods else "neutral"


class SelectionRequest(BaseModel):
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
    data: Optional[dict] = None
    message: Optional[str] = None
    errorType: Optional[str] = None
