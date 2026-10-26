from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ConceptNode
from app.schemas.schemas import LearningPathResponse
from app.services.graph_engine import ConceptGraphEngine

router = APIRouter(prefix="/learning-paths", tags=["Adaptive Learning Pathways"])

@router.get("/generate", response_model=LearningPathResponse)
def generate_adaptive_path(
    target_concept_id: int = Query(..., description="The ultimate target concept the student wants to master"),
    user_id: int = Query(1, description="Student user ID"),
    db: Session = Depends(get_db)
):
    target_node = db.query(ConceptNode).filter(ConceptNode.id == target_concept_id).first()
    if not target_node:
        raise HTTPException(status_code=404, detail="Target concept not found")

    engine = ConceptGraphEngine(db, target_node.course_id)
    path_data = engine.generate_adaptive_path(user_id=user_id, target_concept_id=target_concept_id)
    
    if "error" in path_data:
        raise HTTPException(status_code=400, detail=path_data["error"])

    return LearningPathResponse(**path_data)
