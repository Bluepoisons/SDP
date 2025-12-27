from tinydb import TinyDB, Query
from typing import Dict, Any, List, Optional
import time
import os

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

    def get_or_create_user(self, user_id: str) -> Dict[str, Any]:
        User = Query()
        user = self.users.search(User.id == user_id)
        if user:
            return user[0]
        
        new_user = {"id": user_id, "username": "Guest", "createdAt": int(time.time() * 1000)}
        self.users.insert(new_user)
        return new_user

    def create_session(self, user_id: str, text: str, style: str, options: List[str], scene_summary: str) -> str:
        session_id = f"session-{int(time.time() * 1000)}"
        new_session = {
            "id": session_id,
            "userId": user_id,
            "originalText": text,
            "contextStyle": style,
            "generatedOptions": options,
            "sceneSummary": scene_summary,
            "createdAt": int(time.time() * 1000)
        }
        self.sessions.insert(new_session)
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        Session = Query()
        result = self.sessions.search(Session.id == session_id)
        return result[0] if result else None

    def create_selection(self, session_id: str, option_id: str, user_id: str) -> Dict[str, Any]:
        selection = {
            "sessionId": session_id,
            "selectedOptionId": option_id,
            "userId": user_id,
            "createdAt": int(time.time() * 1000)
        }
        self.selections.insert(selection)
        
        # --- Training Data Logging ---
        self.log_training_data(session_id, option_id)
        
        return selection

    def log_training_data(self, session_id: str, option_id: str):
        """
        Logs the (scene, options, user_choice) tuple to a JSONL file for future model training.
        """
        try:
            session = self.get_session(session_id)
            if not session:
                return

            training_entry = {
                "timestamp": int(time.time()),
                "scene": session.get("originalText", ""),
                "scene_summary": session.get("sceneSummary", ""),
                "options": session.get("generatedOptions", []),
                "user_choice_id": option_id,
                # Find the text of the selected option
                "user_choice_text": next((opt["text"] for opt in session.get("generatedOptions", []) if opt["id"] == option_id), "")
            }
            
            log_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "training_data.jsonl")
            os.makedirs(os.path.dirname(log_path), exist_ok=True)
            
            with open(log_path, "a", encoding="utf-8") as f:
                import json
                f.write(json.dumps(training_entry, ensure_ascii=False) + "\n")
                
        except Exception as e:
            print(f"Failed to log training data: {e}")

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        Selection = Query()
        user_selections = self.selections.search(Selection.userId == user_id)
        
        return {
            "totalSelections": len(user_selections),
            "lastSelection": user_selections[-1]["selectedOptionId"] if user_selections else None
        }

db_service = DatabaseService()
