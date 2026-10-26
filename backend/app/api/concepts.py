from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import ConceptNode, ConceptDependency, Course, StudentMastery, AssessmentQuiz
from app.schemas.schemas import (
    ConceptGraphResponse, GraphNodeData, GraphEdgeData,
    ConceptNodeResponse, ConceptDependencyResponse,
    ConceptNodeCreate, ConceptDependencyCreate
)
from app.services.graph_engine import ConceptGraphEngine
from app.services.ai_service import AIService
from app.services.firebase_service import FirebaseService

from app.services.google_knowledge_service import GoogleKnowledgeEngine

router = APIRouter(prefix="/concepts", tags=["Concept Graph & Dependencies"])

@router.get("/matter/search")
def search_google_concept_matter(
    query: str = Query(..., description="Topic or concept to search from Google Knowledge Engine"),
    concept_id: Optional[int] = Query(None, description="Optional concept ID"),
    db: Session = Depends(get_db)
):
    """
    Exhaustive Google Master Knowledge Search:
    Fetches everything the learner needs to know about any searched topic,
    complete with 360-degree theory, mathematical rules, production code,
    common pitfalls, industry scale applications, and live Google & Scholar links.
    """
    q_clean = query.strip()
    if not q_clean and not concept_id:
        raise HTTPException(status_code=400, detail="Query or concept_id required")

    category = "Computer Science & AI"
    bloom = "Analyze"
    desc = None

    if concept_id:
        node = db.query(ConceptNode).filter(ConceptNode.id == concept_id).first()
        if node:
            q_clean = node.title
            category = node.category
            bloom = node.bloom_level
            desc = node.description

    return GoogleKnowledgeEngine.get_master_knowledge_matter(
        topic=q_clean,
        category=category,
        bloom_level=bloom,
        custom_description=desc
    )

