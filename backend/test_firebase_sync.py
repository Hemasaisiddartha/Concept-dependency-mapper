"""
Automated Test for Firebase Realtime Database Integration & Dynamic Data Creation
Direct route & service testing without TestClient dependency.
"""
from app.core.database import SessionLocal, Base, engine
import app.models.models
from app.models.models import User, Course, ConceptNode, ConceptDependency, AssessmentQuiz, QuizQuestion
from app.services.firebase_service import FirebaseService
from app.services.ai_service import AIService
from app.api import auth, courses, concepts, quiz, ai_tutor
from app.schemas.schemas import (
    UserRegisterRequest, CourseCreate, ConceptNodeCreate, 
    ConceptDependencyCreate, TopicGenerateRequest, QuizSubmitRequest,
    QuizSubmitAnswer, AITutorQueryRequest
)

def test_firebase_integration_and_dynamic_flow():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("\n--- 1. Testing Firebase Connection ---")
    fb_status = FirebaseService.test_connection()
    print("Firebase Status:", fb_status)
    assert fb_status["connected"] is True

    print("\n--- 2. Testing Real User Registration & Firebase Sync ---")
    import time
    uname = f"student_{int(time.time())}"
    reg_payload = UserRegisterRequest(
        username=uname,
        email=f"{uname}@university.edu",
        full_name="Hemas S",
        password="securepassword123",
        role="student",
        group_assignment="ai_concept_mapper"
    )
    reg_resp = auth.register_user(reg_payload, db)
    user_id = reg_resp.user.id
    print("Registered User:", reg_resp.user.full_name, "ID:", user_id)

    # Check user in Firebase RTDB
    fb_user = FirebaseService.get_user_by_id(user_id)
    print("Firebase Stored User:", fb_user)
    assert fb_user is not None
    assert fb_user["username"] == uname

    print("\n--- 3. Testing Dynamic Course Creation with AI Generator & Firebase Sync ---")
    gen_payload = TopicGenerateRequest(
        topic="Applied Machine Learning & Neural Networks",
        user_id=user_id
    )
    course_resp = courses.generate_course_with_ai(gen_payload, db)
    course_id = course_resp.id
    print("Generated Course:", course_resp.title, "Code:", course_resp.code, "Concepts:", course_resp.total_concepts)
    assert course_resp.total_concepts >= 4

    # Check Course in Firebase
    fb_course = FirebaseService.get_course(course_id)
    print("Firebase Stored Course:", fb_course)
    assert fb_course is not None

    print("\n--- 4. Testing Graph Retrieval & DAG Calculation ---")
    graph_resp = concepts.get_concept_graph(course_id, user_id, db)
    print("Graph Nodes Count:", len(graph_resp.nodes), "Edges Count:", len(graph_resp.edges))
    first_node = graph_resp.nodes[0]
    print("Initial First Node Status:", first_node.status, "Score:", first_node.mastery_score)
    assert first_node.status == "READY"

    print("\n--- 5. Testing Diagnostic Quiz & Score Submission to Firebase ---")
    quiz_info = quiz.get_quiz_for_concept(first_node.id, db)
    print("Fetched Quiz for Concept:", quiz_info.title, "Questions:", len(quiz_info.questions))

    # Submit Quiz attempt
    submit_payload = QuizSubmitRequest(
        user_id=user_id,
        quiz_id=quiz_info.id,
        time_spent_seconds=35,
        answers=[
            QuizSubmitAnswer(question_id=q.id, selected_option_index=0)
            for q in quiz_info.questions
        ]
    )
    sub_res = quiz.submit_quiz_attempt(submit_payload, db)
    print("Quiz Submission Result:", "Score:", sub_res.score, "Passed:", sub_res.passed, "New Status:", sub_res.new_status)
    assert sub_res.passed is True

    # Verify updated graph reflects mastery
    updated_graph = concepts.get_concept_graph(course_id, user_id, db)
    print("Updated Overall Mastery %:", updated_graph.overall_mastery_percentage, "Mastered Count:", updated_graph.mastered_count)
    assert updated_graph.mastered_count >= 1

    print("\n--- 6. Testing AI Tutor Chat Logging to Firebase ---")
    tutor_payload = AITutorQueryRequest(
        user_id=user_id,
        concept_id=first_node.id,
        query="Why is this prerequisite necessary before moving forward?"
    )
    tutor_resp = ai_tutor.ask_ai_tutor(tutor_payload, db)
    print("AI Tutor Response snippet:", tutor_resp.response[:80], "...")

    db.close()
    print("\nALL FIREBASE REALTIME DATABASE AND DYNAMIC DATA CREATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_firebase_integration_and_dynamic_flow()
