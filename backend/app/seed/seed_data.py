import json
from sqlalchemy.orm import Session
from app.models.models import (
    User, Course, ConceptNode, ConceptDependency,
    StudentMastery, AssessmentQuiz, QuizQuestion, ComparativeStudyMetric
)

from app.core.security import get_password_hash

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Course).first():
        # Ensure existing seeded users have hashed passwords if null
        for u in db.query(User).all():
            if not u.hashed_password:
                u.hashed_password = get_password_hash("password123")
        db.commit()
        return

    print("Seeding database with rich courses, concept graphs, quizzes, and research data...")

    default_pwd_hash = get_password_hash("password123")

    # 1. Create Users
    user1 = User(
        username="alex_student",
        email="alex@university.edu",
        hashed_password=default_pwd_hash,
        full_name="Alex Rivera",
        role="student",
        group_assignment="ai_concept_mapper"
    )
    user2 = User(
        username="maria_student",
        email="maria@university.edu",
        hashed_password=default_pwd_hash,
        full_name="Maria Chen",
        role="student",
        group_assignment="traditional_system"
    )
    prof = User(
        username="prof_anderson",
        email="anderson@university.edu",
        hashed_password=default_pwd_hash,
        full_name="Prof. David Anderson",
        role="instructor",
        group_assignment="ai_concept_mapper"
    )
    db.add_all([user1, user2, prof])
    db.flush()

    # 2. Course 1: Deep Learning & Neural Architectures
    course_dl = Course(
        title="Deep Learning & Neural Architectures",
        code="CS-601",
        description="Comprehensive mastery of modern deep neural networks from foundational calculus to transformer architectures, driven by concept dependency mapping.",
        category="Artificial Intelligence",
        difficulty_level="Advanced",
        estimated_hours=45.0
    )
    db.add(course_dl)
    db.flush()

    dl_concepts_data = [
        {
            "code": "DL-01",
            "title": "Scalar & Matrix Calculus",
            "description": "Partial derivatives, Jacobian matrices, gradient vectors, and Taylor approximations used in optimization.",
            "category": "Foundations",
            "difficulty": 1,
            "estimated_minutes": 35,
            "importance_weight": 1.0,
            "bloom_level": "Understand",
            "practical_example": "Computing the gradient vector for multivariate loss function f(x, y) = x^2 + 3y^2.",
            "summary_content": "Calculus allows us to determine the direction of steepest ascent or descent in multi-dimensional loss landscapes.",
            "order_index": 1
        },
        {
            "code": "DL-02",
            "title": "Linear Algebra & Vector Spaces",
            "description": "Vector dot products, matrix multiplications, transpose operations, and linear transformations.",
            "category": "Foundations",
            "difficulty": 1,
            "estimated_minutes": 30,
            "importance_weight": 1.0,
            "bloom_level": "Understand",
            "practical_example": "Affine transformations: Y = X * W + b across batch dimensions.",
            "summary_content": "Neural networks are fundamentally stacks of parameterized linear transformations interleaved with non-linearities.",
            "order_index": 2
        },
        {
            "code": "DL-03",
            "title": "Probability & Maximum Likelihood",
            "description": "Conditional probability, cross-entropy, softmax distributions, and negative log-likelihood.",
            "category": "Foundations",
            "difficulty": 2,
            "estimated_minutes": 40,
            "importance_weight": 0.9,
            "bloom_level": "Apply",
            "practical_example": "Converting logits [2.0, 1.0, 0.1] into class probabilities via Softmax.",
            "summary_content": "Classification networks output probability distributions optimized via cross-entropy loss.",
            "order_index": 3
        },
        {
            "code": "DL-04",
            "title": "Loss Functions & Empirical Risk",
            "description": "MSE, Binary Cross-Entropy, Categorical Cross-Entropy, and regularization penalties.",
            "category": "Core",
            "difficulty": 2,
            "estimated_minutes": 35,
            "importance_weight": 1.0,
            "bloom_level": "Apply",
            "practical_example": "Penalizing false predictions in binary classification using BCE loss.",
            "summary_content": "Loss functions quantify the error discrepancy between prediction and ground truth.",
            "order_index": 4
        },
        {
            "code": "DL-05",
            "title": "Gradient Descent Optimization",
            "description": "Batch, mini-batch SGD, momentum, RMSProp, and Adam adaptive learning rate algorithms.",
            "category": "Core",
            "difficulty": 2,
            "estimated_minutes": 45,
            "importance_weight": 1.1,
            "bloom_level": "Apply",
            "practical_example": "Iterative parameter update: W = W - alpha * dW with Adam momentum smoothing.",
            "summary_content": "Optimization navigates parameter space towards minimal empirical loss.",
            "order_index": 5
        },
        {
            "code": "DL-06",
            "title": "Multilayer Perceptrons & Activations",
            "description": "Dense layers, non-linear activation functions (ReLU, GELU, Sigmoid), and universal approximation.",
            "category": "Core",
            "difficulty": 2,
            "estimated_minutes": 40,
            "importance_weight": 1.0,
            "bloom_level": "Apply",
            "practical_example": "Layer computation: h = ReLU(W1 * x + b1); out = W2 * h + b2.",
            "summary_content": "Non-linear activations allow MLPs to learn non-linear decision boundaries.",
            "order_index": 6
        },
        {
            "code": "DL-07",
            "title": "Differential Calculus & Chain Rule",
            "description": "Composite function differentiation, computational graph decomposition, and reverse-mode accumulation.",
            "category": "Core",
            "difficulty": 3,
            "estimated_minutes": 50,
            "importance_weight": 1.2,
            "bloom_level": "Analyze",
            "practical_example": "dz/dx = (dz/du) * (du/dx) for composite function z = f(u(x)).",
            "summary_content": "The multivariate chain rule is the mathematical cornerstone of backpropagation.",
            "order_index": 7
        },
        {
            "code": "DL-08",
            "title": "Backpropagation Algorithm",
            "description": "Forward pass caching, error gradient backward propagation, and automated differentiation.",
            "category": "Core",
            "difficulty": 4,
            "estimated_minutes": 60,
            "importance_weight": 1.5,
            "bloom_level": "Analyze",
            "practical_example": "Recursive calculation of dL/dW_l using upstream gradient dL/da_l and local Jacobian.",
            "summary_content": "Backprop efficiently calculates gradients for millions of parameters in O(N) time.",
            "order_index": 8
        },
        {
            "code": "DL-09",
            "title": "Regularization & Batch Normalization",
            "description": "Dropout, weight decay (L2), Batch Norm, Layer Norm, and internal covariate shift reduction.",
            "category": "Intermediate",
            "difficulty": 3,
            "estimated_minutes": 45,
            "importance_weight": 1.0,
            "bloom_level": "Apply",
            "practical_example": "Normalizing layer inputs: x_hat = (x - mu) / sqrt(var + eps); y = gamma * x_hat + beta.",
            "summary_content": "Normalization stabilizes training dynamics and accelerates convergence.",
            "order_index": 9
        },
        {
            "code": "DL-10",
            "title": "Convolutional Operations & CNNs",
            "description": "2D convolutions, spatial pooling, receptive fields, stride, padding, and feature map hierarchies.",
            "category": "Vision",
            "difficulty": 3,
            "estimated_minutes": 55,
            "importance_weight": 1.1,
            "bloom_level": "Apply",
            "practical_example": "Kernel filter scanning 3x3 RGB patches to detect edges and textures.",
            "summary_content": "Convolutions exploit spatial translation invariance for image processing.",
            "order_index": 10
        },
        {
            "code": "DL-11",
            "title": "Recurrent Networks & LSTMs",
            "description": "Hidden state recurrence, vanishing gradients, gating mechanisms (Forget, Input, Output gates).",
            "category": "Sequence",
            "difficulty": 4,
            "estimated_minutes": 60,
            "importance_weight": 1.1,
            "bloom_level": "Analyze",
            "practical_example": "Passing cell state C_t and hidden state h_t across sequential timesteps.",
            "summary_content": "Gated architectures preserve long-term sequential dependencies in temporal data.",
            "order_index": 11
        },
        {
            "code": "DL-12",
            "title": "Matrix Dot-Product & Self-Attention",
            "description": "Query, Key, Value projections, scaled dot-product attention, and compatibility scores.",
            "category": "Attention",
            "difficulty": 4,
            "estimated_minutes": 55,
            "importance_weight": 1.4,
            "bloom_level": "Evaluate",
            "practical_example": "Attention(Q, K, V) = Softmax(Q * K^T / sqrt(d_k)) * V.",
            "summary_content": "Self-attention allows every token to directly interact with every other token in O(1) sequential steps.",
            "order_index": 12
        },
        {
            "code": "DL-13",
            "title": "Transformer Architecture & Encodings",
            "description": "Multi-head attention, sinusoidal positional embeddings, residual connections, and encoder-decoder stacks.",
            "category": "Advanced",
            "difficulty": 5,
            "estimated_minutes": 70,
            "importance_weight": 1.5,
            "bloom_level": "Evaluate",
            "practical_example": "Full 12-layer Transformer block with MultiHead(Q,K,V) + LayerNorm + MLP.",
            "summary_content": "The Transformer is the universal backbone for modern generative and predictive foundation models.",
            "order_index": 13
        },
        {
            "code": "DL-14",
            "title": "LLM Fine-Tuning & Parameter Efficiency",
            "description": "LoRA (Low-Rank Adaptation), prefix tuning, instruction tuning, and RLHF alignment principles.",
            "category": "Advanced",
            "difficulty": 5,
            "estimated_minutes": 65,
            "importance_weight": 1.3,
            "bloom_level": "Create",
            "practical_example": "Freezing base weights W0 and training low-rank matrices A and B (delta W = B * A).",
            "summary_content": "PEFT techniques enable adapting 70B+ parameter models on commodity GPUs.",
            "order_index": 14
        }
    ]

    dl_nodes_map = {}
    for data in dl_concepts_data:
        node = ConceptNode(course_id=course_dl.id, **data)
        db.add(node)
        db.flush()
        dl_nodes_map[node.code] = node

    # Dependencies for Deep Learning Course (DAG edges)
    dl_dependencies = [
        ("DL-01", "DL-07", "HARD_PREREQUISITE", 1.0, "Scalar calculus partial derivatives are required to formulate composite chain rule derivatives."),
        ("DL-02", "DL-05", "HARD_PREREQUISITE", 0.9, "Vector operations and gradients are needed to implement multidimensional parameter updates."),
        ("DL-02", "DL-12", "HARD_PREREQUISITE", 1.0, "Matrix multiplication and vector projections form the exact computation of Q, K, V dot-products."),
        ("DL-03", "DL-04", "HARD_PREREQUISITE", 0.9, "Probability distributions and cross-entropy define classification loss functions."),
        ("DL-04", "DL-05", "HARD_PREREQUISITE", 1.0, "An optimization objective (loss function) is strictly required before running gradient descent."),
        ("DL-05", "DL-06", "HARD_PREREQUISITE", 0.8, "Understanding parameter learning is required to optimize Multilayer Perceptron layers."),
        ("DL-07", "DL-08", "HARD_PREREQUISITE", 1.0, "Chain rule is the mathematical core of the Backpropagation algorithm."),
        ("DL-06", "DL-08", "HARD_PREREQUISITE", 1.0, "Perceptron layer architectures define the forward computational graph for backprop."),
        ("DL-08", "DL-09", "HARD_PREREQUISITE", 0.9, "Gradient propagation dynamics explain why normalization and regularization prevent exploding/vanishing gradients."),
        ("DL-08", "DL-10", "HARD_PREREQUISITE", 0.9, "CNN filter weights are trained via backpropagated spatial gradients."),
        ("DL-08", "DL-11", "HARD_PREREQUISITE", 0.9, "Backpropagation Through Time (BPTT) requires a solid grasp of basic backpropagation."),
        ("DL-09", "DL-13", "HARD_PREREQUISITE", 0.9, "Layer normalization and residual connections are critical structural components of Transformers."),
        ("DL-12", "DL-13", "HARD_PREREQUISITE", 1.0, "Multi-head Self-Attention is the central layer mechanism of Transformer encoders and decoders."),
        ("DL-13", "DL-14", "HARD_PREREQUISITE", 1.0, "Transformer architecture must be mastered before applying Low-Rank Adaptation (LoRA) to its attention weights.")
    ]

    for src_code, tgt_code, dep_type, weight, expl in dl_dependencies:
        dep = ConceptDependency(
            course_id=course_dl.id,
            source_concept_id=dl_nodes_map[src_code].id,
            target_concept_id=dl_nodes_map[tgt_code].id,
            dependency_type=dep_type,
            strength_weight=weight,
            explanation=expl
        )
        db.add(dep)

    # 3. Add Quizzes & Questions for Concepts
    quizzes_data = {
        "DL-01": {
            "title": "Scalar & Matrix Calculus Diagnostic",
            "desc": "Assess your understanding of multivariate gradients and partial derivatives.",
            "questions": [
                {
                    "q": "What does the gradient vector ∇f(x, y) geometrically represent for a differentiable loss surface f?",
                    "options": ["The direction of steepest decrease", "The direction of steepest increase in function value", "The tangent plane curvature", "The global minimum coordinates"],
                    "correct": 1,
                    "expl": "The gradient vector always points in the direction of greatest instantaneous increase of the function.",
                    "hint": "Recall that gradient descent negates the gradient (-∇f) to go downhill."
                },
                {
                    "q": "For f(x, y) = 3x^2 + 5y^3, what is the partial derivative ∂f/∂x?",
                    "options": ["6x", "15y^2", "6x + 15y^2", "3x"],
                    "correct": 0,
                    "expl": "Treat y as a constant: d/dx [3x^2] = 6x and d/dx [5y^3] = 0.",
                    "hint": "When differentiating with respect to x, treat other independent variables as constants."
                }
            ]
        },
        "DL-02": {
            "title": "Linear Algebra Diagnostic",
            "desc": "Check your mastery of matrix operations and vector transformations.",
            "questions": [
                {
                    "q": "If matrix A has dimension (B, D_in) and weight matrix W has dimension (D_in, D_out), what is the shape of A * W?",
                    "options": ["(B, D_in)", "(D_in, D_out)", "(B, D_out)", "(D_out, B)"],
                    "correct": 2,
                    "expl": "Matrix multiplication (B, D_in) x (D_in, D_out) produces an output matrix of size (B, D_out).",
                    "hint": "Inner dimensions must match, and the resulting dimensions are the outer row and column counts."
                },
                {
                    "q": "What is the result of the dot product between two orthogonal unit vectors?",
                    "options": ["1", "-1", "0", "Infinity"],
                    "correct": 2,
                    "expl": "Orthogonal vectors are perpendicular (angle = 90°), so cos(90°) = 0, giving a dot product of 0.",
                    "hint": "Dot product measures directional similarity: u · v = |u||v|cos(theta)."
                }
            ]
        },
        "DL-07": {
            "title": "Chain Rule & Computational Graphs Quiz",
            "desc": "Evaluate your ability to decompose composite functions and calculate gradients.",
            "questions": [
                {
                    "q": "In a computational graph where y = f(u) and u = g(x), what is dy/dx according to the chain rule?",
                    "options": ["(dy/du) + (du/dx)", "(dy/du) * (du/dx)", "dy/dx * du/dy", "f'(x) * g'(u)"],
                    "correct": 1,
                    "expl": "The derivative of a composite function is the product of the intermediate derivatives.",
                    "hint": "Derivatives multiply along paths in computational graphs."
                },
                {
                    "q": "Why is reverse-mode autodiff preferred over forward-mode for neural networks with millions of parameters?",
                    "options": ["It requires zero memory", "It computes gradients of a single scalar loss with respect to all parameters in a single backward sweep", "It avoids computing Jacobians entirely", "It works only for linear models"],
                    "correct": 1,
                    "expl": "Reverse-mode autodiff computes all dL/dw_i in O(1) backward sweeps regardless of the number of weights.",
                    "hint": "Neural networks have 1 scalar loss output and N input weights."
                }
            ]
        },
        "DL-08": {
            "title": "Backpropagation Master Quiz",
            "desc": "Test your in-depth understanding of forward caching and backward error propagation.",
            "questions": [
                {
                    "q": "During the forward pass of backpropagation, why do we store intermediate layer activations?",
                    "options": ["To display them in logs", "Because calculating the local gradients during the backward pass requires the activation values", "To reduce GPU memory usage", "To eliminate the need for weights"],
                    "correct": 1,
                    "expl": "For example, d/dx [ReLU(x)] depends on whether the stored forward activation x > 0.",
                    "hint": "Local derivatives of activation functions like Sigmoid, Tanh, and ReLU depend on stored inputs/outputs."
                },
                {
                    "q": "If a student attempts Backpropagation without understanding the Calculus Chain Rule, what cognitive difficulty occurs?",
                    "options": ["They cannot write Python code", "They memorize formulas without understanding error credit assignment", "Loss values become negative", "Gradient vectors flip sign"],
                    "correct": 1,
                    "expl": "Without the chain rule, backpropagation appears as arbitrary matrix operations rather than systematic application of composite differentiation.",
                    "hint": "This is a prime example of prerequisite dependency failure in traditional learning systems."
                }
            ]
        },
        "DL-12": {
            "title": "Self-Attention & Dot-Product Diagnostic",
            "desc": "Validate your grasp of Q, K, V projections and attention score scaling.",
            "questions": [
                {
                    "q": "Why is the dot product Q * K^T divided by sqrt(d_k) in Scaled Dot-Product Attention?",
                    "options": ["To increase training speed", "To prevent dot products from growing excessively large for large dimensions, which would push Softmax into regions with tiny gradients", "To ensure matrices are symmetric", "To normalize token lengths"],
                    "correct": 1,
                    "expl": "For large d_k, dot products grow large in magnitude, pushing softmax into saturation where gradients vanish.",
                    "hint": "Think about variance of dot products of random vectors with dimension d_k."
                }
            ]
        }
    }

    for code, q_info in quizzes_data.items():
        if code in dl_nodes_map:
            quiz = AssessmentQuiz(
                concept_id=dl_nodes_map[code].id,
                title=q_info["title"],
                description=q_info["desc"],
                time_limit_seconds=300,
                pass_threshold=0.7
            )
            db.add(quiz)
            db.flush()

            for q_item in q_info["questions"]:
                question = QuizQuestion(
                    quiz_id=quiz.id,
                    question_text=q_item["q"],
                    options_json=json.dumps(q_item["options"]),
                    correct_option_index=q_item["correct"],
                    explanation=q_item["expl"],
                    remediation_hint=q_item.get("hint", "Review prerequisite concepts before reattempting.")
                )
                db.add(question)

    # 4. Set Initial Student Mastery for User 1 (Alex)
    # Alex has mastered DL-01 (Calculus) & DL-02 (Linear Algebra) -> DL-05 & DL-07 are READY!
    masteries_user1 = [
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-01"].id, mastery_score=0.92, status="MASTERED", attempts_count=2, confidence_rating=0.9),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-02"].id, mastery_score=0.88, status="MASTERED", attempts_count=1, confidence_rating=0.85),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-03"].id, mastery_score=0.82, status="MASTERED", attempts_count=1, confidence_rating=0.8),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-04"].id, mastery_score=0.80, status="MASTERED", attempts_count=1, confidence_rating=0.8),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-05"].id, mastery_score=0.78, status="MASTERED", attempts_count=2, confidence_rating=0.75),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-06"].id, mastery_score=0.50, status="IN_PROGRESS", attempts_count=1, confidence_rating=0.6),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-07"].id, mastery_score=0.85, status="MASTERED", attempts_count=1, confidence_rating=0.85),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-08"].id, mastery_score=0.20, status="READY", attempts_count=0, confidence_rating=0.3),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-09"].id, mastery_score=0.0, status="LOCKED", attempts_count=0, confidence_rating=0.0),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-12"].id, mastery_score=0.0, status="READY", attempts_count=0, confidence_rating=0.0),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-13"].id, mastery_score=0.0, status="LOCKED", attempts_count=0, confidence_rating=0.0),
        StudentMastery(user_id=user1.id, concept_id=dl_nodes_map["DL-14"].id, mastery_score=0.0, status="LOCKED", attempts_count=0, confidence_rating=0.0)
    ]
    db.add_all(masteries_user1)

    # 5. Comparative Research Study Empirical Dataset
    study_metric = ComparativeStudyMetric(
        study_name="Empirical Evaluation of Concept Dependency Mapper in STEM Education",
        cohort_size_ai=120,
        cohort_size_trad=120,
        avg_mastery_ai=0.884,
        avg_mastery_trad=0.642,
        avg_time_hours_ai=24.5,
        avg_time_hours_trad=42.0,
        retention_rate_ai=0.892,
        retention_rate_trad=0.615,
        gap_resolution_rate_ai=0.941,
        gap_resolution_rate_trad=0.320,
        cohen_d_effect_size=1.34,
        p_value=0.0001,
        metrics_breakdown_json=json.dumps({
            "retention_30_days_ai": 89.2,
            "retention_30_days_trad": 61.5,
            "dropout_rate_ai": 8.5,
            "dropout_rate_trad": 42.0,
            "time_saved_percentage": 41.7,
            "learning_gain_multiplier": 3.1
        })
    )
    db.add(study_metric)
    db.commit()
    print("Database seeding completed successfully.")
