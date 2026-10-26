from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Table
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="student")  # student, instructor, researcher
    group_assignment = Column(String(30), default="ai_concept_mapper")  # ai_concept_mapper, traditional_system
    created_at = Column(DateTime, default=datetime.utcnow)

    masteries = relationship("StudentMastery", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("StudentQuizAttempt", back_populates="user", cascade="all, delete-orphan")
    learning_sessions = relationship("LearningSession", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    difficulty_level = Column(String(20), default="Intermediate")
    estimated_hours = Column(Float, default=40.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    concepts = relationship("ConceptNode", back_populates="course", cascade="all, delete-orphan")
    dependencies = relationship("ConceptDependency", back_populates="course", cascade="all, delete-orphan")


class ConceptNode(Base):
    __tablename__ = "concept_nodes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    code = Column(String(30), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="Core")
    difficulty = Column(Integer, default=1)  # 1 to 5
    estimated_minutes = Column(Integer, default=45)
    importance_weight = Column(Float, default=1.0)
    bloom_level = Column(String(30), default="Understand")  # Remember, Understand, Apply, Analyze, Evaluate
    practical_example = Column(Text, nullable=True)
    summary_content = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)  # Traditional chronological index for comparison
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="concepts")
    quizzes = relationship("AssessmentQuiz", back_populates="concept", cascade="all, delete-orphan")
    masteries = relationship("StudentMastery", back_populates="concept", cascade="all, delete-orphan")


class ConceptDependency(Base):
    __tablename__ = "concept_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    source_concept_id = Column(Integer, ForeignKey("concept_nodes.id"), nullable=False)  # Prerequisite
    target_concept_id = Column(Integer, ForeignKey("concept_nodes.id"), nullable=False)  # Dependent Concept
    dependency_type = Column(String(30), default="HARD_PREREQUISITE")  # HARD_PREREQUISITE, SOFT_RECOMMENDED, CO_REQUISITE
    strength_weight = Column(Float, default=1.0)  # 0.1 to 1.0
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="dependencies")
    source_concept = relationship("ConceptNode", foreign_keys=[source_concept_id])
    target_concept = relationship("ConceptNode", foreign_keys=[target_concept_id])


class StudentMastery(Base):
    __tablename__ = "student_mastery"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concept_nodes.id"), nullable=False)
    mastery_score = Column(Float, default=0.0)  # 0.0 to 1.0
    status = Column(String(30), default="LOCKED")  # LOCKED, READY, IN_PROGRESS, MASTERED, NEEDS_REMEDIATION
    attempts_count = Column(Integer, default=0)
    confidence_rating = Column(Float, default=0.0)  # 0.0 to 1.0
    last_assessed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="masteries")
    concept = relationship("ConceptNode", back_populates="masteries")


class AssessmentQuiz(Base):
    __tablename__ = "assessment_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concept_nodes.id"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    time_limit_seconds = Column(Integer, default=300)
    pass_threshold = Column(Float, default=0.7)  # 70% to pass

    concept = relationship("ConceptNode", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("StudentQuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("assessment_quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty_level = Column(Integer, default=2)
    options_json = Column(Text, nullable=False)  # JSON array of options
    correct_option_index = Column(Integer, nullable=False)
    remediation_hint = Column(Text, nullable=True)

    quiz = relationship("AssessmentQuiz", back_populates="questions")


class StudentQuizAttempt(Base):
    __tablename__ = "student_quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("assessment_quizzes.id"), nullable=False)
    score = Column(Float, nullable=False)
    passed = Column(Boolean, default=False)
    answers_json = Column(Text, nullable=False)
    time_spent_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("AssessmentQuiz", back_populates="attempts")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concept_nodes.id"), nullable=False)
    session_type = Column(String(40), default="AI_RECOMMENDED_PATH")  # AI_RECOMMENDED_PATH, TRADITIONAL_LINEAR, DIAGNOSTIC_REMEDIATION
    duration_seconds = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="learning_sessions")
    concept = relationship("ConceptNode")


class ComparativeStudyMetric(Base):
    __tablename__ = "comparative_study_metrics"

    id = Column(Integer, primary_key=True, index=True)
    study_name = Column(String(150), nullable=False)
    cohort_size_ai = Column(Integer, default=120)
    cohort_size_trad = Column(Integer, default=120)
    avg_mastery_ai = Column(Float, default=0.884)
    avg_mastery_trad = Column(Float, default=0.642)
    avg_time_hours_ai = Column(Float, default=24.5)
    avg_time_hours_trad = Column(Float, default=42.0)
    retention_rate_ai = Column(Float, default=0.892)
    retention_rate_trad = Column(Float, default=0.615)
    gap_resolution_rate_ai = Column(Float, default=0.941)
    gap_resolution_rate_trad = Column(Float, default=0.320)
    cohen_d_effect_size = Column(Float, default=1.34)
    p_value = Column(Float, default=0.0001)
    metrics_breakdown_json = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

