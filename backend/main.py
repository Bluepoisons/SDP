from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from loguru import logger
import uvicorn
import time
import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing services that use them
load_dotenv()

# ==========================================
# 配置日志文件 (Task 2 - 日志查看功能)
# ==========================================
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "love_advisor.log")

# 确保日志目录存在
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# 配置 loguru 写入文件：10MB 滚动，保留 7 天
logger.add(
    LOG_FILE,
    rotation="10 MB",
    retention="7 days",
    encoding="utf-8",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
)

from services.ai_service import ai_service
from services.db_service import db_service
from models.schemas import (
    ChatRequest, AdvisorResponse, FeedbackRequest, LegacyGenerateRequest, SelectionRequest,
    AnalyzeRequest, AnalyzeResponse, ExecuteRequest, ExecuteResponse, SituationAnalysis
)

# 初始化 App
app = FastAPI(title="Love Advisor Backend - Commander System v8.0")

logger.info("🚀 [FastAPI] Commander System v8.0 starting...")

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
# 3. 路由定义 (Endpoint)
# ==========================================
@app.get("/")
async def root():
    return {"status": "ok", "message": "恋爱军师后端正在运行！"}

@app.get("/bridge/health")
async def health_check():
    load_dotenv(override=True)
    return {
        "status": "ok",
        "message": "Backend is healthy",
        "mode": "Love Advisor",
        "model": os.getenv("AI_MODEL", "")
    }

@app.get("/api/system/logs", response_class=PlainTextResponse)
async def get_system_logs(lines: int = 100):
    """
    获取最近的系统日志 (Task 2 - 日志查看接口)
    
    Args:
        lines: 返回最后 N 行日志，默认 100 行
        
    Returns:
        纯文本格式的日志内容
    """
    if not os.path.exists(LOG_FILE):
        return "Log file not found. Please check if the backend has been started."
    
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
            # 返回最后 N 行
            last_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            return "".join(last_lines)
    except Exception as e:
        logger.error(f"❌ [/api/system/logs] Error reading logs: {e}")
        return f"Error reading logs: {str(e)}"


# ==================== v8.0 指挥官系统 API ====================

@app.post("/api/analyze")
async def analyze_endpoint(request: AnalyzeRequest):
    """
    v8.0 Phase 1: 态势感知 (Situation Awareness)
    分析对方消息的情绪、意图和语境压迫感
    
    Request: { user_input: "我\\n讨\\n厌\\n你", history: [...] }
    Response: { success: true, analysis: SituationAnalysis, raw_input: "..." }
    """
    logger.info(f"🎯 [/api/analyze] Input: {request.user_input[:50]}... | History: {len(request.history)}")
    
    start_time = time.perf_counter()
    
    try:
        analysis = await ai_service.analyze_situation(request.user_input, request.history)
        
        analysis_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        return {
            "success": True,
            "analysis": analysis,
            "raw_input": request.user_input,
            "analysisTimeMs": analysis_time_ms
        }
    except Exception as exc:
        logger.error(f"❌ [/api/analyze] Error: {exc}")
        return {
            "success": False,
            "message": f"态势分析失败: {str(exc)}",
            "analysis": {
                "summary": "分析系统暂时离线，请手动填写参数或重试。",
                "emotion_score": 0,
                "intent": "UNKNOWN",
                "strategy": "COMFORT",
                "confidence": 0.0,
                "burst_detected": False,
                "pressure_level": 0
            },
            "raw_input": request.user_input
        }


@app.post("/api/execute")
async def execute_endpoint(request: ExecuteRequest):
    """
    v8.0 Phase 2: 战术执行 (Tactical Execution)
    基于用户确认/修改的战术分析生成回复选项
    
    Request: { 
        user_input: "...", 
        history: [...], 
        analysis_context: { emotion_score, strategy, ... } 
    }
    Response: { success: true, analysis: "...", options: [...] }
    """
    strategy = request.analysis_context.strategy
    logger.info(f"⚔️ [/api/execute] Strategy: {strategy} | Input: {request.user_input[:30]}...")
    
    start_time = time.perf_counter()
    
    try:
        result = await ai_service.execute_tactics(
            request.user_input,
            request.analysis_context.model_dump(),
            request.history
        )
        
        execution_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        # 格式化选项（兼容旧前端）
        formatted_options = []
        for idx, opt in enumerate(result.get("options", [])):
            score = opt.get("score", 0)
            emoji_map = {
                "COLD": "❄️", "TSUNDERE": "💢", "GENKI": "✨",
                "FLATTERING": "🥺", "CHUNIBYO": "🌙"
            }
            emoji = emoji_map.get(opt.get("style", ""), "💬")
            
            formatted_options.append({
                "id": chr(65 + idx),
                "text": opt.get("text", ""),
                "kaomoji": opt.get("kaomoji", ""),
                "score": score,
                "style": opt.get("style", ""),
                "style_name": opt.get("style_name", "未知"),
                "emoji": emoji,
                "favorChange": score,
                "type": "default",
                "description": f"情商评分: {score:+d}",
                "effect": ""
            })
        
        return {
            "success": True,
            "data": {
                "originalText": request.user_input,
                "sceneSummary": result.get("analysis", request.analysis_context.summary),
                "options": formatted_options,
                "executionTimeMs": execution_time_ms,
                "appliedStrategy": strategy
            }
        }
        
    except Exception as exc:
        logger.error(f"❌ [/api/execute] Error: {exc}")
        return {
            "success": False,
            "message": f"战术执行失败: {str(exc)}",
            "data": {
                "executionTimeMs": int((time.perf_counter() - start_time) * 1000)
            }
        }


