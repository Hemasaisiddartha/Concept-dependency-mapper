from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: Optional[str] = "student"
    group_assignment: Optional[str] = "ai_concept_mapper"

class UserCreate(UserBase):
    password: Optional[str] = "password123"

class UserRegisterRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: Optional[str] = "student"
    group_assignment: Optional[str] = "ai_concept_mapper"

class UserLoginRequest(BaseModel):
    username: str
    password: str

class SendOTPRequest(BaseModel):
    email: str
    full_name: Optional[str] = None

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    email: str
    is_new_user: bool = False
    preview_otp: Optional[str] = None

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    full_name: Optional[str] = None
    role: Optional[str] = "student"


class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class UserLoginResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

class UserStatsResponse(BaseModel):
    user: UserResponse
    total_mastered: int
    total_ready: int
    total_locked: int
    total_in_progress: int
    overall_mastery_percentage: float
    total_quiz_attempts: int
    passed_quizzes_count: int

class ResetProgressRequest(BaseModel):
    user_id: int
    course_id: Optional[int] = 1

# --- Course Schemas ---
class CourseBase(BaseModel):
    title: str
    code: str
    description: str
    category: str
    difficulty_level: Optional[str] = "Intermediate"
    estimated_hours: Optional[float] = 40.0

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    total_concepts: Optional[int] = 0
    total_dependencies: Optional[int] = 0
    class Config:
        from_attributes = True

class TopicGenerateRequest(BaseModel):
    topic: str
    user_id: Optional[int] = 1

class CourseHistoryItem(BaseModel):
    id: int
    title: str
    code: str
    description: str
    category: str
    difficulty_level: str
    estimated_hours: float
    total_concepts: int
    total_dependencies: int
    mastered_concepts: Optional[int] = 0
    created_at: datetime
    class Config:
        from_attributes = True

# --- Concept Node Schemas ---
class ConceptNodeBase(BaseModel):
    code: str
    title: str
    description: str
    category: Optional[str] = "Core"
    difficulty: Optional[int] = 1
    estimated_minutes: Optional[int] = 45
    importance_weight: Optional[float] = 1.0
    bloom_level: Optional[str] = "Understand"
    practical_example: Optional[str] = None
    summary_content: Optional[str] = None
    order_index: Optional[int] = 0

class ConceptNodeCreate(ConceptNodeBase):
    course_id: int

class ConceptNodeResponse(ConceptNodeBase):
    id: int
    course_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Concept Dependency Schemas ---
class ConceptDependencyBase(BaseModel):
    source_concept_id: int
    target_concept_id: int
    dependency_type: Optional[str] = "HARD_PREREQUISITE"
    strength_weight: Optional[float] = 1.0
    explanation: Optional[str] = None

class ConceptDependencyCreate(ConceptDependencyBase):
    course_id: int

class ConceptDependencyResponse(ConceptDependencyBase):
    id: int
    course_id: int
    source_title: Optional[str] = None
    target_title: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Graph Visualization Schemas ---
class GraphNodeData(BaseModel):
    id: int
    code: str
    title: str
    category: str
    difficulty: int
    estimated_minutes: int
    bloom_level: str
    status: str  # LOCKED, READY, IN_PROGRESS, MASTERED, NEEDS_REMEDIATION
    mastery_score: float
    order_index: int
    in_degree: int
    out_degree: int
    prerequisites_met: bool
    missing_prerequisites: List[str] = []

class GraphEdgeData(BaseModel):
    id: int
    source: int
    target: int
    dependency_type: str
    strength_weight: float
    explanation: Optional[str] = None

class ConceptGraphResponse(BaseModel):
    course_id: int
    course_title: str
    nodes: List[GraphNodeData]
    edges: List[GraphEdgeData]
    topological_order: List[int]
    total_concepts: int
    mastered_count: int
    ready_count: int
    locked_count: int
    in_progress_count: int
    overall_mastery_percentage: float

