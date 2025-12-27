from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import time
from dotenv import load_dotenv

# Load environment variables BEFORE importing services that use them
load_dotenv()

from services.ai_service import ai_service
from services.db_service import db_service

# 初始化 App
app = FastAPI(title="SDP Python Backend")

# ==========================================
# 1. 解决 Network Error 的核心：CORS 配置
# ==========================================
# 允许前端 (Electron/React) 访问后端
origins = [
    "http://localhost:3000",  # React 开发服务器默认端口
    "http://localhost:5173",  # Vite 开发服务器默认端口
    "http://127.0.0.1:3000",
    "*"                       # 开发阶段允许所有，防止因为 IP 变动连不上
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法 (POST, GET, OPTIONS 等)
    allow_headers=["*"],  # 允许所有 Header
)

# ==========================================
# 2. 定义数据模型 (契约)
# ==========================================
# 必须和前端发送的 JSON 格式完全一致
class DialogRequest(BaseModel):
    text: str               # 对应前端的 { text: "..." }
    style: Optional[str] = "neutral" 
    userId: Optional[str] = None
    history: Optional[List[dict]] = []

class SelectionRequest(BaseModel):
    sessionId: str
    optionId: str
    userId: str

# ==========================================
# 3. 路由定义 (Endpoint)
# ==========================================
@app.get("/")
async def root():
    return {"status": "ok", "message": "Python 后端正在运行！"}

@app.get("/bridge/health")
async def health_check():
    return {"status": "ok", "message": "Backend is healthy"}

# 假设前端请求的是 /api/generate 或 /generate
# 我们这里写两个以防万一，随后你在前端统一
@app.post("/api/generate")
@app.post("/generate") 
async def generate_dialog(request: DialogRequest):
    print(f"收到前端请求: {request.text}")
    
    # 1. Ensure user exists
    if request.userId:
        db_service.get_or_create_user(request.userId)

    # 2. Generate Options
    ai_result = ai_service.generate_dialog_options(
        scene=request.text,
        user_style=request.style,
        history=request.history
    )

    # --- Data Transformation for Frontend Contract ---
    # The frontend expects objects with { id, text, style, effect, favorChange, emoji }
    # But AI service returns strings like "Content... 【Style】"
    
    formatted_options = []
    raw_options = ai_result.get("options", [])
    
    style_map = {
        "积极热情": {"favorChange": 5, "effect": "好感度上升", "emoji": "💖", "style": "积极", "type": "romantic"},
        "幽默调侃": {"favorChange": 3, "effect": "气氛活跃", "emoji": "✨", "style": "幽默", "type": "humor"},
        "高冷理智": {"favorChange": 0, "effect": "冷静观察", "emoji": "❄️", "style": "高冷", "type": "serious"},
    }

    for i, opt_text in enumerate(raw_options):
        # Default values
        meta = {"favorChange": 0, "effect": "普通", "emoji": "💬", "style": "普通", "type": "default"}
        
        # Extract style tag if present (e.g., 【积极热情】)
        clean_text = opt_text
        for key, val in style_map.items():
            if f"【{key}】" in opt_text:
                meta = val
                clean_text = opt_text.replace(f"【{key}】", "").strip()
                break
        
        formatted_options.append({
            "id": chr(65 + i), # A, B, C
            "text": clean_text,
            "style": meta["style"],
            "effect": meta["effect"],
            "emoji": meta["emoji"],
            "favorChange": meta["favorChange"],
            "type": meta["type"], # Added type field
            "description": meta["style"] 
        })

    # 3. Save Session
    session_id = None
    if request.userId:
        session_id = db_service.create_session(
            user_id=request.userId,
            text=request.text,
            style=request.style,
            options=formatted_options, # Save the formatted objects
            scene_summary=ai_result.get("sceneSummary", "")
        )

    return {
        "success": True,
        "data": {
            "sessionId": session_id,
            "originalText": request.text,
            "options": formatted_options, # Return formatted objects
            "sceneSummary": ai_result.get("sceneSummary", ""),
            "style": request.style,
        }
    }

@app.post("/api/selection")
@app.post("/api/dialog/selection")
async def record_selection(request: SelectionRequest):
    print(f"收到选择: {request.optionId}")
    
    session = db_service.get_session(request.sessionId)
    if not session:
        # If session not found (maybe from old backend or restart), just log it but don't crash
        print(f"Session {request.sessionId} not found")
        # raise HTTPException(status_code=404, detail="Session not found")
    
    selection = db_service.create_selection(
        session_id=request.sessionId,
        option_id=request.optionId,
        user_id=request.userId
    )

    user_stats = db_service.get_user_stats(request.userId)

    return {
        "success": True,
        "message": "Selection recorded",
        "data": {
            "selection": selection,
            "userStats": user_stats
        }
    }

if __name__ == "__main__":
    # 启动服务，端口设为 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)

