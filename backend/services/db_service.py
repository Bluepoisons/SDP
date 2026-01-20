from tinydb import TinyDB, Query
from typing import Dict, Any, List, Optional
import time
import os
import json
from collections import Counter
import uuid

class DatabaseService:
    def __init__(self):
        # Ensure the directory exists
        # In backend/services/db_service.py, so we go up one level to backend/
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db.json")
        self.db = TinyDB(db_path)
        self.users = self.db.table('users')
        self.sessions = self.db.table('dialogSessions')
        self.selections = self.db.table('userSelections')
        self.templates = self.db.table('templates')
        self.feedback = self.db.table('feedback')

    def get_or_create_user(self, user_id: str) -> Dict[str, Any]:
        User = Query()
        user = self.users.search(User.id == user_id)
        if user:
            return user[0]
        
        new_user = {"id": user_id, "username": "Guest", "createdAt": int(time.time() * 1000)}
        self.users.insert(new_user)
        return new_user

    def save_session(self, session_id: Optional[str], user_id: str, text: str, style: str,
                     options: List[str], scene_summary: str, messages: Optional[List[Dict[str, Any]]] = None) -> str:
        Session = Query()
        session_id = session_id or f"session-{int(time.time() * 1000)}"
        now = int(time.time() * 1000)
        safe_messages: List[Dict[str, Any]] = []
        for msg in (messages or []):
            if not msg.get("id"):
                msg["id"] = f"msg-{uuid.uuid4().hex}"
            safe_messages.append(msg)

        existing = self.sessions.search(Session.id == session_id)
        payload = {
            "id": session_id,
            "userId": user_id,
            "originalText": text,
            "contextStyle": style,
            "generatedOptions": options,
            "sceneSummary": scene_summary,
            "messages": safe_messages,
            "updatedAt": now,
        }
        if existing:
            payload["createdAt"] = existing[0].get("createdAt", now)
            self.sessions.update(payload, Session.id == session_id)
        else:
            payload["createdAt"] = now
            self.sessions.insert(payload)

        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        Session = Query()
        result = self.sessions.search(Session.id == session_id)
        return result[0] if result else None

    def delete_session_message(self, session_id: str, message_id: str) -> bool:
        Session = Query()
        result = self.sessions.search(Session.id == session_id)
        if not result:
            return False
        session = result[0]
        messages = session.get("messages", [])
        if not messages:
            return False
        next_messages = [msg for msg in messages if msg.get("id") != message_id]
        self.sessions.update({"messages": next_messages, "updatedAt": int(time.time() * 1000)}, Session.id == session_id)
        return True

    def create_selection(self, session_id: str, option_id: str, user_id: str) -> Dict[str, Any]:
        selection = {
            "sessionId": session_id,
            "selectedOptionId": option_id,
            "userId": user_id,
            "createdAt": int(time.time() * 1000)
        }
        self.selections.insert(selection)
        return selection

    def append_to_training_set(self, scene: str, selected_option: str, style: str) -> None:
        """
        Append a training sample to data/lora_train.jsonl in Alpaca/ShareGPT style.
        """
        try:
            if not scene or not selected_option:
                return

            training_entry = {
                "instruction": "你是一个Galgame角色，请根据场景做出反应。",
                "input": f"场景：{scene}",
                "output": f"{selected_option} (风格：{style})"
            }

            log_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "lora_train.jsonl")
            os.makedirs(os.path.dirname(log_path), exist_ok=True)

            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(training_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"Failed to append training sample: {e}")

    def append_to_positive_set(self, scene: str, response: str) -> None:
        """
        Append a positive training sample to data/lora_train_positive.jsonl.
        """
        try:
            if not scene or not response:
                return

            training_entry = {
                "instruction": "你是一个Galgame角色，请根据场景做出反应。",
                "input": f"场景：{scene}",
                "output": response
            }

            log_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "lora_train_positive.jsonl")
            os.makedirs(os.path.dirname(log_path), exist_ok=True)

            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(training_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"Failed to append positive sample: {e}")

    def record_feedback(self, message_id: str, feedback_type: str, training_weight: float,
                        scene: Optional[str] = None, response: Optional[str] = None,
                        user_id: Optional[str] = None) -> Dict[str, Any]:
        entry = {
            "messageId": message_id,
            "type": feedback_type,
            "trainingWeight": training_weight,
            "scene": scene,
            "response": response,
            "userId": user_id,
            "createdAt": int(time.time() * 1000)
        }
        self.feedback.insert(entry)
        return entry

    def get_user_top_styles(self, user_id: str, top_n: int = 3) -> List[str]:
        """
        Return user's top N most frequent styles based on selection history.
        """
        Selection = Query()
        user_selections = self.selections.search(Selection.userId == user_id)

        if not user_selections:
            return []

        style_counter = Counter()
        for sel in user_selections:
            session = self.get_session(sel.get("sessionId", ""))
            if not session:
                continue
            options = session.get("generatedOptions", [])
            option = next((opt for opt in options if opt.get("id") == sel.get("selectedOptionId")), None)
            if not option:
                continue
            style = option.get("type") or option.get("style")
            if style:
                style_counter[style] += 1

        return [style for style, _ in style_counter.most_common(top_n)]

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        Selection = Query()
        user_selections = self.selections.search(Selection.userId == user_id)
        
        return {
            "totalSelections": len(user_selections),
            "lastSelection": user_selections[-1]["selectedOptionId"] if user_selections else None
        }

db_service = DatabaseService()
