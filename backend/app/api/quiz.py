import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.core.database import get_db
from app.models.models import (
    AssessmentQuiz, QuizQuestion, StudentMastery, StudentQuizAttempt, ConceptNode, ConceptDependency
)
from app.schemas.schemas import (
    AssessmentQuizData, QuizQuestionData, QuizOption,
    QuizSubmitRequest, QuizSubmitResult, QuestionResult,
    AssessmentQuizCreate
)
from app.services.graph_engine import ConceptGraphEngine
from app.services.ai_service import AIService
from app.services.firebase_service import FirebaseService

router = APIRouter(prefix="/quiz", tags=["Diagnostic Quizzes & Assessment"])

@router.get("/concept/{concept_id}", response_model=AssessmentQuizData)
def get_quiz_for_concept(concept_id: int, db: Session = Depends(get_db)):
    concept = db.query(ConceptNode).filter(ConceptNode.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    quiz = db.query(AssessmentQuiz).filter(AssessmentQuiz.concept_id == concept_id).first()
    if not quiz:
        quiz = AssessmentQuiz(
            concept_id=concept_id,
            title=f"{concept.title} Diagnostic Assessment (20 Questions)",
            description=f"Exhaustive 20-question diagnostic assessment testing all foundational and advanced points of {concept.title}.",
            time_limit_seconds=600,
            pass_threshold=0.7
        )
        db.add(quiz)
        db.flush()

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()

    # Ensure 20 questions exist in database
    if len(questions) < 20:
        bank = AIService.generate_20_quiz_questions(concept.title, concept.code, concept.category)
        existing_texts = {q.question_text for q in questions}
        
        for q_item in bank:
            if len(questions) >= 20:
                break
            if q_item["question_text"] not in existing_texts:
                q_obj = QuizQuestion(
                    quiz_id=quiz.id,
                    question_text=q_item["question_text"],
                    options_json=json.dumps(q_item["options"]),
                    correct_option_index=q_item["correct_option_index"],
                    difficulty_level=2,
                    explanation=q_item["explanation"],
                    remediation_hint=q_item["remediation_hint"]
                )
                db.add(q_obj)
                questions.append(q_obj)
                existing_texts.add(q_item["question_text"])
        
        db.commit()
        questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()

    q_data_list: List[QuizQuestionData] = []
    for q in questions:
        raw_options = json.loads(q.options_json) if isinstance(q.options_json, str) else q.options_json
        options = [QuizOption(id=idx, text=opt) for idx, opt in enumerate(raw_options)]
        q_data_list.append(QuizQuestionData(
            id=q.id,
            question_text=q.question_text,
            difficulty_level=q.difficulty_level,
            options=options,
            remediation_hint=q.remediation_hint
        ))

    return AssessmentQuizData(
        id=quiz.id,
        concept_id=quiz.concept_id,
        concept_title=concept.title if concept else "Concept Diagnostic",
        title=quiz.title or f"{concept.title} Diagnostic Assessment",
        description=quiz.description or "20-Question Comprehensive Assessment",
        time_limit_seconds=quiz.time_limit_seconds or 600,
        pass_threshold=quiz.pass_threshold or 0.7,
        questions=q_data_list[:20]
    )


@router.post("/create", response_model=AssessmentQuizData)
def create_quiz_for_concept(payload: AssessmentQuizCreate, db: Session = Depends(get_db)):
    """
    Create a custom diagnostic quiz for a concept with multiple-choice questions, syncing to Firebase.
    """
    concept = db.query(ConceptNode).filter(ConceptNode.id == payload.concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    existing_quiz = db.query(AssessmentQuiz).filter(AssessmentQuiz.concept_id == payload.concept_id).first()
    if existing_quiz:
        quiz = existing_quiz
        quiz.title = payload.title
        quiz.description = payload.description
        quiz.time_limit_seconds = payload.time_limit_seconds or 300
        quiz.pass_threshold = payload.pass_threshold or 0.7
    else:
        quiz = AssessmentQuiz(
            concept_id=payload.concept_id,
            title=payload.title,
            description=payload.description,
            time_limit_seconds=payload.time_limit_seconds or 300,
            pass_threshold=payload.pass_threshold or 0.7
        )
        db.add(quiz)
        db.flush()

    if payload.questions:
        for q_data in payload.questions:
            q_obj = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data.question_text,
                options_json=json.dumps(q_data.options),
                correct_option_index=q_data.correct_option_index,
                difficulty_level=q_data.difficulty_level or 2,
                explanation=q_data.explanation,
                remediation_hint=q_data.remediation_hint
            )
            db.add(q_obj)

    db.commit()
    db.refresh(quiz)

    # Sync Quiz to Firebase
    FirebaseService.save_quiz({
        "id": quiz.id,
        "concept_id": quiz.concept_id,
        "title": quiz.title,
        "description": quiz.description,
        "time_limit_seconds": quiz.time_limit_seconds,
        "pass_threshold": quiz.pass_threshold,
        "questions_count": len(payload.questions) if payload.questions else 0
    })

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    q_data_list = []
    for q in questions:
        raw_options = json.loads(q.options_json) if isinstance(q.options_json, str) else q.options_json
        q_data_list.append(QuizQuestionData(
            id=q.id,
            question_text=q.question_text,
            difficulty_level=q.difficulty_level,
            options=[QuizOption(id=idx, text=opt) for idx, opt in enumerate(raw_options)],
            remediation_hint=q.remediation_hint
        ))

    return AssessmentQuizData(
        id=quiz.id,
        concept_id=quiz.concept_id,
        concept_title=concept.title,
        title=quiz.title,
        description=quiz.description,
        time_limit_seconds=quiz.time_limit_seconds,
        pass_threshold=quiz.pass_threshold,
        questions=q_data_list
    )

@router.post("/submit", response_model=QuizSubmitResult)
def submit_quiz_attempt(payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    quiz = db.query(AssessmentQuiz).filter(AssessmentQuiz.id == payload.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    concept = db.query(ConceptNode).filter(ConceptNode.id == quiz.concept_id).first()
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    q_map = {q.id: q for q in questions}

    correct_count = 0
    question_results: List[QuestionResult] = []
    failed_questions: List[str] = []

    for ans in payload.answers:
        q = q_map.get(ans.question_id)
        if not q:
            continue
        is_corr = (ans.selected_option_index == q.correct_option_index)
        if is_corr:
            correct_count += 1
        else:
            failed_questions.append(q.question_text)

        question_results.append(QuestionResult(
            question_id=q.id,
            question_text=q.question_text,
            selected_option_index=ans.selected_option_index,
            correct_option_index=q.correct_option_index,
            is_correct=is_corr,
            explanation=q.explanation or "Standard concept evaluation.",
            remediation_hint=q.remediation_hint
        ))

    total_q = len(questions) if len(questions) > 0 else 1
    score = round(correct_count / total_q, 2)
    passed = score >= quiz.pass_threshold

    # Record Attempt in DB
    attempt = StudentQuizAttempt(
        user_id=payload.user_id,
        quiz_id=payload.quiz_id,
        score=score,
        passed=passed,
        answers_json=json.dumps([a.dict() for a in payload.answers]),
        time_spent_seconds=payload.time_spent_seconds,
        completed_at=datetime.utcnow()
    )
    db.add(attempt)

    # Update Student Mastery in DB
    mastery = db.query(StudentMastery).filter(
        StudentMastery.user_id == payload.user_id,
        StudentMastery.concept_id == quiz.concept_id
    ).first()

    if not mastery:
        mastery = StudentMastery(
            user_id=payload.user_id,
            concept_id=quiz.concept_id,
            attempts_count=1,
            mastery_score=score,
            status="MASTERED" if passed else "NEEDS_REMEDIATION",
            last_assessed_at=datetime.utcnow()
        )
        db.add(mastery)
    else:
        mastery.attempts_count += 1
        mastery.mastery_score = max(mastery.mastery_score, score) if passed else score
        mastery.status = "MASTERED" if passed else "NEEDS_REMEDIATION"
        mastery.last_assessed_at = datetime.utcnow()

    db.commit()

    # Sync Quiz Attempt & Mastery to Firebase Realtime Database
    FirebaseService.save_quiz_attempt({
        "id": attempt.id,
        "user_id": payload.user_id,
        "quiz_id": payload.quiz_id,
        "concept_id": quiz.concept_id,
        "concept_title": concept.title if concept else "Concept",
        "score": score,
        "passed": passed,
        "time_spent_seconds": payload.time_spent_seconds,
        "completed_at": attempt.completed_at.isoformat()
    })

    FirebaseService.save_student_mastery(payload.user_id, quiz.concept_id, {
        "user_id": payload.user_id,
        "concept_id": quiz.concept_id,
        "mastery_score": mastery.mastery_score,
        "status": mastery.status,
        "attempts_count": mastery.attempts_count,
        "last_assessed_at": mastery.last_assessed_at.isoformat() if mastery.last_assessed_at else None
    })

    # Determine newly unlocked concepts or diagnose gaps
    unlocked_names: List[str] = []
    ai_feedback = None

    if concept:
        engine = ConceptGraphEngine(db, concept.course_id)
        if passed:
            dependents = engine.get_direct_dependents(concept.id)
            for dep_id in dependents:
                dep_node = db.query(ConceptNode).filter(ConceptNode.id == dep_id).first()
                if dep_node:
                    unlocked_names.append(dep_node.title)
            ai_feedback = (
                f"Outstanding! You demonstrated {round(score*100)}% mastery on '{concept.title}'. "
                f"Your understanding now unlocks the next tier of advanced concept dependencies."
            )
        else:
            prereq_ids = engine.get_direct_prerequisites(concept.id)
            prereqs = db.query(ConceptNode).filter(ConceptNode.id.in_(prereq_ids)).all() if prereq_ids else []
            missing = [p.title for p in prereqs]
            diagnosis = AIService.diagnose_learning_gap(
                concept.title,
                failed_questions[0] if failed_questions else "",
                score,
                missing
            )
            ai_feedback = diagnosis["root_cause_analysis"] + " " + diagnosis["recommended_action"]

    return QuizSubmitResult(
        quiz_id=quiz.id,
        concept_id=quiz.concept_id,
        concept_title=concept.title if concept else "Concept",
        score=score,
        passed=passed,
        correct_answers_count=correct_count,
        total_questions=total_q,
        new_mastery_score=mastery.mastery_score,
        new_status=mastery.status,
        time_spent_seconds=payload.time_spent_seconds,
        question_results=question_results,
        ai_remediation_feedback=ai_feedback,
        unlocked_concepts=unlocked_names
    )

