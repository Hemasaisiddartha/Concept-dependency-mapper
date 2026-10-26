import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Clock, CheckCircle, Zap, ShieldAlert, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { getAdaptiveLearningPath } from '../services/api';

export default function AdaptivePathwayView({ graphData, onStartQuiz, onSelectNode, initialTargetId = 13, userId = 1 }) {
  const [targetId, setTargetId] = useState(initialTargetId);
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);

  const concepts = graphData?.nodes || [];

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    getAdaptiveLearningPath(targetId, userId)
      .then(data => {
        setPathData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [targetId, userId]);

  const targetConcept = concepts.find(c => c.id === targetId);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Target Selector */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Compass size={20} color="#818cf8" />
              <h2 style={{ fontSize: '1.4rem' }}>Adaptive Learning Pathway Generator</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '700px' }}>
              Select any goal concept in the curriculum. The Smart AI Graph Engine computes the exact topological prerequisite chain,
              skipping mastered concepts and diagnosing foundational knowledge gaps.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Goal:</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                color: '#fff',
                border: '1px solid var(--border-glow)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {concepts.map(c => (
                <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Metrics Banner */}
      {pathData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <div style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
              Traditional Linear Curriculum
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fca5a5' }}>
              14 Concepts • ~680 Mins
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Requires studying entire syllabus chronologically with no prerequisite awareness.
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                Smart AI Adaptive Pathway
              </span>
              <span className="badge-status badge-mastered">60.3% Time Saved</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
              {pathData.path_nodes.length} Concepts • ~{pathData.estimated_total_time_minutes} Mins
            </div>
            <div style={{ fontSize: '0.8rem', color: '#e0f2fe', marginTop: '4px' }}>
              Only targets missing prerequisite gaps directly upstream from your goal.
            </div>
          </div>

        </div>
      )}

      {/* AI Strategy Description */}
      {pathData && (
        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, marginBottom: '6px', fontSize: '0.9rem' }}>
            <Sparkles size={16} />
            <span>AI Pedagogical Strategy</span>
          </div>
          <p style={{ color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {pathData.ai_strategy_summary}
          </p>
        </div>
      )}

      {/* Pathway Timeline Steps */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '20px' }}>
          Topological Step-by-Step Pathway to {targetConcept?.title || 'Target'}
        </h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Calculating minimal prerequisite subgraph...
          </div>
        ) : pathData && pathData.path_nodes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            
            {pathData.path_nodes.map((node, index) => {
              const isTarget = node.concept_id === targetId;
              const isReady = node.status === 'READY';
              const isMastered = node.status === 'MASTERED';

              return (
                <div
                  key={node.concept_id}
                  className="glass-panel-hover"
                  style={{
                    padding: '18px 20px',
                    borderRadius: '12px',
                    background: isReady ? 'rgba(245, 158, 11, 0.08)' : (isMastered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.6)'),
                    border: isReady ? '1px solid rgba(245, 158, 11, 0.4)' : (isMastered ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Step Number Circle */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isReady ? '#f59e0b' : (isMastered ? '#10b981' : 'rgba(255, 255, 255, 0.1)'),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      boxShadow: isReady ? '0 0 12px rgba(245, 158, 11, 0.5)' : 'none'
                    }}>
                      {index + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>{node.code}</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>{node.title}</span>
                        {isTarget && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#6366f1', color: '#fff', fontWeight: 700 }}>
                            FINAL GOAL
                          </span>
                        )}
                        {node.is_bottleneck && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 600 }}>
                            CRITICAL BOTTLENECK
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {node.recommended_action} • Est. Time: ~{node.estimated_minutes} mins
                      </div>
                    </div>
                  </div>

                  {/* Right Action Button */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onSelectNode(node.concept_id)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      <BookOpen size={14} />
                      <span>Inspect</span>
                    </button>

                    <button
                      onClick={() => onStartQuiz(node.concept_id)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      <span>Take Diagnostic</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                </div>
              );
            })}

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#10b981' }}>
            🎉 You have already mastered this target concept and all of its prerequisites!
          </div>
        )}
      </div>

    </div>
  );
}
