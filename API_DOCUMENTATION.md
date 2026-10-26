# Smart AI Concept Dependency Mapper — REST API Documentation

**Base URL (Local/Development)**: `http://127.0.0.1:8000/api`  
**Base URL (Android Emulator)**: `http://10.0.2.2:8000/api`  
**Base URL (Physical Phone over Wi-Fi)**: `http://<YOUR_COMPUTER_LAN_IP>:8000/api`  
**Interactive Swagger UI**: `http://127.0.0.1:8000/docs`  
**OpenAPI Specification**: `http://127.0.0.1:8000/openapi.json`  

---

## 1. System Health & Connectivity

### `GET /`
Returns the operational status of the backend API, the project title, and the live status of the Firebase Realtime Database connection.

* **Response (200 OK)**:
  ```json
  {
    "project": "Improving Student Learning Outcomes Using Smart AI-Based Concept Dependency Mapper Compared to Traditional Learning Systems",
    "status": "Operational",
    "firebase_integration": {
      "connected": true,
      "firebase_url": "https://ai-concept-mapper-55d53-default-rtdb.firebaseio.com",
      "timestamp": "2026-10-26T04:17:45.884398"
    },
    "api_docs": "/docs",
    "endpoints": { ... }
  }
  ```

---

## 2. Authentication & Student Sessions

### `POST /api/auth/register`
Creates a brand new student or instructor user record, writes to SQLite, and synchronizes to Firebase Realtime Database.

* **Request Body**:
  ```json
  {
    "username": "alex_student",
    "email": "alex@university.edu",
    "full_name": "Alex Rivera",
    "password": "password123",
    "role": "student",
    "group_assignment": "ai_concept_mapper"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "token": "token_4:alex_student:179298...",
    "user": {
      "id": 4,
      "username": "alex_student",
      "email": "alex@university.edu",
      "full_name": "Alex Rivera",
      "role": "student",
      "group_assignment": "ai_concept_mapper",
      "created_at": "2026-10-26T04:15:47.309943"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates a user via username and password.

* **Request Body**:
  ```json
  {
    "username": "alex_student",
    "password": "password123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "token": "token_4:alex_student:...",
    "user": { ... }
  }
  ```

### `GET /api/auth/me`
Retrieves aggregated student learning performance for the active course.

* **Query Parameters**:
  * `user_id` (integer, required): ID of the student.
  * `course_id` (integer, optional, default: 1): Active course ID.
* **Response (200 OK)**:
  ```json
  {
    "user_id": 4,
    "course_id": 1,
    "total_mastered": 2,
    "total_ready": 1,
    "total_locked": 2,
    "total_concepts": 5,
    "overall_mastery_percentage": 40.0,
    "total_attempts": 2,
    "average_score": 0.95
  }
  ```

### `POST /api/auth/reset-progress`
Clears all concept quiz attempts and mastery scores in both SQLite and Firebase for a given course, restoring the student's status to 0%.

* **Request Body**:
  ```json
  {
    "user_id": 4,
    "course_id": 1
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Progress for user 'Alex Rivera' on course 1 has been reset."
  }
  ```

---

## 3. Courses & AI Curriculum Generation

### `GET /api/courses`
Lists all available courses in the database with their metadata and total concept counts.

* **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "title": "Quantum Computing Mastery & Systems",
      "code": "QC-500",
      "description": "Comprehensive curriculum covering quantum states, superposition, and gates.",
      "category": "Quantum Physics",
      "difficulty_level": "Comprehensive",
      "estimated_hours": 35.0,
      "total_concepts": 5
    }
  ]
  ```

### `POST /api/courses/generate-with-ai`
Synthesizes a complete curriculum Directed Acyclic Graph (DAG) for any subject entered by the user, complete with concept nodes, prerequisite vectors, Bloom taxonomy levels, and 20-question micro-quizzes.

* **Request Body**:
  ```json
  {
    "topic": "Applied Machine Learning & Neural Networks",
    "category": "Computer Science",
    "user_id": 4
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": 18,
    "title": "Applied Machine Learning & Neural Networks",
    "code": "ML-501",
    "total_concepts": 8,
    "category": "Computer Science"
  }
  ```

---

## 4. Concept Graph & Deep Briefing

### `GET /api/concepts/graph/{course_id}`
Returns all concept nodes and directional prerequisite edges in the course, populated with the requesting user's dynamic status (`LOCKED`, `READY`, `MASTERED`).

* **Query Parameters**:
  * `user_id` (integer, optional, default: 1)
* **Response (200 OK)**:
  ```json
  {
    "course_id": 1,
    "is_dag": true,
    "overall_mastery_percentage": 40.0,
    "mastered_count": 2,
    "total_concepts": 5,
    "nodes": [
      {
        "id": 1,
        "code": "QC-101",
        "title": "Foundational Principles of Quantum Computing",
        "category": "Quantum Foundations",
        "bloom_level": "Understand",
        "difficulty": 2,
        "estimated_minutes": 35,
        "status": "MASTERED",
        "mastery_score": 1.0,
        "x_pos": 150,
        "y_pos": 200
      }
    ],
    "edges": [
      {
        "id": 1,
        "source": 1,
        "target": 2,
        "dependency_type": "HARD_PREREQUISITE",
        "pedagogical_rationale": "Superposition requires vector spaces."
      }
    ]
  }
  ```

