from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ConceptNode, StudentMastery
from app.schemas.schemas import AITutorQueryRequest, AITutorQueryResponse
from app.services.ai_service import AIService
from app.services.firebase_service import FirebaseService
from datetime import datetime

router = APIRouter(prefix="/ai-tutor", tags=["AI Concept Tutor & Explainer"])

@router.post("/query", response_model=AITutorQueryResponse)
def ask_ai_tutor(payload: AITutorQueryRequest, db: Session = Depends(get_db)):
    concept_title = None
    user_status = None

    if payload.concept_id:
        concept = db.query(ConceptNode).filter(ConceptNode.id == payload.concept_id).first()
        if concept:
            concept_title = concept.title
            mastery = db.query(StudentMastery).filter(
                StudentMastery.user_id == payload.user_id,
                StudentMastery.concept_id == payload.concept_id
            ).first()
            if mastery:
                user_status = mastery.status

    ai_result = AIService.answer_student_query(payload.query, concept_title, user_status)

    # Sync AI conversation to Firebase
    FirebaseService.save_ai_tutor_chat({
        "user_id": payload.user_id,
        "concept_id": payload.concept_id,
        "concept_title": concept_title,
        "query": payload.query,
        "response": ai_result["response"],
        "timestamp": datetime.utcnow().isoformat()
    })

    return AITutorQueryResponse(
        response=ai_result["response"],
        related_prerequisites=ai_result.get("related_topics", []),
        recommended_action=ai_result.get("recommended_action", "Continue Learning Path")
    )
