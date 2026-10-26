import React, { useState } from 'react';
import { 
  X, Sparkles, BookOpen, Plus, Network, HelpCircle, 
  CheckCircle2, AlertCircle, ArrowRight, Layers, Database 
} from 'lucide-react';
import { 
  createCourse, generateAICurriculum, createConcept, 
  createDependency, createQuiz 
} from '../services/api';

export default function CourseBuilderModal({ isOpen, onClose, currentCourseId, courses, onCourseCreated }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('ai_gen'); // 'ai_gen', 'manual_course', 'add_concept', 'add_dep', 'add_quiz'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // AI Topic Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('Computer Science');

  // Manual Course Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseCategory, setCourseCategory] = useState('Computer Science');
  const [courseDifficulty, setCourseDifficulty] = useState('Intermediate');
  const [courseHours, setCourseHours] = useState('40');
  const [courseDescription, setCourseDescription] = useState('');

  // Add Concept Form State
  const [targetCourseId, setTargetCourseId] = useState(currentCourseId || (courses[0]?.id || 1));
  const [conceptTitle, setConceptTitle] = useState('');
  const [conceptCode, setConceptCode] = useState('');
  const [conceptCategory, setConceptCategory] = useState('Core');
  const [conceptDifficulty, setConceptDifficulty] = useState(2);
  const [conceptMinutes, setConceptMinutes] = useState(45);
  const [conceptBloom, setConceptBloom] = useState('Understand');
  const [conceptDescription, setConceptDescription] = useState('');
  const [conceptExample, setConceptExample] = useState('');

  // Add Dependency Form State
  const [sourceConceptId, setSourceConceptId] = useState('');
  const [destConceptId, setDestConceptId] = useState('');
  const [depType, setDepType] = useState('HARD_PREREQUISITE');
  const [depWeight, setDepWeight] = useState(1.0);
  const [depExplanation, setDepExplanation] = useState('');

  // Add Quiz Form State
  const [quizConceptId, setQuizConceptId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');

  // Handlers
  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      setErrorMsg('Please enter a subject or topic name.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await generateAICurriculum(aiTopic.trim(), aiCategory);
      setSuccessMsg(`Course "${res.title}" generated with ${res.total_concepts} concept nodes and saved to Firebase!`);
      setTimeout(() => {
        onCourseCreated(res.id);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to generate curriculum. Please check backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourseManual = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseCode.trim() || !courseDescription.trim()) {
      setErrorMsg('Title, Code, and Description are required.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await createCourse({
        title: courseTitle.trim(),
        code: courseCode.trim().toUpperCase(),
        category: courseCategory,
        difficulty_level: courseDifficulty,
        estimated_hours: parseFloat(courseHours) || 40,
        description: courseDescription.trim()
      });
      setSuccessMsg(`Course "${res.title}" created successfully and synced to Firebase!`);
      setTimeout(() => {
        onCourseCreated(res.id);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConcept = async (e) => {
    e.preventDefault();
    if (!conceptTitle.trim() || !conceptCode.trim() || !conceptDescription.trim()) {
      setErrorMsg('Concept Title, Code, and Description are required.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await createConcept({
        course_id: parseInt(targetCourseId),
        title: conceptTitle.trim(),
        code: conceptCode.trim().toUpperCase(),
        category: conceptCategory,
        difficulty: parseInt(conceptDifficulty),
        estimated_minutes: parseInt(conceptMinutes),
        bloom_level: conceptBloom,
        description: conceptDescription.trim(),
        practical_example: conceptExample.trim() || null
      });
      setSuccessMsg(`Concept node "${res.title}" created in Firebase!`);
      setConceptTitle('');
      setConceptCode('');
      setConceptDescription('');
      setConceptExample('');
      setTimeout(() => {
        onCourseCreated(parseInt(targetCourseId));
      }, 800);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add concept.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDependency = async (e) => {
    e.preventDefault();
    if (!sourceConceptId || !destConceptId) {
      setErrorMsg('Select both source and target concepts.');
      return;
    }
    if (sourceConceptId === destConceptId) {
      setErrorMsg('A concept cannot depend on itself.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await createDependency({
        course_id: parseInt(targetCourseId),
        source_concept_id: parseInt(sourceConceptId),
        target_concept_id: parseInt(destConceptId),
        dependency_type: depType,
        strength_weight: parseFloat(depWeight),
        explanation: depExplanation.trim() || undefined
      });
      setSuccessMsg('Prerequisite dependency link connected and synced to Firebase!');
      setTimeout(() => {
        onCourseCreated(parseInt(targetCourseId));
      }, 800);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to connect dependency.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: '20px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Course & Curriculum Builder
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Create real courses, concept nodes & DAG links persisted directly to Firebase
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          padding: '12px 24px 0',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('ai_gen'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'ai_gen' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderBottom: activeTab === 'ai_gen' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'ai_gen' ? '#c7d2fe' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={15} color="#818cf8" />
            <span>✨ AI Topic Generator</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('manual_course'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'manual_course' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderBottom: activeTab === 'manual_course' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'manual_course' ? '#c7d2fe' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={15} />
            <span>New Course</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('add_concept'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'add_concept' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderBottom: activeTab === 'add_concept' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'add_concept' ? '#c7d2fe' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={15} />
            <span>Add Concept</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('add_dep'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'add_dep' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderBottom: activeTab === 'add_dep' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'add_dep' ? '#c7d2fe' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Network size={15} />
            <span>Link Prerequisite</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          
          {/* Notifications */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.84rem',
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              fontSize: '0.84rem',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: AI Topic Generator */}
          {activeTab === 'ai_gen' && (
            <form onSubmit={handleAIGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '0.86rem',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#818cf8' }}>✨ AI Concept Graph Generator:</strong> Type any subject or domain name (e.g. <em>Deep Learning, Quantum Algorithms, Organic Chemistry, Python Full-Stack</em>). The AI will dynamically create the concepts, Bloom's cognitive taxonomy, prerequisite dependency links, and diagnostic quizzes, saving everything directly to your Firebase database!
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Topic or Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deep Learning & Transformer Architectures"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Subject Category
                </label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science & Mathematics">Data Science & Mathematics</option>
                  <option value="Web Engineering">Web Engineering</option>
                  <option value="Physics & Engineering">Physics & Engineering</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-accent-glow"
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <span>Generating Pedagogical Graph & Syncing to Firebase...</span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Complete Concept Graph & Save to Firebase</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Manual Course Creation */}
          {activeTab === 'manual_course' && (
            <form onSubmit={handleCreateCourseManual} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Course Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced Data Structures & Algorithms"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Course Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS-501"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Difficulty Level
                  </label>
                  <select
                    value={courseDifficulty}
                    onChange={(e) => setCourseDifficulty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Course Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain learning objectives and scope..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Database size={16} />
                <span>Save Course to Firebase</span>
              </button>
            </form>
          )}

          {/* TAB 3: Add Concept Node */}
          {activeTab === 'add_concept' && (
            <form onSubmit={handleCreateConcept} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Target Course
                </label>
                <select
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Concept Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Backpropagation & Gradient Flow"
                    value={conceptTitle}
                    onChange={(e) => setConceptTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Concept Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL-103"
                    value={conceptCode}
                    onChange={(e) => setConceptCode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Bloom Level
                  </label>
                  <select
                    value={conceptBloom}
                    onChange={(e) => setConceptBloom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="Remember">Remember (Recall Facts)</option>
                    <option value="Understand">Understand (Explain Ideas)</option>
                    <option value="Apply">Apply (Execute Problem Solving)</option>
                    <option value="Analyze">Analyze (Distinguish Structure)</option>
                    <option value="Evaluate">Evaluate (Justify Decisions)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Difficulty (1 to 5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={conceptDifficulty}
                    onChange={(e) => setConceptDifficulty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Description *
                </label>
                <textarea
                  rows={2}
                  placeholder="Key mental models and definitions..."
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} />
                <span>Save Concept Node to Firebase</span>
              </button>
            </form>
          )}

          {/* TAB 4: Link Prerequisite */}
          {activeTab === 'add_dep' && (
            <form onSubmit={handleCreateDependency} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.82rem',
                color: '#cbd5e1'
              }}>
                Link a prerequisite edge from <strong>Source Concept (Foundation)</strong> → <strong>Target Concept (Advanced Dependent)</strong>.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Source Concept (Prerequisite ID) *
                  </label>
                  <input
                    type="number"
                    placeholder="Source Node ID"
                    value={sourceConceptId}
                    onChange={(e) => setSourceConceptId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Target Concept (Dependent ID) *
                  </label>
                  <input
                    type="number"
                    placeholder="Target Node ID"
                    value={destConceptId}
                    onChange={(e) => setDestConceptId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Pedagogical Explanation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Calculus gradients are necessary to derive the backprop update formula"
                  value={depExplanation}
                  onChange={(e) => setDepExplanation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Network size={16} />
                <span>Connect Dependency Edge & Sync to Firebase</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
