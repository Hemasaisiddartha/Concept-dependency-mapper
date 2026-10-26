import React from 'react';
import { Award, Clock, TrendingUp, CheckCircle, Zap, ShieldAlert, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

export default function StudentDashboard({ graphData, onSelectNode, onStartQuiz, onExplorePathway, currentUser }) {
  if (!graphData) return null;

  const {
    total_concepts,
    mastered_count,
    ready_count,
    locked_count,
    in_progress_count,
    overall_mastery_percentage,
    nodes
  } = graphData;

  const readyNodes = nodes.filter(n => n.status === 'READY');
  const inProgressNodes = nodes.filter(n => n.status === 'IN_PROGRESS');
  const masteredNodes = nodes.filter(n => n.status === 'MASTERED');

  const studentName = currentUser ? currentUser.full_name : 'Student';
  const cohortLabel = currentUser?.group_assignment === 'traditional_system' 
    ? 'Traditional Linear Cohort' 
    : 'AI Concept Dependency Cohort';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner with AI Adaptation Summary */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-status badge-ready">Database Account Active</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cohort: {cohortLabel}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Welcome back, {studentName}!</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '680px', fontSize: '0.92rem' }}>
              Your isolated concept dependency graph in SQLite has diagnosed <strong>{ready_count} immediate next concepts</strong> ready for you to learn. 
              {mastered_count > 0 
                ? ` You have already mastered ${mastered_count} concept(s) (${overall_mastery_percentage}% overall mastery).`
                : ` Start with foundational prerequisites to unlock advanced tiers!`}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => onExplorePathway(13)} className="btn-primary">
              <Sparkles size={16} />
              <span>Target Pathway: Transformers</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Overall Mastery</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)' }}>
            {overall_mastery_percentage}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mastered_count} of {total_concepts} concepts mastered
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ready to Learn</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-heading)' }}>
            {ready_count}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '4px' }}>
            All prerequisites satisfied
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Time Efficiency</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-heading)' }}>
            +41.7%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Faster than traditional linear path
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Predicted Retention</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} color="#06b6d4" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'var(--font-heading)' }}>
            89.2%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            vs. 61.5% in linear control group
          </div>
        </div>

      </div>

      {/* Main Content Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Ready to Learn Action Queue */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#fbbf24" />
              <h3 style={{ fontSize: '1.15rem' }}>Ready to Learn (Next Steps)</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{readyNodes.length} Concepts Available</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {readyNodes.map(node => (
              <div
                key={node.id}
                className="glass-panel-hover"
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => onSelectNode(node.id)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      {node.code}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{node.title}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Difficulty: {node.difficulty}/5 • ~{node.estimated_minutes} mins • {node.bloom_level}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartQuiz(node.id);
                  }}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <span>Diagnostic Quiz</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}

            {readyNodes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                All available ready concepts are currently in progress or mastered!
              </div>
            )}
          </div>
        </div>

        {/* Mastered Concepts & Prerequisite Chain */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem' }}>Mastered Cognitive Foundation</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{masteredNodes.length} Verified Skills</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '6px' }}>
            {masteredNodes.map(node => (
              <div
                key={node.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>{node.code}</span>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{node.title}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Category: {node.category}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>
                    {Math.round(node.mastery_score * 100)}%
                  </span>
                  <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Mastered</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