# --- Mastery & Progress Schemas ---
class MasteryUpdateRequest(BaseModel):
    user_id: int
    concept_id: int
    mastery_score: float
    confidence_rating: Optional[float] = 0.8

class StudentMasteryResponse(BaseModel):
    concept_id: int
    concept_title: str
    mastery_score: float
    status: str
    attempts_count: int
    confidence_rating: float
    last_assessed_at: Optional[datetime] = None

# --- Quiz Schemas ---
class QuizOption(BaseModel):
    id: int
    text: str

class QuizQuestionCreate(BaseModel):
    question_text: str
    options: List[str]
    correct_option_index: int
    difficulty_level: Optional[int] = 2
    explanation: Optional[str] = None
    remediation_hint: Optional[str] = None

class AssessmentQuizCreate(BaseModel):
    concept_id: int
    title: str
    description: Optional[str] = None
    time_limit_seconds: Optional[int] = 300
    pass_threshold: Optional[float] = 0.7
    questions: Optional[List[QuizQuestionCreate]] = []

class QuizQuestionData(BaseModel):
    id: int
    question_text: str
    difficulty_level: int
    options: List[QuizOption]
    remediation_hint: Optional[str] = None

class AssessmentQuizData(BaseModel):
    id: int
    concept_id: int
    concept_title: str
    title: str
    description: Optional[str] = None
    time_limit_seconds: int
    pass_threshold: float
    questions: List[QuizQuestionData]

class QuizSubmitAnswer(BaseModel):
    question_id: int
    selected_option_index: int

class QuizSubmitRequest(BaseModel):
    user_id: int
    quiz_id: int
    time_spent_seconds: int
    answers: List[QuizSubmitAnswer]

class QuestionResult(BaseModel):
    question_id: int
    question_text: str
    selected_option_index: int
    correct_option_index: int
    is_correct: bool
    explanation: str
    remediation_hint: Optional[str] = None

class QuizSubmitResult(BaseModel):
    quiz_id: int
    concept_id: int
    concept_title: str
    score: float
    passed: bool
    correct_answers_count: int
    total_questions: int
    new_mastery_score: float
    new_status: str
    time_spent_seconds: int
    question_results: List[QuestionResult]
    ai_remediation_feedback: Optional[str] = None
    unlocked_concepts: List[str] = []

# --- Learning Pathway Schemas ---
class PathwayNode(BaseModel):
    concept_id: int
    title: str
    code: str
    difficulty: int
    estimated_minutes: int
    status: str
    mastery_score: float
    is_bottleneck: bool
    recommended_action: str

class LearningPathResponse(BaseModel):
    target_concept_id: int
    target_concept_title: str
    user_id: int
    estimated_total_time_minutes: int
    path_nodes: List[PathwayNode]
    identified_gaps: List[str]
    ai_strategy_summary: str

# --- Comparative Analytics Schemas ---
class MetricComparison(BaseModel):
    metric_name: str
    traditional_score: float
    ai_concept_mapper_score: float
    improvement_percentage: float
    unit: str
    description: str

class ComparativeAnalyticsResponse(BaseModel):
    study_title: str
    cohort_size_ai: int
    cohort_size_traditional: int
    metrics: List[MetricComparison]
    retention_curve_traditional: List[Dict[str, Any]]
    retention_curve_ai: List[Dict[str, Any]]
    learning_time_distribution: List[Dict[str, Any]]
    pre_post_test_comparison: List[Dict[str, Any]]
    cohen_d_effect_size: float
    p_value: float
    statistical_significance_verdict: str
    key_findings: List[str]

# --- AI Tutor & Remediation Schemas ---
class AITutorQueryRequest(BaseModel):
    user_id: int
    concept_id: Optional[int] = None
    query: str
    context_type: Optional[str] = "concept_explanation"  # concept_explanation, prerequisite_why, gap_remediation

class AITutorQueryResponse(BaseModel):
    response: str
    related_prerequisites: List[str] = []
    recommended_action: str
    suggested_quizzes: List[int] = []
