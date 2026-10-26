import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, Clock, BookOpen, Sparkles, ArrowRight, 
  HelpCircle, Lock, AlertTriangle, PlayCircle, Search, Globe, 
  ExternalLink, GraduationCap, Flame, Layers, BrainCircuit, Terminal,
  CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { getConceptDetails, getConceptDeepBriefing } from '../services/api';
import api from '../services/api';

export default function ConceptDetailsDrawer({ conceptId, onClose, onStartQuiz, onExplorePathway, onAskAITutor, onSelectNode, userId = 1 }) {
  const [details, setDetails] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dependencyExplanation, setDependencyExplanation] = useState(null);
  const [explainingId, setExplainingId] = useState(null);
  const [showAllPoints, setShowAllPoints] = useState(false);

  useEffect(() => {
    if (!conceptId) return;
    setLoading(true);
    setDetails(null);
    setBriefing(null);
    setDependencyExplanation(null);
    setShowAllPoints(false);

    Promise.all([
      getConceptDetails(conceptId, userId),
      getConceptDeepBriefing(conceptId)
    ])
      .then(([detailsData, briefingData]) => {
        setDetails(detailsData);
        setBriefing(briefingData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching concept details and Google matter:', err);
        setLoading(false);
      });
  }, [conceptId, userId]);

  const handleExplainDependency = async (prereqId) => {
    setExplainingId(prereqId);
    try {
      const res = await api.get(`/concepts/dependency-explanation/detail?source_id=${prereqId}&target_id=${conceptId}`);
      setDependencyExplanation(res.data);
    } catch (err) {
      console.warn('Error fetching explanation', err);
      setDependencyExplanation({
        pedagogical_rationale: "Mastering this upstream prerequisite establishes the cognitive scaffolding and required mental models for this topic."
      });
    }
  };

  if (!conceptId) return null;

  const keyPoints = briefing?.key_learning_points || [];
  const displayedPoints = showAllPoints ? keyPoints : keyPoints.slice(0, 3);
  const liveExtract = briefing?.live_google_matter?.live_extract || details?.description;

  return (
    <div className="glass-panel animate-fade-in" style={{
      width: '460px',
      maxHeight: 'calc(100vh - 110px)',
      overflowY: 'auto',
      padding: '24px',
      borderLeft: '1px solid var(--border-glow)',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      position: 'relative'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
              {details?.code || 'CONCEPT'}
            </span>
            <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={11} />
              <span>DIRECT GOOGLE KNOWLEDGE MATTER</span>
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginTop: '6px', lineHeight: 1.3, color: '#ffffff' }}>
            {details?.title || 'Loading Concept...'}
          </h3>
        </div>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 8px', borderRadius: '50%' }}>
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#38bdf8' }} />
          <div>Synthesizing complete Google topic matter...</div>
        </div>
      ) : details && (
        <>
          {/* Status & Mastery Bar */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mastery Level</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: details.status === 'MASTERED' ? '#10b981' : '#fbbf24' }}>
                {Math.round(details.mastery_score * 100)}% ({details.status})
              </span>
            </div>
            <div style={{ width: '100%', height: '7px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${details.mastery_score * 100}%`,
                height: '100%',
                background: details.status === 'MASTERED' ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Quick Metadata Badges */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              Category: <strong>{details.category}</strong>
            </span>
            <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              Bloom: <strong>{details.bloom_level}</strong>
            </span>
            <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              Est. Time: <strong>~{details.estimated_minutes} mins</strong>
            </span>
          </div>

          {/* 🌟 DIRECT EMBEDDED GOOGLE KNOWLEDGE MATTER */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Globe size={13} />
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Direct Google Knowledge Matter
                </span>
              </div>

              <button
                onClick={() => onStartQuiz(details.id)}
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                title="Open this topic in separate studio"
              >
                <ExternalLink size={12} style={{ marginRight: '4px' }} />
                <span>Open Separately</span>
              </button>
            </div>

            {/* Direct Live Extract / Overview */}
            <p style={{ fontSize: '0.88rem', color: '#f1f5f9', lineHeight: 1.6, margin: '0 0 12px 0' }}>
              {liveExtract}
            </p>

            {/* Intuitive Mental Model */}
            {(briefing?.core_mental_model || details?.summary_content) && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.76rem', fontWeight: 700, marginBottom: '4px' }}>
                  <Flame size={13} />
                  <span>Intuitive Mental Model</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#fef3c7', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{briefing?.core_mental_model || details?.summary_content}"
                </p>
              </div>
            )}

            {/* Point-by-point Breakdown directly in Drawer */}
            {keyPoints.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Key Conceptual Breakdown ({keyPoints.length} Points)
                  </span>
                  {keyPoints.length > 3 && (
                    <button
                      onClick={() => setShowAllPoints(!showAllPoints)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>{showAllPoints ? 'Show Less' : `Show All ${keyPoints.length}`}</span>
                      {showAllPoints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {displayedPoints.map((pt, pIdx) => {
                    const title = typeof pt === 'object' && pt !== null ? pt.title : `Point ${pIdx + 1}`;
                    const firstPara = typeof pt === 'object' && pt !== null 
                      ? (Array.isArray(pt.paragraphs) ? pt.paragraphs[0] : pt.explanation || '')
                      : String(pt);
                    return (
                      <div 
                        key={pIdx}
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8', marginBottom: '4px' }}>
                          {pIdx + 1}. {title}
                        </div>
                        <div style={{ fontSize: '0.80rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                          {firstPara}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mathematical / Algorithmic Rules if available */}
            {briefing?.mathematical_or_algorithmic_rules && briefing.mathematical_or_algorithmic_rules.length > 0 && (
              <div style={{ marginTop: '12px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                  <BrainCircuit size={13} />
                  <span>Mathematical & Algorithmic Rules</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {briefing.mathematical_or_algorithmic_rules.slice(0, 3).map((rule, idx) => (
                    <div key={idx} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.78rem', color: '#ddd6fe' }}>
                      • {rule}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Practical Applied Example */}
          {details.practical_example && (
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
                <Terminal size={14} />
                <span>Production & Applied Code Context</span>
              </div>
              <p style={{ fontSize: '0.80rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)', margin: 0 }}>
                {details.practical_example}
              </p>
            </div>
          )}

          {/* Direct Prerequisites List */}
          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              Required Upstream Prerequisites ({details.direct_prerequisites?.length || 0})
            </h4>

            {details.direct_prerequisites && details.direct_prerequisites.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {details.direct_prerequisites.map(p => (
                  <div key={p.id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div 
                      onClick={() => onSelectNode && onSelectNode(p.id)}
                      style={{ cursor: onSelectNode ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '6px' }}
                      title="Click to view this topic separately"
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', textDecoration: onSelectNode ? 'underline dotted' : 'none' }}>
                        {p.code}: {p.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {onSelectNode && (
                        <button
                          onClick={() => onSelectNode(p.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#38bdf8' }}
                          title="Open this prerequisite topic separately"
                        >
                          <ExternalLink size={12} />
                          <span>Open</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleExplainDependency(p.id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#818cf8' }}
                      >
                        <Sparkles size={12} />
                        <span>Why Needed?</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#10b981' }}>
                ✓ Foundational Entry Concept (No upstream prerequisites required)
              </div>
            )}
          </div>

          {/* AI Dependency Explanation Box */}
          {dependencyExplanation && (
            <div className="glass-panel animate-fade-in" style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>
                <Sparkles size={13} />
                <span>AI Prerequisite Rationale</span>
              </div>
              <p style={{ fontSize: '0.80rem', color: '#e0f2fe', lineHeight: 1.5, margin: 0 }}>
                {dependencyExplanation.pedagogical_rationale}
              </p>
            </div>
          )}

          {/* Unlocked Downstream Concepts */}
          {details.direct_dependents && details.direct_dependents.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Unlocks Downstream ({details.direct_dependents.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {details.direct_dependents.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => onSelectNode && onSelectNode(d.id)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      cursor: onSelectNode ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Click to open this topic separately"
                  >
                    <span>{d.code}: {d.title}</span>
                    <ArrowRight size={11} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', paddingTop: '16px' }}>
            <button
              onClick={() => onStartQuiz(details.id)}
              className="btn-accent-glow"
              style={{ justifyContent: 'center', fontWeight: 800, padding: '12px 16px' }}
            >
              <Globe size={16} />
              <span>🌐 Open Interactive Studio & Master Quiz (20 Qs)</span>
            </button>

            <button
              onClick={() => onExplorePathway(details.id)}
              className="btn-accent-glow"
              style={{ justifyContent: 'center' }}
            >
              <Sparkles size={16} />
              <span>Target Adaptive Pathway to This Node</span>
            </button>

            <button
              onClick={() => onAskAITutor(details.id, details.title)}
              className="btn-secondary"
              style={{ justifyContent: 'center' }}
            >
              <HelpCircle size={16} />
              <span>Ask AI Tutor About This Concept</span>
            </button>
          </div>
        </>
      )}

    </div>
  );
}
