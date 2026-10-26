from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Course, ConceptNode, ConceptDependency, AssessmentQuiz, QuizQuestion
from app.schemas.schemas import CourseResponse, CourseCreate, TopicGenerateRequest
from app.services.firebase_service import FirebaseService
from app.services.ai_service import AIService

router = APIRouter(prefix="/courses", tags=["Courses & Curriculum"])

@router.get("", response_model=List[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    results = []
    for c in courses:
        total_concepts = db.query(ConceptNode).filter(ConceptNode.course_id == c.id).count()
        total_deps = db.query(ConceptDependency).filter(ConceptDependency.course_id == c.id).count()
        results.append(CourseResponse(
            id=c.id,
            title=c.title,
            code=c.code,
            description=c.description,
            category=c.category,
            difficulty_level=c.difficulty_level,
            estimated_hours=c.estimated_hours,
            created_at=c.created_at,
            total_concepts=total_concepts,
            total_dependencies=total_deps
        ))
    return results

@router.get("/{course_id}", response_model=CourseResponse)
def get_course_details(course_id: int, db: Session = Depends(get_db)):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    total_concepts = db.query(ConceptNode).filter(ConceptNode.course_id == c.id).count()
    total_deps = db.query(ConceptDependency).filter(ConceptDependency.course_id == c.id).count()
    return CourseResponse(
        id=c.id,
        title=c.title,
        code=c.code,
        description=c.description,
        category=c.category,
        difficulty_level=c.difficulty_level,
        estimated_hours=c.estimated_hours,
        created_at=c.created_at,
        total_concepts=total_concepts,
        total_dependencies=total_deps
    )

@router.post("", response_model=CourseResponse)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    """
    Create a new course entered by user and persist to Firebase and local DB.
    """
    existing = db.query(Course).filter(Course.code == payload.code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Course with code '{payload.code}' already exists")

    course = Course(
        title=payload.title.strip(),
        code=payload.code.strip().upper(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        difficulty_level=payload.difficulty_level or "Intermediate",
        estimated_hours=payload.estimated_hours or 40.0
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Sync to Firebase RTDB
    FirebaseService.save_course({
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "category": course.category,
        "difficulty_level": course.difficulty_level,
        "estimated_hours": course.estimated_hours,
        "created_at": course.created_at.isoformat()
    })

    return CourseResponse(
        id=course.id,
        title=course.title,
        code=course.code,
        description=course.description,
        category=course.category,
        difficulty_level=course.difficulty_level,
        estimated_hours=course.estimated_hours,
        created_at=course.created_at,
        total_concepts=0,
        total_dependencies=0
    )

@router.post("/generate-with-ai", response_model=CourseResponse)
def generate_course_with_ai(payload: TopicGenerateRequest, db: Session = Depends(get_db)):
    """
    Dynamically generates a custom curriculum DAG, concept nodes, prerequisite links,
    and diagnostic quizzes for any topic, saving everything directly to Firebase!
    """
    generated = AIService.generate_curriculum_for_topic(payload.topic)
    c_info = generated["course"]

    # Check if an identical course already exists with concepts
    existing = db.query(Course).filter(func.lower(Course.title) == c_info["title"].lower()).first()
    if existing and db.query(ConceptNode).filter(ConceptNode.course_id == existing.id).count() >= 3:
        total_concepts = db.query(ConceptNode).filter(ConceptNode.course_id == existing.id).count()
        total_dependencies = db.query(ConceptDependency).filter(ConceptDependency.course_id == existing.id).count()
        return CourseResponse(
            id=existing.id,
            title=existing.title,
            code=existing.code,
            description=existing.description,
            category=existing.category,
            difficulty_level=existing.difficulty_level,
            estimated_hours=existing.estimated_hours,
            created_at=existing.created_at,
            total_concepts=total_concepts,
            total_dependencies=total_dependencies
        )

    # Ensure unique course code
    base_code = c_info["code"]
    unique_code = base_code
    suffix = 1
    while db.query(Course).filter(Course.code == unique_code).first():
        unique_code = f"{base_code}-{suffix}"
        suffix += 1

    course = Course(
        title=c_info["title"],
        code=unique_code,
        description=c_info["description"],
        category=c_info["category"],
        difficulty_level=c_info["difficulty_level"],
        estimated_hours=c_info["estimated_hours"]
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Create Concept Nodes & Diagnostic Quizzes in database
    concept_objs = []
    for idx, c_item in enumerate(generated["concepts"]):
        c_node = ConceptNode(
            course_id=course.id,
            code=c_item["code"],
            title=c_item["title"],
            description=c_item["description"],
            category=c_item["category"],
            difficulty=c_item["difficulty"],
            estimated_minutes=c_item["estimated_minutes"],
            bloom_level=c_item["bloom_level"],
            practical_example=c_item["practical_example"],
            summary_content=c_item.get("summary_content", c_item["description"]),
            order_index=idx
        )
        db.add(c_node)
        db.flush()
        concept_objs.append(c_node)

        # Add Quiz for this concept
        if c_item.get("quiz_questions"):
            quiz = AssessmentQuiz(
                concept_id=c_node.id,
                title=f"{c_node.title} Diagnostic",
                description=f"Automated diagnostic evaluation for prerequisite verification in {c_node.title}.",
                time_limit_seconds=300,
                pass_threshold=0.7
            )
            db.add(quiz)
            db.flush()

            for q_data in c_item["quiz_questions"]:
                q_obj = QuizQuestion(
                    quiz_id=quiz.id,
                    question_text=q_data["question_text"],
                    options_json=json.dumps(q_data["options"]),
                    correct_option_index=q_data["correct_option_index"],
                    explanation=q_data.get("explanation"),
                    remediation_hint=q_data.get("remediation_hint")
                )
                db.add(q_obj)

    # Create Concept Dependencies (DAG edges)
    for dep in generated["dependencies"]:
        src_node = concept_objs[dep["source_idx"]]
        tgt_node = concept_objs[dep["target_idx"]]
        dep_obj = ConceptDependency(
            course_id=course.id,
            source_concept_id=src_node.id,
            target_concept_id=tgt_node.id,
            dependency_type=dep["type"],
            strength_weight=dep["weight"],
            explanation=dep["explanation"]
        )
        db.add(dep_obj)
        db.flush()

    db.commit()

    # Asynchronously synchronize course, concepts, quizzes, and DAG dependencies to Firebase in background thread
    def _sync_to_firebase():
        try:
            FirebaseService.save_course({
                "id": course.id,
                "title": course.title,
                "code": course.code,
                "description": course.description,
                "category": course.category,
                "difficulty_level": course.difficulty_level,
                "estimated_hours": course.estimated_hours,
                "created_at": course.created_at.isoformat()
            })
            for idx, c_node in enumerate(concept_objs):
                c_item = generated["concepts"][idx]
                FirebaseService.save_concept({
                    "id": c_node.id,
                    "course_id": course.id,
                    "code": c_node.code,
                    "title": c_node.title,
                    "description": c_node.description,
                    "category": c_node.category,
                    "difficulty": c_node.difficulty,
                    "estimated_minutes": c_node.estimated_minutes,
                    "bloom_level": c_node.bloom_level,
                    "practical_example": c_node.practical_example,
                    "summary_content": c_node.summary_content,
                    "order_index": idx
                })
            for dep in generated["dependencies"]:
                src_node = concept_objs[dep["source_idx"]]
                tgt_node = concept_objs[dep["target_idx"]]
                FirebaseService.save_dependency({
                    "course_id": course.id,
                    "source_concept_id": src_node.id,
                    "target_concept_id": tgt_node.id,
                    "dependency_type": dep["type"],
                    "strength_weight": dep["weight"],
                    "explanation": dep["explanation"]
                })
        except Exception as e:
            print(f"[Firebase Sync Warning] {e}")

    import threading
    threading.Thread(target=_sync_to_firebase, daemon=True).start()

    return CourseResponse(
        id=course.id,
        title=course.title,
        code=course.code,
        description=course.description,
        category=course.category,
        difficulty_level=course.difficulty_level,
        estimated_hours=course.estimated_hours,
        created_at=course.created_at,
        total_concepts=len(concept_objs),
        total_dependencies=len(generated["dependencies"])
    )

