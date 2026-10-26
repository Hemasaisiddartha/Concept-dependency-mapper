import React, { useState, useRef, useEffect } from 'react';
import { 
  Network, BarChart3, Compass, Sparkles, Smartphone, GraduationCap, 
  BrainCircuit, User, LogIn, LogOut, RotateCcw, ChevronDown, Check, Shield
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentCourse, 
  courses, 
  onSelectCourse, 
  currentUser, 
  userStats,
  onOpenAuthModal, 
  onLogout,
  onResetProgress,
  onToggleMobileView, 
  isMobileViewActive,
  onOpenCourseBuilder
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const masteryPct = userStats?.overall_mastery_percentage || 0;

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', position: 'sticky', top: 0, zIndex: 50, padding: '10px 24px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            <BrainCircuit size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI Concept Dependency Mapper
              </span>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', fontWeight: 700 }}>
                RESEARCH v2.5
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Improving Student Learning Outcomes vs. Traditional Linear Systems
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.85)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('home')}
            className={`btn-secondary ${activeTab === 'home' ? 'active-nav-btn' : ''}`}
            style={{
              background: activeTab === 'home' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              border: 'none',
              color: activeTab === 'home' ? '#fff' : 'var(--text-muted)',
              padding: '7px 13px',
              fontSize: '0.84rem'
            }}
          >
            <Sparkles size={15} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`btn-secondary ${activeTab === 'graph' ? 'active-nav-btn' : ''}`}
            style={{
              background: activeTab === 'graph' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              border: 'none',
              color: activeTab === 'graph' ? '#fff' : 'var(--text-muted)',
              padding: '7px 13px',
              fontSize: '0.84rem'
            }}
          >
            <Network size={15} />
            <span>Interactive Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn-secondary ${activeTab === 'dashboard' ? 'active-nav-btn' : ''}`}
            style={{
              background: activeTab === 'dashboard' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              border: 'none',
              color: activeTab === 'dashboard' ? '#fff' : 'var(--text-muted)',
              padding: '7px 13px',
              fontSize: '0.84rem'
            }}
          >
            <GraduationCap size={15} />
            <span>Student Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('pathway')}
            className={`btn-secondary ${activeTab === 'pathway' ? 'active-nav-btn' : ''}`}
            style={{
              background: activeTab === 'pathway' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              border: 'none',
              color: activeTab === 'pathway' ? '#fff' : 'var(--text-muted)',
              padding: '7px 13px',
              fontSize: '0.84rem'
            }}
          >
            <Compass size={15} />
            <span>Adaptive Pathway</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`btn-secondary ${activeTab === 'analytics' ? 'active-nav-btn' : ''}`}
            style={{
              background: activeTab === 'analytics' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'transparent',
              border: 'none',
              color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted)',
              padding: '7px 13px',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <BarChart3 size={15} />
            <span>Comparative Research</span>
          </button>
        </nav>

        {/* Right Section: Course Selector, Create Course, Mobile View & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Create Course Button */}
          {onOpenCourseBuilder && (
            <button
              onClick={onOpenCourseBuilder}
              className="btn-accent-glow"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Sparkles size={14} />
              <span>+ Create Course</span>
            </button>
          )}

          {/* Course Selector */}
          {courses && courses.length > 0 && (
            <select
              value={currentCourse?.id || courses[0]?.id}
              onChange={(e) => onSelectCourse(Number(e.target.value))}
              style={{
                background: 'rgba(30, 41, 59, 0.9)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '7px 10px',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
              ))}
            </select>
          )}

          {/* Mobile Simulator Toggle */}
          <button
            onClick={onToggleMobileView}
            className="btn-secondary"
            title="Toggle Mobile Simulator"
            style={{
              padding: '7px 10px',
              fontSize: '0.82rem',
              background: isMobileViewActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isMobileViewActive ? 'var(--primary)' : 'var(--border-subtle)',
              color: isMobileViewActive ? '#818cf8' : 'var(--text-muted)'
            }}
          >
            <Smartphone size={15} />
            <span>Mobile App</span>
          </button>

          {/* Authenticated User Menu or Login Button */}
          {currentUser ? (
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 10px 5px 6px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  background: 'rgba(30, 41, 59, 0.85)',
                  cursor: 'pointer'
                }}
              >
                {/* User Avatar Circle */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getInitials(currentUser.full_name)}
                </div>

                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                    {currentUser.full_name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>
                    {masteryPct}% Mastery
                  </div>
                </div>

                <ChevronDown size={14} color="#94a3b8" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div 
                  className="glass-panel animate-scale-up"
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    width: '260px',
                    background: 'rgba(15, 23, 42, 0.98)',
                    borderRadius: '16px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '14px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                    zIndex: 60
                  }}
                >
                  {/* Profile Summary */}
                  <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{currentUser.full_name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>@{currentUser.username} • {currentUser.email}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 600 }}>
                        {currentUser.role?.toUpperCase() || 'STUDENT'}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 600 }}>
                        {currentUser.group_assignment === 'traditional_system' ? 'Traditional Cohort' : 'AI Mapper Cohort'}
                      </span>
                    </div>
                  </div>

                  {/* Mastery Stats Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>Database Saved Mastery:</span>
                      <strong style={{ color: '#10b981' }}>{masteryPct}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                      <div style={{ width: `${masteryPct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onResetProgress();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#fca5a5',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <RotateCcw size={14} />
                      <span>Reset My Course Progress</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#93c5fd',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <User size={14} />
                      <span>Switch Account / Sign In</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '0.84rem',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
              }}
            >
              <LogIn size={15} />
              <span>Sign In / Register</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
