import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ConceptGraphCanvas from './components/ConceptGraphCanvas';
import StudentDashboard from './components/StudentDashboard';
import ConceptDetailsDrawer from './components/ConceptDetailsDrawer';
import AdaptivePathwayView from './components/AdaptivePathwayView';
import ComparativeAnalyticsDashboard from './components/ComparativeAnalyticsDashboard';
import QuizModal from './components/QuizModal';
import AITutorModal from './components/AITutorModal';
import MobileSimulatorView from './components/MobileSimulatorView';
import AuthModal from './components/AuthModal';
import CourseBuilderModal from './components/CourseBuilderModal';
import { 
  getCourses, getConceptGraph, getCurrentUserStats, 
  resetUserProgress, generateAICurriculum 
} from './services/api';
import { Bot, Sparkles, Plus, Layers, Database } from 'lucide-react';

export default function App() {
  // Authentication & Active User State (null if no active session in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('concept_mapper_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null; // Require login first
  });

  const [userStats, setUserStats] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isCourseBuilderOpen, setIsCourseBuilderOpen] = useState(false);

  // Course & Navigation States - Default to 'home'
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [graphData, setGraphData] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // home, graph, dashboard, pathway, analytics
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeQuizConceptId, setActiveQuizConceptId] = useState(null);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [tutorContext, setTutorContext] = useState({ id: null, title: null });
  const [isMobileViewActive, setIsMobileViewActive] = useState(false);
  const [pathwayTargetId, setPathwayTargetId] = useState(null);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [generatingTopicName, setGeneratingTopicName] = useState('');

  // Load Initial Courses
  const loadCourses = useCallback(async () => {
    const data = await getCourses();
    if (data && data.length > 0) {
      setCourses(data);
      if (!selectedCourseId || !data.some(c => c.id === selectedCourseId)) {
        setSelectedCourseId(data[0].id);
      }
    } else {
      setCourses([]);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Fetch Graph Data and User Stats whenever course or currentUser changes
  const fetchGraphAndStats = useCallback(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    
    getConceptGraph(selectedCourseId, uid).then(data => {
      if (data) {
        setGraphData(data);
        // Select first ready node if none selected
        if (!selectedNodeId && data.nodes) {
          const readyNode = data.nodes.find(n => n.status === 'READY') || data.nodes[0];
          if (readyNode) setSelectedNodeId(readyNode.id);
        }
      }
    });

    getCurrentUserStats(uid, selectedCourseId).then(stats => {
      if (stats) setUserStats(stats);
    });
  }, [selectedCourseId, currentUser, selectedNodeId]);

  useEffect(() => {
    fetchGraphAndStats();
  }, [fetchGraphAndStats]);

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedNodeId(null);
  };

  // Instant Topic Map Finder & AI Generator
  const handleSearchOrGenerateTopic = async (topicQuery) => {
    const q = topicQuery.trim().toLowerCase();
    if (!q) return null;

    // 1. Check if an existing course strictly matches this topic
    const existing = courses.find(c => {
      const cTitle = (c.title || '').toLowerCase();
      const cCode = (c.code || '').toLowerCase();
      return (
        cTitle === q || 
        cTitle.startsWith(q) ||
        cCode === q
      );
    });

    if (existing) {
      setSelectedCourseId(existing.id);
      setSelectedNodeId(null);
      setActiveTab('graph');
      return existing;
    }

    // 2. Generate new Concept Dependency Map with AI in real-time
    setIsGeneratingTopic(true);
    setGeneratingTopicName(topicQuery);
    try {
      const res = await generateAICurriculum(topicQuery, 'Universal Knowledge', currentUser?.id || 1);
      if (res && res.id) {
        await loadCourses();
        setSelectedCourseId(res.id);
        setSelectedNodeId(null);
        setActiveTab('graph');
        return res;
      }
    } catch (err) {
      console.error('Error generating AI topic map:', err);
    } finally {
      setIsGeneratingTopic(false);
      setGeneratingTopicName('');
    }
    return null;
  };

  const handleNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId);
  };

  const handleStartQuiz = (conceptId) => {
    setActiveQuizConceptId(conceptId);
  };

  const handleExplorePathway = (conceptId) => {
    setPathwayTargetId(conceptId);
    setActiveTab('pathway');
  };

  const handleAskAITutor = (conceptId, title) => {
    setTutorContext({ id: conceptId, title });
    setIsAITutorOpen(true);
  };

  const handleQuizComplete = (result) => {
    // Refresh user-specific graph data and stats after quiz submission to database
    fetchGraphAndStats();
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setSelectedNodeId(null);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('concept_mapper_user');
    localStorage.removeItem('concept_mapper_auth_token');
    setCurrentUser(null);
    setUserStats(null);
    setGraphData(null);
  };

  const handleResetProgress = async () => {
    if (!currentUser) return;
    const confirmed = window.confirm(`Reset learning progress in database for ${currentUser.full_name}? This will clear your quiz masteries for this course.`);
    if (!confirmed) return;

    await resetUserProgress(currentUser.id, selectedCourseId);
    fetchGraphAndStats();
  };

  // If user is not logged in, render the dedicated LoginPage
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentCourse={currentCourse}
        courses={courses}
        onSelectCourse={handleSelectCourse}
        currentUser={currentUser}
        userStats={userStats}
        onOpenAuthModal={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
        onLogout={handleLogout}
        onResetProgress={handleResetProgress}
        onToggleMobileView={() => setIsMobileViewActive(prev => !prev)}
        isMobileViewActive={isMobileViewActive}
        onOpenCourseBuilder={() => setIsCourseBuilderOpen(true)}
      />

      {/* Main Content View */}
      <main className="main-content">
        
        {courses.length === 0 ? (
          <div style={{
            maxWidth: '840px',
            margin: '60px auto',
            padding: '40px 30px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '24px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'
            }}>
              <Layers size={32} color="#fff" />
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
              Welcome to AI Concept Dependency Mapper
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', maxWidth: '560px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Your workspace is connected live to Firebase (<code style={{ color: '#06b6d4' }}>ai-concept-mapper-55d53</code>). 
              No predefined dummy data is loaded. Build your first real course curriculum or generate an adaptive concept graph in seconds!
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsCourseBuilderOpen(true)}
                className="btn-accent-glow"
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={18} />
                <span>+ Generate Course with AI</span>
              </button>

              <button
                onClick={() => setIsCourseBuilderOpen(true)}
                className="btn-secondary"
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={18} />
                <span>Create Custom Curriculum</span>
              </button>
            </div>
          </div>
        ) : isMobileViewActive ? (
          <MobileSimulatorView
            graphData={graphData}
            onStartQuiz={handleStartQuiz}
            onSelectNode={handleNodeSelect}
            currentUser={currentUser}
            onOpenAuthModal={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
            onLogout={handleLogout}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : activeTab === 'home' ? (
          <HomePage
            currentUser={currentUser}
            userStats={userStats}
            graphData={graphData}
            currentCourse={currentCourse}
            onNavigateTab={(tab) => {
              if (tab === 'mobile') {
                setIsMobileViewActive(true);
              } else {
                setIsMobileViewActive(false);
                setActiveTab(tab);
              }
            }}
            onStartQuiz={handleStartQuiz}
            onAskAITutor={handleAskAITutor}
            onExplorePathway={handleExplorePathway}
          />
        ) : activeTab === 'graph' ? (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 700px', minWidth: '320px' }}>
              <ConceptGraphCanvas
                graphData={graphData}
                courses={courses}
                selectedCourseId={selectedCourseId}
                onSelectCourse={handleSelectCourse}
                onSearchOrGenerateTopic={handleSearchOrGenerateTopic}
                isGeneratingTopic={isGeneratingTopic}
                generatingTopicName={generatingTopicName}
                onSelectNode={handleNodeSelect}
                selectedNodeId={selectedNodeId}
                onStartQuiz={handleStartQuiz}
                onAskAITutor={handleAskAITutor}
              />
            </div>
            {selectedNodeId && (
              <ConceptDetailsDrawer
                conceptId={selectedNodeId}
                userId={currentUser?.id || 1}
                onClose={() => setSelectedNodeId(null)}
                onStartQuiz={handleStartQuiz}
                onExplorePathway={handleExplorePathway}
                onAskAITutor={handleAskAITutor}
                onSelectNode={handleNodeSelect}
              />
            )}
          </div>
        ) : activeTab === 'dashboard' ? (
          <StudentDashboard
            graphData={graphData}
            currentUser={currentUser}
            onSelectNode={handleNodeSelect}
            onStartQuiz={handleStartQuiz}
            onExplorePathway={handleExplorePathway}
          />
        ) : activeTab === 'pathway' ? (
          <AdaptivePathwayView
            graphData={graphData}
            initialTargetId={pathwayTargetId}
            userId={currentUser?.id || 1}
            onStartQuiz={handleStartQuiz}
            onSelectNode={handleNodeSelect}
          />
        ) : activeTab === 'analytics' ? (
          <ComparativeAnalyticsDashboard />
        ) : null}

      </main>

      {/* Course & Curriculum Builder Modal */}
      <CourseBuilderModal
        isOpen={isCourseBuilderOpen}
        onClose={() => setIsCourseBuilderOpen(false)}
        currentCourseId={selectedCourseId}
        courses={courses}
        onCourseCreated={async (newId) => {
          await loadCourses();
          if (newId) setSelectedCourseId(newId);
          fetchGraphAndStats();
        }}
      />

      {/* Diagnostic Quiz Assessment Modal */}
      {activeQuizConceptId && (
        <QuizModal
          conceptId={activeQuizConceptId}
          userId={currentUser?.id || 1}
          onClose={() => setActiveQuizConceptId(null)}
          onQuizComplete={handleQuizComplete}
        />
      )}

      {/* Floating AI Concept Tutor Modal */}
      <AITutorModal
        isOpen={isAITutorOpen}
        userId={currentUser?.id || 1}
        onClose={() => setIsAITutorOpen(false)}
        initialConceptId={tutorContext.id}
        initialConceptTitle={tutorContext.title}
      />

      {/* Login & Register Authentication Modal (for switching accounts) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Floating AI Tutor Trigger Button */}
      {!isAITutorOpen && (
        <button
          onClick={() => setIsAITutorOpen(true)}
          className="btn-accent-glow"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            borderRadius: '9999px',
            padding: '12px 20px',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(6, 182, 212, 0.4)'
          }}
        >
          <Bot size={20} />
          <span>Ask AI Concept Tutor</span>
        </button>
      )}

    </div>
  );
}
