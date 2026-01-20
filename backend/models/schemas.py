from pydantic import BaseModel
from typing import List, Optional, Any

class DialogRequest(BaseModel):
    text: str
    style: Optional[str] = "neutral"
    userId: Optional[str] = None
    history: Optional[List[dict]] = []
    regenerateId: Optional[str] = None
    sessionId: Optional[str] = None
    clientMessages: Optional[List[dict]] = []

class SelectionRequest(BaseModel):
    sessionId: str
    optionId: str
    userId: str

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


class DialogOption(BaseModel):
    id: str
    text: str
    style: str


class DialogOutput(BaseModel):
    sceneSummary: str
    options: List[DialogOption]