# ==================== 原有接口（保持兼容） ====================

@app.post("/api/chat", response_model=AdvisorResponse)
async def chat_endpoint(request: ChatRequest):
    """
    恋爱军师核心接口（支持历史上下文）- 兼容旧版
    Request: { user_input: "...", history: [{role: "user", content: "..."}] }
    Response: { analysis: "...", options: [ ... ] }
    """
    logger.info(f"📨 [/api/chat] Received: {request.user_input} | History: {len(request.history)} messages")
    
    try:
        # 传入 user_input 和 history，风格由后端随机
        result = await ai_service.generate_response(request.user_input, request.history)
        return result
    except Exception as exc:
        logger.error(f"❌ [/api/chat] Error: {exc}")
        # 兜底返回，防止前端白屏
        return {
            "analysis": "系统连接波动，无法分析局势...(T_T)",
            "options": [
                {
                    "style": "ERROR", 
                    "style_name": "系统错误", 
                    "text": "服务器连接失败，请检查网络设置或 API Key。",
                    "kaomoji": "(╥﹏╥)",  # 🆕 错误时的颜文字
                    "score": 0
                },
                {
                    "style": "ERROR", 
                    "style_name": "重试", 
                    "text": "点击重新生成试试看？",
                    "kaomoji": "(｡•́︿•̀｡)",  # 🆕 错误时的颜文字
                    "score": 0
                },
                {
                    "style": "ERROR", 
                    "style_name": "等待", 
                    "text": "稍等片刻再试...",
                    "kaomoji": "(´･_･`)",  # 🆕 错误时的颜文字
                    "score": 0
                }
            ]
        }


# 保留旧版接口用于兼容性（前端格式适配）
@app.post("/api/generate")
@app.post("/generate")
async def generate_dialog(request: LegacyGenerateRequest):
    """
    兼容旧版前端的接口 - 将新格式转换为旧格式（支持历史记录）
    
    前端期望格式:
    {
      success: true,
      data: {
        sceneSummary: "...",
        options: [{id, text, style, emoji, favorChange}],
        generationTimeMs: 1000
      }
    }
    """
    start_time = time.perf_counter()
    logger.info(f"📨 [/api/generate] Legacy request (with history: {len(request.history or [])} msgs)")
    
    try:
        # 调用新接口获取恋爱军师响应（支持历史）
        chat_request = ChatRequest(
            user_input=request.text,
            history=request.history or []  # Task 2: 传递历史记录
        )
        advisor_response = await chat_endpoint(chat_request)
        
        # 转换为旧格式
        formatted_options = []
        for idx, opt in enumerate(advisor_response.get("options", [])):
            # 根据评分映射好感度变化
            score = opt.get("score", 0)
            favor_change = score  # 直接使用评分作为好感度变化
            
            # 根据风格选择 emoji
            emoji_map = {
                "COLD": "❄️",
                "TSUNDERE": "💢",
                "GENKI": "✨",
                "FLATTERING": "🥺",
                "CHUNIBYO": "🌙"
            }
            emoji = emoji_map.get(opt.get("style", ""), "💬")
            
            # 🆕 v3.1: 完整传递所有字段
            formatted_options.append({
                "id": chr(65 + idx),  # A, B, C
                "text": opt.get("text", ""),
                "kaomoji": opt.get("kaomoji", ""),  # 🆕 颜文字
                "score": score,                      # 🆕 评分
                "style": opt.get("style", ""),       # 风格代码
                "style_name": opt.get("style_name", "未知"),  # 风格名称
                "emoji": emoji,
                "favorChange": favor_change,
                "type": "default",
                "description": f"情商评分: {score:+d}",
                "effect": ""
            })
        
        generation_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        return {
            "success": True,
            "data": {
                "sessionId": request.sessionId or "temp-session",
                "originalText": request.text,
                "sceneSummary": advisor_response.get("analysis", ""),
                "options": formatted_options,
                "style": request.style or "random",
                "generationTimeMs": generation_time_ms
            }
        }
        
    except Exception as exc:
        logger.error(f"❌ [/api/generate] Failed: {exc}")
        return {
            "success": False,
            "message": f"生成失败: {str(exc)}",
            "errorType": "generation_error",
            "data": {
                "generationTimeMs": int((time.perf_counter() - start_time) * 1000)
            }
        }


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

