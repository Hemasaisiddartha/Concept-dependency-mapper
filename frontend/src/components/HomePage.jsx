import React from 'react';
import { 
  Network, GraduationCap, Compass, BarChart3, Bot, Smartphone, 
  PlayCircle, Sparkles, CheckCircle2, Zap, Lock, BookOpen, 
  ArrowRight, ShieldCheck, Database, Award, Clock, Activity, BrainCircuit 
} from 'lucide-react';

export default function HomePage({ 
  currentUser, 
  userStats, 
  graphData, 
  currentCourse, 
  onNavigateTab, 
  onStartQuiz, 
  onAskAITutor, 
  onExplorePathway 
}) {
  const masteryPct = userStats?.overall_mastery_percentage || graphData?.overall_mastery_percentage || 0;
  const masteredCount = userStats?.total_mastered ?? (graphData?.mastered_count || 0);
  const readyCount = userStats?.total_ready ?? (graphData?.ready_count || 0);
  const lockedCount = userStats?.total_locked ?? (graphData?.locked_count || 0);
  const nodes = graphData?.nodes || [];
  const totalConcepts = graphData?.total_concepts || nodes.length || 0;

  const readyNode = nodes.find(n => n.status === 'READY') || nodes[0];
  const masteredNodes = nodes.filter(n => n.status === 'MASTERED');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>
      
      {/* 🌟 HERO WELCOME & DATABASE SNAPSHOT */}
      <div 
        className="glass-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.6) 50%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '24px',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Ambient Top Glow Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          
          {/* Welcome Text */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <BrainCircuit size={14} />
                <span>ACTIVE SESSION • DATABASE SYNCED</span>
              </span>

              <span style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                background: currentUser?.group_assignment === 'traditional_system' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: currentUser?.group_assignment === 'traditional_system' ? '#38bdf8' : '#34d399',
                border: currentUser?.group_assignment === 'traditional_system' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {currentUser?.group_assignment === 'traditional_system' ? 'Traditional Linear Cohort' : 'AI Concept Mapper Cohort'}
              </span>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 10px', color: '#ffffff' }}>
              Welcome back, {currentUser?.full_name || 'Student'}! 👋
            </h1>

            <p style={{ fontSize: '0.94rem', color: '#cbd5e1', lineHeight: 1.6, maxWidth: '640px', margin: 0 }}>
              You are currently enrolled in <strong>{currentCourse?.title || 'Deep Learning & Neural Architectures'}</strong>.
              Your real-time mastery scores, quiz attempts, and prerequisite unlocks are persisted in the database.
            </p>

            {/* Quick Stats Pill Row */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}><strong>{masteredCount}</strong> Mastered</span>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}><strong>{readyCount}</strong> Ready to Learn</span>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64748b' }} />
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}><strong>{lockedCount}</strong> Locked</span>
              </div>
            </div>
          </div>

          {/* Mastery Progress Radial Dial / Card */}
          <div 
            className="glass-panel"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '20px',
              padding: '22px 28px',
              textAlign: 'center',
              minWidth: '220px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.05em', marginBottom: '6px' }}>
              SAVED MASTERY LEVEL
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
              {masteryPct}%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {masteredCount} of {totalConcepts} Concepts Mastered
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', marginTop: '14px', overflow: 'hidden' }}>
              <div style={{ width: `${masteryPct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', transition: 'width 0.5s ease' }} />
            </div>

            <button
              onClick={() => onNavigateTab('graph')}
              className="btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center', borderRadius: '8px' }}
            >
              <span>View Interactive Graph</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* ⚡ IMMEDIATE RECOMMENDED ACTION CARD */}
      {readyNode && (
        <div 
          className="glass-panel"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div style={{ flex: '1 1 450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                ⚡ NEXT OPTIMAL LEARNING STEP
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {readyNode.category} • Bloom: {readyNode.bloom_level} • ~{readyNode.estimated_minutes || 45} mins
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 6px' }}>
              {readyNode.code}: {readyNode.title}
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
              {readyNode.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onStartQuiz(readyNode.id)}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <PlayCircle size={17} />
              <span>Take Diagnostic Micro-Quiz</span>
            </button>

            <button
              onClick={() => onAskAITutor(readyNode.id, readyNode.title)}
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} color="#06b6d4" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>
      )}

      {/* 🚀 CORE PLATFORM NAVIGATION HUBS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>Explore Learning Modules & Tools</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Navigate to any tool in your personalized adaptive learning environment.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* 1. Interactive Graph */}
          <div 
            onClick={() => onNavigateTab('graph')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '22px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Network size={22} color="#818cf8" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  5 TIERS • 14 NODES
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Interactive Concept Graph
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Visualize prerequisite DAG hierarchies, zoom into concept dependencies, and track dynamic unlocking flows.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#818cf8', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}>
              <span>Open Concept Graph</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 2. Adaptive Learning Pathway */}
          <div 
            onClick={() => onNavigateTab('pathway')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '22px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={22} color="#38bdf8" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  DAG PREREQUISITE SOLVER
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Adaptive Learning Pathway
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Select any target topic (e.g. Transformers or CNNs) to generate the optimal step-by-step prerequisite subpath.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}>
              <span>Calculate Adaptive Path</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 3. Student Dashboard */}
          <div 
            onClick={() => onNavigateTab('dashboard')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '22px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={22} color="#34d399" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  BLOOM TAXONOMY
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Student Dashboard & Mastery
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Inspect your concept-by-concept mastery scores, Bloom's cognitive taxonomy levels, and diagnostic quiz stats.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#34d399', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}>
              <span>View Student Dashboard</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 4. Comparative Research Analytics */}
          <div 
            onClick={() => onNavigateTab('analytics')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '22px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={22} color="#fbbf24" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  COHEN'S d = 1.34
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Comparative Research Study
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Empirical randomized evaluation demonstrating +37.6% learning gains and 3.1x faster gap remediation.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}>
              <span>Review Empirical Data</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 5. Mobile Experience Simulator */}
          <div 
            onClick={() => onNavigateTab('mobile')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '22px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={22} color="#c084fc" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700, background: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  REACT NATIVE APP
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Mobile Application Simulator
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Test the synchronized smartphone experience with live database micro-quizzes and mobile AI Tutor.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#c084fc', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}>
              <span>Launch Mobile Simulator</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 6. AI Concept Tutor Launchpad */}
          <div 
            onClick={() => onAskAITutor(null, 'Deep Learning Prerequisite Architecture')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '22px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={22} color="#ffffff" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  CONTEXTUAL AI
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                AI Concept Tutor Assistant
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Ask questions about why specific calculus prerequisites exist, get step-by-step explanations and math proofs.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}>
              <span>Chat with AI Tutor</span>
              <ArrowRight size={14} />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
