# Smart AI Concept Dependency Mapper — Database Schema & Data Relationships

The application uses a **hybrid persistent architecture**:
1. **Local Relational Layer**: SQLite 3 (`backend/data/concept_mapper.db`) managed via SQLAlchemy 2.0 ORM.
2. **Cloud Synchronization Layer**: Firebase Realtime Database (`ai-concept-mapper-55d53-default-rtdb.firebaseio.com`) synchronizing users, courses, concept masteries, and assessments in real-time.

---

## 1. Entity Relationship Overview

```
 [Users] 1 ───────────< [StudentMastery] >─────────── 1 [ConceptNodes]
    │                                                        │
    │ 1                                                      │ 1
    │                                                        │
    V *                                                      V 1
 [StudentQuizAttempts] >─────── * [AssessmentQuizzes] ───────┘
                                      │
                                      │ 1
                                      V *
                                [QuizQuestions]

 [Courses] 1 ───────────< [ConceptNodes]
    │
    │ 1
    V *
 [ConceptDependencies] (Source Concept Node ──> Target Concept Node)
```

---

## 2. Table Schemas & Fields

### 1. `users` Table
Stores student and instructor authentication credentials, group assignments, and roles.
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `username` (`VARCHAR(64)`, Unique, Indexed, Not Null)
* `email` (`VARCHAR(128)`, Unique, Indexed, Not Null)
* `full_name` (`VARCHAR(128)`, Not Null)
* `hashed_password` (`VARCHAR(256)`, Not Null) — SHA-256 with salt
* `role` (`VARCHAR(32)`, Default: `'student'`) — `'student'`, `'instructor'`, `'researcher'`
* `group_assignment` (`VARCHAR(64)`, Default: `'ai_concept_mapper'`) — `'ai_concept_mapper'` (Experimental) or `'traditional_linear'` (Control)
* `is_active` (`BOOLEAN`, Default: `True`)
* `created_at` (`DATETIME`, Default: `datetime.utcnow`)

### 2. `courses` Table
Curriculum containers representing subject domains.
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `title` (`VARCHAR(256)`, Not Null) — e.g. "Quantum Computing Mastery & Systems"
* `code` (`VARCHAR(32)`, Unique, Indexed, Not Null) — e.g. "QC-500"
* `description` (`TEXT`)
* `category` (`VARCHAR(64)`, Default: `'Computer Science'`)
* `difficulty_level` (`VARCHAR(32)`, Default: `'Intermediate'`)
* `estimated_hours` (`FLOAT`, Default: `40.0`)
* `created_at` (`DATETIME`, Default: `datetime.utcnow`)

### 3. `concept_nodes` Table
Vertices in the knowledge Directed Acyclic Graph (DAG).
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `course_id` (`INTEGER`, Foreign Key `courses.id`, Indexed, Not Null)
* `title` (`VARCHAR(256)`, Not Null) — e.g. "Superposition & Entanglement"
* `code` (`VARCHAR(32)`, Indexed, Not Null) — e.g. "QC-102"
* `category` (`VARCHAR(64)`)
* `bloom_level` (`VARCHAR(32)`, Default: `'Understand'`) — `'Remember'`, `'Understand'`, `'Apply'`, `'Analyze'`, `'Evaluate'`
* `difficulty` (`INTEGER`, Default: `2`) — 1 (Elementary) to 5 (Advanced Research)
* `estimated_minutes` (`INTEGER`, Default: `30`)
* `x_pos` (`FLOAT`, Default: `200.0`) — Canvas X coordinate
* `y_pos` (`FLOAT`, Default: `200.0`) — Canvas Y coordinate
* `mental_model` (`TEXT`) — Core intuitive analogy from Google Knowledge Engine
* `industry_application` (`TEXT`) — Real-world application
* `common_pitfalls` (`TEXT`) — Frequent student misconceptions

### 4. `concept_dependencies` Table
Directed edges in the DAG indicating prerequisite requirements.
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `course_id` (`INTEGER`, Foreign Key `courses.id`, Indexed, Not Null)
* `source_concept_id` (`INTEGER`, Foreign Key `concept_nodes.id`, Not Null) — Prerequisite concept
* `target_concept_id` (`INTEGER`, Foreign Key `concept_nodes.id`, Not Null) — Downstream concept
* `dependency_type` (`VARCHAR(32)`, Default: `'HARD_PREREQUISITE'`) — `'HARD_PREREQUISITE'`, `'SOFT_PREREQUISITE'`, `'CO_REQUISITE'`
* `pedagogical_rationale` (`TEXT`) — Detailed cognitive reason explaining why the source concept is necessary before the target

