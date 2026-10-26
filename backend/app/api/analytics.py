from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ComparativeAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Comparative Research & Empirical Analytics"])

@router.get("/comparative-study", response_model=ComparativeAnalyticsResponse)
def get_comparative_study_metrics(db: Session = Depends(get_db)):
    """
    Returns empirical research data comparing:
    - Traditional Linear Learning Systems (Control Group)
    - Smart AI-Based Concept Dependency Mapper (Experimental Group)
    """
    data = AnalyticsService.get_comparative_analytics(db)
    return ComparativeAnalyticsResponse(**data)
