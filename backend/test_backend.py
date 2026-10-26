import sys
from app.core.database import SessionLocal
from app.models.models import Course, ConceptNode, ConceptDependency, User, StudentMastery, StudentQuizAttempt, AssessmentQuiz
from app.services.graph_engine import ConceptGraphEngine
from app.services.analytics_service import AnalyticsService
from app.api.auth import register_user, login_user, get_current_user_stats, reset_user_progress
from app.api.quiz import submit_quiz_attempt
from app.schemas.schemas import UserRegisterRequest, UserLoginRequest, QuizSubmitRequest, QuizSubmitAnswer, ResetProgressRequest

def test_system():
    import main
    db = SessionLocal()
    courses = db.query(Course).all()
    print(f"Courses count: {len(courses)}")
    for c in courses:
        nodes = db.query(ConceptNode).filter(ConceptNode.course_id == c.id).count()
        deps = db.query(ConceptDependency).filter(ConceptDependency.course_id == c.id).count()
        print(f" - Course '{c.title}': {nodes} concepts, {deps} dependencies")

        engine = ConceptGraphEngine(db, c.id)
        print(f"   Is DAG (acyclic): {engine.is_dag()}")
        print(f"   Topological Order length: {len(engine.get_topological_order())}")
        
        # Test adaptive path to Transformer Architecture (DL-13)
        target = db.query(ConceptNode).filter(ConceptNode.code == "DL-13").first()
        if target:
            path = engine.generate_adaptive_path(user_id=1, target_concept_id=target.id)
            print(f"   Adaptive Path to '{target.title}': {len(path['path_nodes'])} steps, {path['estimated_total_time_minutes']} mins")

    # Test Auth Login for Seed User (Alex)
    login_res = login_user(UserLoginRequest(username="alex_student", password="password123"), db)
    print(f"Auth Login successful for: {login_res.user.full_name}, Token: {login_res.token[:15]}...")

    # Test Registering a brand new account (e.g. emily_watson)
    test_uname = "emily_watson"
    existing = db.query(User).filter(User.username == test_uname).first()
    if existing:
        db.delete(existing)
        db.commit()

    reg_res = register_user(UserRegisterRequest(
        username=test_uname,
        email="emily@university.edu",
        full_name="Emily Watson",
        password="securepass123",
        role="student",
        group_assignment="ai_concept_mapper"
    ), db)
    emily_id = reg_res.user.id
    print(f"Registered new account: {reg_res.user.full_name} (ID: {emily_id})")

    # Check stats for new user: must start with 0% mastery and initial READY nodes (Calculus, Linear Algebra, etc.)
    new_user_stats = get_current_user_stats(user_id=emily_id, course_id=1, db=db)
    print(f"New User Initial Stats -> Mastered: {new_user_stats.total_mastered}, Ready: {new_user_stats.total_ready}, Overall Mastery: {new_user_stats.overall_mastery_percentage}%")
    assert new_user_stats.total_mastered == 0, "New user should start with 0 mastered concepts"
    assert new_user_stats.total_ready > 0, "New user should have root concepts ready to learn"

    # Test taking a quiz for Course 1 concept for Emily
    calc_concept = db.query(ConceptNode).filter(ConceptNode.course_id == 1).first()
    assert calc_concept is not None, "Course 1 must have at least one concept node"
    calc_quiz = db.query(AssessmentQuiz).filter(AssessmentQuiz.concept_id == calc_concept.id).first()
    if not calc_quiz:
        from app.api.quiz import get_quiz_for_concept
        get_quiz_for_concept(calc_concept.id, db)
        calc_quiz = db.query(AssessmentQuiz).filter(AssessmentQuiz.concept_id == calc_concept.id).first()
    
    quiz_res = submit_quiz_attempt(QuizSubmitRequest(
        user_id=emily_id,
        quiz_id=calc_quiz.id,
        time_spent_seconds=50,
        answers=[
            QuizSubmitAnswer(question_id=q.id, selected_option_index=q.correct_option_index)
            for q in calc_quiz.questions
        ]
    ), db)

    print(f"Quiz submitted for {reg_res.user.full_name}: Score: {quiz_res.score*100}%, Passed: {quiz_res.passed}")
    assert quiz_res.passed, "Emily should pass the quiz"
    assert quiz_res.new_status == "MASTERED", "Concept status should become MASTERED"

    # Verify attempt and mastery record persisted in database for Emily
    db_attempt = db.query(StudentQuizAttempt).filter(StudentQuizAttempt.user_id == emily_id).first()
    assert db_attempt is not None, "Quiz attempt must be stored in database"

    db_mastery = db.query(StudentMastery).filter(StudentMastery.user_id == emily_id, StudentMastery.concept_id == calc_concept.id).first()
    assert db_mastery is not None and db_mastery.mastery_score == 1.0, "Mastery must be saved in database for Emily"

    # Check that updated stats reflect 1 mastered concept in real-time
    updated_stats = get_current_user_stats(user_id=emily_id, course_id=1, db=db)
    print(f"Updated Stats after Quiz -> Mastered: {updated_stats.total_mastered}, Ready: {updated_stats.total_ready}, Overall Mastery: {updated_stats.overall_mastery_percentage}%")
    assert updated_stats.total_mastered == 1, "Emily should now have 1 mastered concept"

    # Test Reset Progress for Emily
    reset_res = reset_user_progress(ResetProgressRequest(user_id=emily_id, course_id=1), db)
    print(f"Reset Progress Result: {reset_res['message']}")
    reset_stats = get_current_user_stats(user_id=emily_id, course_id=1, db=db)
    assert reset_stats.total_mastered == 0, "Masteries should be 0 after reset"

    # Test Comparative Research Analytics
    analytics = AnalyticsService.get_comparative_analytics(db)
    print(f"Analytics Cohen's d: {analytics['cohen_d_effect_size']}, p-value: {analytics['p_value']}")
    print("ALL BACKEND, DATABASE PERSISTENCE, & AUTH ISOLATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_system()