### 5. `student_mastery` Table
State machine tracking each student's progress on each concept.
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `user_id` (`INTEGER`, Foreign Key `users.id`, Indexed, Not Null)
* `concept_id` (`INTEGER`, Foreign Key `concept_nodes.id`, Indexed, Not Null)
* `status` (`VARCHAR(32)`, Default: `'LOCKED'`) — Dynamic states:
  * `LOCKED`: Upstream prerequisites not yet satisfied.
  * `READY`: All direct prerequisites mastered; student may take assessment.
  * `IN_PROGRESS`: Student has initiated study or failed initial attempt.
  * `MASTERED`: Passed diagnostic assessment ($\ge 70\%$).
  * `NEEDS_REMEDIATION`: Specific prerequisite gap diagnosed.
* `mastery_score` (`FLOAT`, Default: `0.0`) — Range: 0.0 to 1.0
* `last_attempt_at` (`DATETIME`)
* `updated_at` (`DATETIME`, Default: `datetime.utcnow`)

### 6. `assessment_quizzes` Table
Diagnostic assessment containers linked to concept nodes.
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `concept_id` (`INTEGER`, Foreign Key `concept_nodes.id`, Unique, Not Null)
* `title` (`VARCHAR(256)`, Not Null)
* `description` (`TEXT`)
* `passing_score` (`FLOAT`, Default: `0.70`) — 70% accuracy required for mastery

### 7. `quiz_questions` Table
Individual diagnostic assessment items.
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `quiz_id` (`INTEGER`, Foreign Key `assessment_quizzes.id`, Indexed, Not Null)
* `question_text` (`TEXT`, Not Null)
* `bloom_taxonomy_level` (`VARCHAR(32)`, Default: `'Understand'`)
* `correct_option_index` (`INTEGER`, Not Null) — 0 to 3
* `options_json` (`TEXT`, Not Null) — JSON array of 4 multiple-choice options
* `explanation` (`TEXT`) — Detailed solution and pedagogical remediation

### 8. `student_quiz_attempts` Table
Log of all submitted micro-quizzes for empirical research and analytics.
* `id` (`INTEGER`, Primary Key, Autoincrement)
* `user_id` (`INTEGER`, Foreign Key `users.id`, Indexed, Not Null)
* `quiz_id` (`INTEGER`, Foreign Key `assessment_quizzes.id`, Indexed, Not Null)
* `score` (`FLOAT`, Not Null) — Score ratio (e.g. 1.0 for 100%)
* `passed` (`BOOLEAN`, Not Null)
* `time_spent_seconds` (`INTEGER`, Default: `0`)
* `submitted_at` (`DATETIME`, Default: `datetime.utcnow`)
* `ai_remediation_feedback` (`TEXT`) — Tailored AI guidance

---

## 3. Firebase Realtime Database Structure

Firebase Realtime Database mirrors the relational models using hierarchical JSON keys:

```json
{
  "users": {
    "<user_id>": {
      "id": 4,
      "username": "alex_student",
      "email": "alex@university.edu",
      "full_name": "Alex Rivera",
      "role": "student",
      "group_assignment": "ai_concept_mapper",
      "created_at": "2026-10-26T04:15:47"
    }
  },
  "courses": {
    "<course_id>": {
      "id": 1,
      "title": "Quantum Computing Mastery & Systems",
      "code": "QC-500",
      "total_concepts": 5
    }
  },
  "student_mastery": {
    "<user_id>_<concept_id>": {
      "user_id": 4,
      "concept_id": 1,
      "status": "MASTERED",
      "mastery_score": 1.0,
      "updated_at": "2026-10-26T04:18:00"
    }
  },
  "quiz_attempts": {
    "<attempt_id>": {
      "user_id": 4,
      "quiz_id": 1,
      "score": 1.0,
      "passed": true,
      "time_spent_seconds": 45,
      "submitted_at": "2026-10-26T04:18:00"
    }
  },
  "ai_tutor_chats": {
    "<timestamp>": {
      "user_id": 4,
      "concept_id": 1,
      "query": "Why is calculus required before quantum states?",
      "response": "Quantum state amplitudes...",
      "timestamp": "2026-10-26T04:18:05"
    }
  }
}
```