### `GET /api/concepts/{concept_id}/deep-briefing`
Returns a 360° deep briefing from the Google Knowledge Engine containing mental models, mathematical invariants, common pitfalls, and industry applications.

* **Response (200 OK)**:
  ```json
  {
    "concept_id": 1,
    "title": "Foundational Principles of Quantum Computing",
    "code": "QC-101",
    "mental_model": "Think of a quantum state as a vector on the Bloch Sphere.",
    "core_rules_theorems": [ ... ],
    "common_pitfalls": [ ... ],
    "industry_applications": [ ... ]
  }
  ```

---

## 5. Adaptive Learning Pathway (Topological DAG Solver)

### `GET /api/learning-paths/generate`
Uses NetworkX graph algorithms to compute the minimal, topological prerequisite sequence required for a student to master a specified target concept without redundant lessons.

* **Query Parameters**:
  * `target_concept_id` (integer, required)
  * `user_id` (integer, required)
* **Response (200 OK)**:
  ```json
  {
    "target_concept_id": 5,
    "target_concept_title": "Quantum Error Correction",
    "path_nodes": [
      {
        "concept_id": 2,
        "code": "QC-102",
        "title": "Superposition & Entanglement",
        "status": "READY",
        "is_bottleneck": true
      }
    ],
    "estimated_total_time_minutes": 45,
    "ai_strategy_summary": "AI Adaptive Path: 1 targeted step(s) required."
  }
  ```

---

## 6. Diagnostic Assessments (20-Question Micro-Quizzes)

### `GET /api/quiz/concept/{concept_id}`
Retrieves the diagnostic micro-quiz for a concept, with 20 questions, answer options, and Bloom levels.

* **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "concept_id": 1,
    "title": "Diagnostic Assessment: QC-101",
    "passing_score": 0.70,
    "questions": [
      {
        "id": 101,
        "question_text": "What does a qubit represent on the Bloch Sphere?",
        "bloom_taxonomy_level": "Understand",
        "options": [
          { "id": 0, "text": "A superposition state vector" },
          { "id": 1, "text": "A classical binary bit" },
          { "id": 2, "text": "A deterministic voltage spike" },
          { "id": 3, "text": "A memory register address" }
        ]
      }
    ]
  }
  ```

### `POST /api/quiz/submit`
Evaluates student answers, calculates accuracy score, determines pass/fail status (passing score $\ge$ 70%), updates concept mastery in SQLite and Firebase RTDB, and provides personalized AI remediation advice.

* **Request Body**:
  ```json
  {
    "user_id": 4,
    "quiz_id": 1,
    "time_spent_seconds": 45,
    "answers": [
      { "question_id": 101, "selected_option_index": 0 }
    ]
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "score": 1.0,
    "passed": true,
    "new_status": "MASTERED",
    "correct_count": 20,
    "total_questions": 20,
    "ai_remediation_feedback": "Exemplary performance! You demonstrated mastery of all prerequisite concepts."
  }
  ```

---

## 7. Comparative Research Analytics

### `GET /api/analytics/comparative-study`
Returns empirical comparison data comparing student cohorts using the AI Concept Mapper versus traditional linear learning.

* **Response (200 OK)**:
  ```json
  {
    "cohen_d_effect_size": 1.34,
    "p_value": 0.0001,
    "traditional_cohort": {
      "average_post_test_score": 64.2,
      "time_to_mastery_hours": 42.0,
      "retention_30_days_percentage": 61.5,
      "prerequisite_gap_resolution_rate": 32.0,
      "cognitive_overload_nasa_tlx": 72.8
    },
    "ai_concept_mapper_cohort": {
      "average_post_test_score": 88.4,
      "time_to_mastery_hours": 24.5,
      "retention_30_days_percentage": 89.2,
      "prerequisite_gap_resolution_rate": 94.1,
      "cognitive_overload_nasa_tlx": 38.6
    }
  }
  ```

---

## 8. AI Concept Tutor Assistant

### `POST /api/ai-tutor/query`
Sends a student question to the AI tutor with concept context and returns pedagogical explanations and recommended remediation actions.

* **Request Body**:
  ```json
  {
    "user_id": 4,
    "concept_id": 1,
    "query": "Why is calculus required before studying quantum states?"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "response": "Here is your AI guidance for 'Foundational Principles of Quantum Computing': Quantum state amplitudes are complex-valued wavefunctions whose time-evolution obeys the Schrödinger differential equation. Without understanding derivatives and inner products, state transformation equations become mere rote memorization.",
    "related_prerequisites": ["Calculus", "Linear Algebra"],
    "recommended_action": "Review prerequisite graph"
  }
  ```
