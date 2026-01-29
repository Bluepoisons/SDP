from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import uvicorn
import time
import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing services that use them
load_dotenv()

from services.ai_service import ai_service
from services.db_service import db_service
from models.schemas import ChatRequest, GameResponse, FeedbackRequest, LegacyGenerateRequest, SelectionRequest

# 初始化 App
app = FastAPI(title="SDP Python Backend")

logger.info("🚀 [FastAPI] Application starting...")

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
@app.post("/api/chat", response_model=GameResponse)
async def chat_endpoint(request: ChatRequest):
    """
    新版聊天接口 - 使用 AsyncOpenAI
    
    Request: {user_input, style}
    Response: {summary, text, mood, scene, options}
    """
    logger.info(f"📨 [/api/chat] Received request | Style: {request.style}")
    
    try:
        result = await ai_service.generate_response(request.user_input, request.style)
        logger.success(f"✅ [/api/chat] Response generated successfully")
        return result
    except Exception as exc:
        logger.error(f"❌ [/api/chat] Failed: {exc}")
        return {
            "summary": "系统出现了一些波动...",
            "text": "系统连接波动，请稍后再试... (._.)",
            "mood": "neutral",
            "scene": "error_screen",
            "options": ["重试"],
        }


@app.post("/api/generate")
@app.post("/generate")
async def generate_dialog(request: LegacyGenerateRequest):
    """
    兼容旧版前端的接口 - 支持 Vue 组件
    
    Request: {text, style, userId, history, sessionId}
    Response: {success, data: {options: [{id, text, style, emoji, favorChange}]}}
    """
    start_time = time.perf_counter()
    
    logger.info(f"📨 [/api/generate] Legacy request | Style: {request.style}")

    style = request.style or "TSUNDERE"
    if style not in {"TSUNDERE", "YANDERE", "KUUDERE", "GENKI"}:
        style = "TSUNDERE"

    try:
        ai_result = await ai_service.generate_response(request.text, style)
        logger.success(f"✅ [/api/generate] Legacy response generated")
    except Exception as exc:
        logger.error(f"❌ [/api/generate] Failed: {exc}")
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "message": "模型生成失败",
                "errorType": "unknown",
                "data": {
                    "generationTimeMs": int((time.perf_counter() - start_time) * 1000)
                },
            },
        )

    options = ai_result.get("options", [])
    formatted_options = [
        {
            "id": chr(65 + idx),
            "text": option_text,
            "style": "unknown",
            "effect": "",
            "emoji": "💬",
            "favorChange": 0,
            "type": "default",
            "description": "",
        }
        for idx, option_text in enumerate(options)
    ]

    payload = {
        "success": True,
        "data": {
            "sessionId": request.sessionId,
            "originalText": request.text,
            "options": formatted_options,
            "sceneSummary": ai_result.get("scene", ""),
            "style": style,
            "generationTimeMs": int((time.perf_counter() - start_time) * 1000),
        },
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

