from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import PROJECT_TITLE, API_PREFIX
from app.core.database import engine, Base
import app.models.models  # Register models with SQLAlchemy Base metadata
from app.services.firebase_service import FirebaseService
from app.api import auth, courses, concepts, learning_paths, quiz, analytics, ai_tutor

# Create Database tables
Base.metadata.create_all(bind=engine)

# Note: Zero predefined data requirement - Startup seeding is disabled.
# All users, courses, concepts, dependencies, quizzes, and outcomes are dynamically
# created by users and persisted directly to Firebase Realtime Database.

app = FastAPI(
    title="Smart AI Concept Dependency Mapper API",
    description="Backend REST API for 'Improving Student Learning Outcomes Using Smart AI-Based Concept Dependency Mapper Compared to Traditional Learning Systems'",
    version="1.0.0"
)

# Enable CORS for Web and Mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(courses.router, prefix=API_PREFIX)
app.include_router(concepts.router, prefix=API_PREFIX)
app.include_router(learning_paths.router, prefix=API_PREFIX)
app.include_router(quiz.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(ai_tutor.router, prefix=API_PREFIX)

@app.get("/")
def root():
    fb_status = FirebaseService.test_connection()
    return {
        "project": PROJECT_TITLE,
        "status": "Operational",
        "firebase_integration": fb_status,
        "api_docs": "/docs",
        "endpoints": {
            "courses": f"{API_PREFIX}/courses",
            "concept_graph": f"{API_PREFIX}/concepts/graph/1",
            "adaptive_learning_path": f"{API_PREFIX}/learning-paths/generate?target_concept_id=14&user_id=1",
            "comparative_study_analytics": f"{API_PREFIX}/analytics/comparative-study",
            "diagnostic_quiz": f"{API_PREFIX}/quiz/concept/1",
            "ai_tutor": f"{API_PREFIX}/ai-tutor/query"
        }
    }
