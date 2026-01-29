from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time
import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing services that use them
load_dotenv()

from services.ai_service import ai_service
from services.db_service import db_service
from schemas import FeedbackRequest, GameRequest, SelectionRequest

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
# 2. 数据模型 (Moved to models/schemas.py)
# ==========================================

# ==========================================
# 3. 路由定义 (Endpoint)
# ==========================================
@app.get("/")
async def root():
    return {"status": "ok", "message": "Python 后端正在运行！"}

@app.get("/bridge/health")
async def health_check():
    load_dotenv(override=True)
    return {
        "status": "ok",
        "message": "Backend is healthy",
        "model": os.getenv("AI_MODEL", "")
    }

# 假设前端请求的是 /api/generate 或 /generate
# 我们这里写两个以防万一，随后你在前端统一
@app.post("/api/generate")
@app.post("/generate")
async def generate_dialog(request: GameRequest):
    print(f"收到前端请求: {request.text}")
    start_time = time.perf_counter()
    
    # 1. Ensure user exists
    if request.userId:
        db_service.get_or_create_user(request.userId)

    # 2. Generate Options (async)
    ai_result = await ai_service.generate_dialog_options(
        text=request.text,
        style=request.style,
        history=request.history,
    )
    generation_time_ms = int((time.perf_counter() - start_time) * 1000)

    if ai_result.get("error"):
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "message": ai_result.get("error"),
                "errorType": ai_result.get("errorType", "unknown"),
                "data": {
                    "generationTimeMs": generation_time_ms
                }
            }
        )

    raw_options_list = ai_result.get("options", [])

    stored_options = [
        {
            "id": f"opt-{idx + 1}",
            "text": option_text,
            "style": "unknown",
        }
        for idx, option_text in enumerate(raw_options_list)
    ]

    # 3. Save Session
    session_id = None
    if request.userId:
        session_id = db_service.save_session(
            session_id=request.sessionId,
            user_id=request.userId,
            text=request.text,
            style=request.style,
            options=stored_options,
            scene_summary=ai_result.get("scene", ""),
            messages=request.clientMessages or request.history
        )

    payload = {
        "success": True,
        "data": {
            "sessionId": session_id,
            "originalText": request.text,
            "text": ai_result.get("text", ""),
            "mood": ai_result.get("mood", "neutral"),
            "scene": ai_result.get("scene", ""),
            "options": raw_options_list,
            "style": request.style,
            "generationTimeMs": generation_time_ms,
        }
    }

    return payload

@app.post("/api/selection")
@app.post("/api/dialog/selection")
async def record_selection(request: SelectionRequest):
    print(f"收到选择: {request.optionIndex}")
    
    session = db_service.get_session(request.sessionId)
    if not session:
        # If session not found (maybe from old backend or restart), just log it but don't crash
        print(f"Session {request.sessionId} not found")
        # raise HTTPException(status_code=404, detail="Session not found")

    selected_option_text = request.optionText or ""
    if session:
        options = session.get("generatedOptions", [])
        if selected_option_text == "" and request.optionIndex is not None:
            if 0 <= request.optionIndex < len(options):
                selected_option = options[request.optionIndex]
                if isinstance(selected_option, dict):
                    selected_option_text = selected_option.get("text", "")
                else:
                    selected_option_text = str(selected_option)
    
    selection = db_service.create_selection(
        session_id=request.sessionId,
        option_id=f"opt-{(request.optionIndex or 0) + 1}",
        user_id=request.userId or ""
    )

    if session and selected_option_text:
        db_service.append_to_training_set(
            scene=session.get("originalText", ""),
            selected_option=selected_option_text,
            style="unknown"
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

@app.post("/api/feedback")
async def record_feedback(request: FeedbackRequest):
    feedback_type = (request.type or "").lower()
    if feedback_type not in {"like", "dislike", "reset"}:
        return JSONResponse(status_code=400, content={"success": False, "message": "Invalid feedback type"})

    weight_map = {
        "like": 2.0,
        "dislike": 0.0,
        "reset": 1.0,
    }
    training_weight = weight_map.get(feedback_type, 1.0)

    entry = db_service.record_feedback(
        message_id=request.messageId,
        feedback_type=feedback_type,
        training_weight=training_weight,
        scene=request.scene,
        response=request.response,
        user_id=request.userId,
    )

    if feedback_type == "like" and request.scene and request.response:
        db_service.append_to_positive_set(request.scene, request.response)

    return {
        "success": True,
        "message": "Feedback recorded",
        "data": {
            "feedback": entry
        }
    }

@app.delete("/api/sessions/{session_id}/messages/{message_id}")
async def delete_message(session_id: str, message_id: str):
    deleted = db_service.delete_session_message(session_id, message_id)
    return {
        "success": True,
        "data": {
            "deleted": deleted
        }
    }

if __name__ == "__main__":
    # 启动服务，端口设为 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)