@router.get("/{concept_id}/deep-briefing")
def get_concept_deep_briefing(concept_id: int, db: Session = Depends(get_db)):
    """
    Returns an exhaustive, point-by-point deep conceptual briefing for a topic,
    including mental models, key points, theoretical rules, practical examples, 
    misconceptions, industry use cases, and direct Google Knowledge links.
    """
    node = db.query(ConceptNode).filter(ConceptNode.id == concept_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Concept not found")

    # Get master knowledge briefing from Google Knowledge Engine
    master_matter = GoogleKnowledgeEngine.get_master_knowledge_matter(
        topic=node.title,
        category=node.category,
        bloom_level=node.bloom_level,
        custom_description=node.description
    )

    # Attach node code and practical example
    master_matter["code"] = node.code
    if node.practical_example and len(node.practical_example) > 20:
        master_matter["practical_example_snippet"] = node.practical_example

    return master_matter

@router.get("/graph/{course_id}", response_model=ConceptGraphResponse)
def get_concept_graph(
    course_id: int,
    user_id: Optional[int] = Query(1, description="Student user ID for calculating dynamic mastery states"),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    engine = ConceptGraphEngine(db, course_id)
    node_statuses = engine.calculate_node_statuses(user_id)
    topological_order = engine.get_topological_order()

    nodes_out: List[GraphNodeData] = []
    mastered_count = 0
    ready_count = 0
    locked_count = 0
    in_progress_count = 0
    total_mastery_sum = 0.0

    for node_id, status_data in node_statuses.items():
        nodes_out.append(GraphNodeData(**status_data))
        st = status_data["status"]
        if st == "MASTERED":
            mastered_count += 1
        elif st == "READY":
            ready_count += 1
        elif st == "LOCKED":
            locked_count += 1
        elif st in ["IN_PROGRESS", "NEEDS_REMEDIATION"]:
            in_progress_count += 1
        total_mastery_sum += status_data["mastery_score"]

    edges_out: List[GraphEdgeData] = []
    for dep in engine.dependencies_data:
        edges_out.append(GraphEdgeData(
            id=dep.id,
            source=dep.source_concept_id,
            target=dep.target_concept_id,
            dependency_type=dep.dependency_type,
            strength_weight=dep.strength_weight,
            explanation=dep.explanation
        ))

    total_concepts = len(nodes_out)
    avg_mastery_pct = round((total_mastery_sum / total_concepts * 100) if total_concepts > 0 else 0, 1)

    return ConceptGraphResponse(
        course_id=course.id,
        course_title=course.title,
        nodes=nodes_out,
        edges=edges_out,
        topological_order=topological_order,
        total_concepts=total_concepts,
        mastered_count=mastered_count,
        ready_count=ready_count,
        locked_count=locked_count,
        in_progress_count=in_progress_count,
        overall_mastery_percentage=avg_mastery_pct
    )

@router.get("/{concept_id}")
def get_concept_details(
    concept_id: int,
    user_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    node = db.query(ConceptNode).filter(ConceptNode.id == concept_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Concept not found")

    engine = ConceptGraphEngine(db, node.course_id)
    prereq_ids = engine.get_direct_prerequisites(concept_id)
    dependent_ids = engine.get_direct_dependents(concept_id)

    prereqs = db.query(ConceptNode).filter(ConceptNode.id.in_(prereq_ids)).all() if prereq_ids else []
    dependents = db.query(ConceptNode).filter(ConceptNode.id.in_(dependent_ids)).all() if dependent_ids else []

    mastery = db.query(StudentMastery).filter(
        StudentMastery.user_id == user_id,
        StudentMastery.concept_id == concept_id
    ).first()

    quiz = db.query(AssessmentQuiz).filter(AssessmentQuiz.concept_id == concept_id).first()

    return {
        "id": node.id,
        "course_id": node.course_id,
        "code": node.code,
        "title": node.title,
        "description": node.description,
        "category": node.category,
        "difficulty": node.difficulty,
        "estimated_minutes": node.estimated_minutes,
        "bloom_level": node.bloom_level,
        "practical_example": node.practical_example,
        "summary_content": node.summary_content,
        "mastery_score": mastery.mastery_score if mastery else 0.0,
        "status": mastery.status if mastery else "READY",
        "has_quiz": quiz is not None,
        "quiz_id": quiz.id if quiz else None,
        "direct_prerequisites": [{"id": p.id, "code": p.code, "title": p.title} for p in prereqs],
        "direct_dependents": [{"id": d.id, "code": d.code, "title": d.title} for d in dependents]
    }

@router.get("/{concept_id}/deep-briefing")
def get_concept_deep_briefing(concept_id: int, db: Session = Depends(get_db)):
    """
    Returns an exhaustive, point-by-point deep conceptual briefing for a topic,
    including mental models, key points, theoretical rules, practical examples, 
    misconceptions, and industry use cases.
    """
    node = db.query(ConceptNode).filter(ConceptNode.id == concept_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Concept not found")

    return AIService.generate_deep_topic_briefing(
        concept_title=node.title,
        concept_code=node.code,
        category=node.category,
        bloom_level=node.bloom_level,
        description=node.description,
        practical_example=node.practical_example,
        summary_content=node.summary_content
    )

@router.get("/dependency-explanation/detail")
def explain_dependency(
    source_id: int,
    target_id: int,
    db: Session = Depends(get_db)
):
    src = db.query(ConceptNode).filter(ConceptNode.id == source_id).first()
    tgt = db.query(ConceptNode).filter(ConceptNode.id == target_id).first()
    if not src or not tgt:
        raise HTTPException(status_code=404, detail="One or both concepts not found")

    dep = db.query(ConceptDependency).filter(
        ConceptDependency.source_concept_id == source_id,
        ConceptDependency.target_concept_id == target_id
    ).first()

    dep_type = dep.dependency_type if dep else "HARD_PREREQUISITE"
    return AIService.explain_dependency_why(src.title, tgt.title, dep_type)

@router.post("", response_model=ConceptNodeResponse)
def create_concept(payload: ConceptNodeCreate, db: Session = Depends(get_db)):
    """
    Create a new concept node in a course and sync to Firebase.
    """
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    concept = ConceptNode(
        course_id=payload.course_id,
        code=payload.code.strip(),
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category or "Core",
        difficulty=payload.difficulty or 1,
        estimated_minutes=payload.estimated_minutes or 45,
        importance_weight=payload.importance_weight if payload.importance_weight is not None else 1.0,
        bloom_level=payload.bloom_level or "Understand",
        practical_example=payload.practical_example,
        summary_content=payload.summary_content,
        order_index=payload.order_index or 0
    )
    db.add(concept)
    db.commit()
    db.refresh(concept)

    # Sync to Firebase
    FirebaseService.save_concept({
        "id": concept.id,
        "course_id": concept.course_id,
        "code": concept.code,
        "title": concept.title,
        "description": concept.description,
        "category": concept.category,
        "difficulty": concept.difficulty,
        "estimated_minutes": concept.estimated_minutes,
        "importance_weight": concept.importance_weight,
        "bloom_level": concept.bloom_level,
        "practical_example": concept.practical_example,
        "summary_content": concept.summary_content,
        "order_index": concept.order_index,
        "created_at": concept.created_at.isoformat()
    })

    return concept

@router.post("/dependencies", response_model=ConceptDependencyResponse)
def create_dependency(payload: ConceptDependencyCreate, db: Session = Depends(get_db)):
    """
    Connect a prerequisite dependency (DAG edge) between two concepts and sync to Firebase.
    """
    src = db.query(ConceptNode).filter(ConceptNode.id == payload.source_concept_id).first()
    tgt = db.query(ConceptNode).filter(ConceptNode.id == payload.target_concept_id).first()
    if not src or not tgt:
        raise HTTPException(status_code=404, detail="Source or target concept not found")

    if src.id == tgt.id:
        raise HTTPException(status_code=400, detail="A concept cannot depend on itself (cycles not allowed in DAG)")

    existing = db.query(ConceptDependency).filter(
        ConceptDependency.source_concept_id == payload.source_concept_id,
        ConceptDependency.target_concept_id == payload.target_concept_id
    ).first()
    if existing:
        return ConceptDependencyResponse(
            id=existing.id,
            course_id=existing.course_id,
            source_concept_id=existing.source_concept_id,
            target_concept_id=existing.target_concept_id,
            dependency_type=existing.dependency_type,
            strength_weight=existing.strength_weight,
            explanation=existing.explanation,
            source_title=src.title,
            target_title=tgt.title,
            created_at=existing.created_at
        )

    dep = ConceptDependency(
        course_id=payload.course_id,
        source_concept_id=payload.source_concept_id,
        target_concept_id=payload.target_concept_id,
        dependency_type=payload.dependency_type or "HARD_PREREQUISITE",
        strength_weight=payload.strength_weight or 1.0,
        explanation=payload.explanation or f"{src.title} is a foundational prerequisite for {tgt.title}."
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)

    # Sync to Firebase
    FirebaseService.save_dependency({
        "id": dep.id,
        "course_id": dep.course_id,
        "source_concept_id": dep.source_concept_id,
        "target_concept_id": dep.target_concept_id,
        "dependency_type": dep.dependency_type,
        "strength_weight": dep.strength_weight,
        "explanation": dep.explanation,
        "created_at": dep.created_at.isoformat()
    })

    return ConceptDependencyResponse(
        id=dep.id,
        course_id=dep.course_id,
        source_concept_id=dep.source_concept_id,
        target_concept_id=dep.target_concept_id,
        dependency_type=dep.dependency_type,
        strength_weight=dep.strength_weight,
        explanation=dep.explanation,
        source_title=src.title,
        target_title=tgt.title,
        created_at=dep.created_at
    )

