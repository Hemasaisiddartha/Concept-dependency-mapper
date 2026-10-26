# Backend - Smart AI Concept Dependency Mapper

FastAPI-powered REST backend with NetworkX Directed Acyclic Graph (DAG) analysis, SQLite database, dynamic mastery progression, and pedagogical comparative analytics.

## Prerequisites
- Python 3.10+
- `pip install -r requirements.txt`

## Running the Server
```bash
python run.py
```
or
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## Interactive API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key API Endpoints
- `GET /api/courses`: List all available educational curricula.
- `GET /api/concepts/graph/{course_id}?user_id=1`: Returns full concept graph with live student mastery statuses, DAG nodes, and dependency edges.
- `GET /api/learning-paths/generate?target_concept_id={id}&user_id=1`: Computes AI adaptive learning pathway to a target concept.
- `GET /api/quiz/concept/{concept_id}`: Retrieves diagnostic micro-quiz questions.
- `POST /api/quiz/submit`: Submits quiz attempt, updates student mastery in SQLite, unlocks downstream nodes, and generates AI remediation feedback.
- `GET /api/analytics/comparative-study`: Retrieves empirical research metrics comparing Traditional vs AI-based systems.
- `POST /api/ai-tutor/query`: Interactive AI reasoning assistant for concepts, prerequisites, and learning tips.
