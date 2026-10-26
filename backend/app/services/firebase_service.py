import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("firebase_service")
logger.setLevel(logging.INFO)

FIREBASE_RTDB_URL = "https://ai-concept-mapper-55d53-default-rtdb.firebaseio.com"

def _http_request(method: str, path: str, data: Optional[Dict[str, Any]] = None) -> Optional[Any]:
    """
    Executes an HTTP request to Firebase Realtime Database.
    Uses requests if available, falling back to urllib.
    """
    url = f"{FIREBASE_RTDB_URL}/{path.lstrip('/')}.json"
    json_bytes = json.dumps(data, default=str).encode("utf-8") if data is not None else None

    try:
        import requests
        headers = {"Content-Type": "application/json"}
        if method.upper() == "GET":
            resp = requests.get(url, headers=headers, timeout=5)
        elif method.upper() == "PUT":
            resp = requests.put(url, data=json_bytes, headers=headers, timeout=5)
        elif method.upper() == "POST":
            resp = requests.post(url, data=json_bytes, headers=headers, timeout=5)
        elif method.upper() == "PATCH":
            resp = requests.patch(url, data=json_bytes, headers=headers, timeout=5)
        elif method.upper() == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=5)
        else:
            return None

        if resp.status_code in [200, 201, 204]:
            return resp.json() if resp.text else None
        else:
            logger.warning(f"Firebase request failed [{method} {url}]: {resp.status_code} {resp.text}")
            return None
    except Exception:
        # Fallback to urllib.request
        try:
            import urllib.request
            req = urllib.request.Request(url, data=json_bytes, method=method.upper())
            req.add_header("Content-Type", "application/json")
            with urllib.request.urlopen(req, timeout=5) as response:
                content = response.read().decode("utf-8")
                return json.loads(content) if content else None
        except Exception as e:
            logger.error(f"Firebase urllib fallback error for {url}: {e}")
            return None


class FirebaseService:
    """
    Service layer providing centralized synchronization between our application 
    and Firebase Realtime Database (ai-concept-mapper-55d53).
    """

    # --- Users ---
    @staticmethod
    def save_user(user_data: Dict[str, Any]) -> bool:
        uid = str(user_data.get("id"))
        clean_data = {**user_data}
        if "hashed_password" in clean_data:
            # Mask or store safe hash
            clean_data["has_password"] = True
        return _http_request("PUT", f"users/{uid}", clean_data) is not None

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        return _http_request("GET", f"users/{user_id}")

    @staticmethod
    def get_all_users() -> List[Dict[str, Any]]:
        data = _http_request("GET", "users")
        if not data:
            return []
        if isinstance(data, dict):
            return [v for v in data.values() if v is not None]
        if isinstance(data, list):
            return [v for v in data if v is not None]
        return []

    # --- Courses ---
    @staticmethod
    def save_course(course_data: Dict[str, Any]) -> bool:
        cid = str(course_data.get("id"))
        return _http_request("PUT", f"courses/{cid}", course_data) is not None

    @staticmethod
    def get_all_courses() -> List[Dict[str, Any]]:
        data = _http_request("GET", "courses")
        if not data:
            return []
        if isinstance(data, dict):
            return [v for v in data.values() if v is not None]
        if isinstance(data, list):
            return [v for v in data if v is not None]
        return []

    @staticmethod
    def get_course(course_id: int) -> Optional[Dict[str, Any]]:
        return _http_request("GET", f"courses/{course_id}")

    # --- Concept Nodes ---
    @staticmethod
    def save_concept(concept_data: Dict[str, Any]) -> bool:
        cid = str(concept_data.get("id"))
        return _http_request("PUT", f"concepts/{cid}", concept_data) is not None

    @staticmethod
    def get_concepts_by_course(course_id: int) -> List[Dict[str, Any]]:
        data = _http_request("GET", "concepts")
        if not data:
            return []
        nodes = []
        items = data.values() if isinstance(data, dict) else data
        for c in items:
            if c and c.get("course_id") == course_id:
                nodes.append(c)
        return nodes

    # --- Concept Dependencies ---
    @staticmethod
    def save_dependency(dep_data: Dict[str, Any]) -> bool:
        dep_id = str(dep_data.get("id"))
        return _http_request("PUT", f"dependencies/{dep_id}", dep_data) is not None

    @staticmethod
    def get_dependencies_by_course(course_id: int) -> List[Dict[str, Any]]:
        data = _http_request("GET", "dependencies")
        if not data:
            return []
        deps = []
        items = data.values() if isinstance(data, dict) else data
        for d in items:
            if d and d.get("course_id") == course_id:
                deps.append(d)
        return deps

    # --- Diagnostic Quizzes ---
    @staticmethod
    def save_quiz(quiz_data: Dict[str, Any]) -> bool:
        qid = str(quiz_data.get("id"))
        return _http_request("PUT", f"quizzes/{qid}", quiz_data) is not None

    @staticmethod
    def get_quiz_by_concept(concept_id: int) -> Optional[Dict[str, Any]]:
        data = _http_request("GET", "quizzes")
        if not data:
            return None
        items = data.values() if isinstance(data, dict) else data
        for q in items:
            if q and q.get("concept_id") == concept_id:
                return q
        return None

    # --- Quiz Attempts ---
    @staticmethod
    def save_quiz_attempt(attempt_data: Dict[str, Any]) -> bool:
        aid = str(attempt_data.get("id") or int(datetime.utcnow().timestamp() * 1000))
        return _http_request("PUT", f"quiz_attempts/{aid}", attempt_data) is not None

    # --- Student Mastery ---
    @staticmethod
    def save_student_mastery(user_id: int, concept_id: int, mastery_data: Dict[str, Any]) -> bool:
        key = f"{user_id}_{concept_id}"
        return _http_request("PUT", f"student_mastery/{key}", mastery_data) is not None

    @staticmethod
    def get_student_masteries(user_id: int) -> Dict[int, Dict[str, Any]]:
        data = _http_request("GET", "student_mastery")
        if not data:
            return {}
        result = {}
        items = data.values() if isinstance(data, dict) else data
        for m in items:
            if m and m.get("user_id") == user_id:
                cid = m.get("concept_id")
                if cid:
                    result[cid] = m
        return result

    # --- AI Tutor Chats ---
    @staticmethod
    def save_ai_tutor_chat(chat_data: Dict[str, Any]) -> bool:
        cid = str(int(datetime.utcnow().timestamp() * 1000))
        return _http_request("PUT", f"ai_tutor_chats/{cid}", chat_data) is not None

    # --- Comparative Study & System Info ---
    @staticmethod
    def log_comparative_metric(metric_data: Dict[str, Any]) -> bool:
        return _http_request("POST", "comparative_study_logs", metric_data) is not None

    @staticmethod
    def test_connection() -> Dict[str, Any]:
        """Test connection status to Firebase RTDB."""
        res = _http_request("GET", "system_configs")
        return {
            "connected": res is not None,
            "firebase_url": FIREBASE_RTDB_URL,
            "timestamp": datetime.utcnow().isoformat()
        }
