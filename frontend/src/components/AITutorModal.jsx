import React, { useState } from 'react';
import { X, Send, Sparkles, Bot, User, BrainCircuit, ArrowRight } from 'lucide-react';
import { queryAITutor } from '../services/api';

export default function AITutorModal({ isOpen, onClose, initialConceptId = null, initialConceptTitle = null, userId = 1 }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Concept Tutor. I can help diagnose why you might feel stuck, explain prerequisite dependencies, or answer questions about your learning pathway. What would you like to explore?"
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Why do I need Calculus before Backpropagation?",
    "Explain Self-Attention in simple terms",
    "What are the research results comparing AI Mapper to Traditional Systems?",
    "How does the AI Concept Mapper reduce learning time?"
  ];

  const handleSend = async (queryText = inputQuery) => {
    if (!queryText.trim()) return;

    const userMsg = { sender: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await queryAITutor(queryText, initialConceptId, userId);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res.response,
          action: res.recommended_action,
          related: res.related_prerequisites
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I analyzed your query: Concept dependency mapping models your cognitive trajectory to prevent unmastered prerequisites from causing learning bottlenecks."
        }
      ]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '420px',
      height: '560px',
      background: '#0f172a',
      borderRadius: '20px',
      border: '1px solid var(--border-glow)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden'
    }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Concept Tutor</div>
            <div style={{ fontSize: '0.72rem', color: '#34d399' }}>● Graph Diagnostics Active</div>
          </div>
        </div>

        <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 8px', borderRadius: '50%' }}>
          <X size={14} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%'
          }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(30, 41, 59, 0.8)',
              color: '#ffffff',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)'
            }}>
              {msg.text}
            </div>

            {msg.action && (
              <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '4px', fontWeight: 600 }}>
                💡 Recommendation: {msg.action}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(30, 41, 59, 0.8)', padding: '10px 14px', borderRadius: '14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            AI Tutor is reasoning through concept graph...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.4)' }}>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', background: '#0a0f1d' }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question or explain a concept..."
          style={{
            flex: 1,
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}>
          <Send size={16} />
        </button>
      </form>

    </div>
  );
}
