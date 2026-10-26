import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, UserPlus, X, Lock, Mail, User, Shield, 
  Sparkles, CheckCircle2, AlertCircle, ArrowRight, BrainCircuit,
  KeyRound, RefreshCw, Clock, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { loginUser, registerUser, sendEmailOTP, verifyEmailOTP } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialMode = 'password-login' }) {
  // Modes: 'password-login' (default for existing users), 'register' (for new users), 'email-otp' (for OTP & forgot password)
  const [authMode, setAuthMode] = useState(initialMode);
  
  // OTP flow states: 'request' or 'verify'
  const [otpStep, setOtpStep] = useState('request');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(600);
  const [canResend, setCanResend] = useState(false);
  const [previewOtpCode, setPreviewOtpCode] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [groupAssignment, setGroupAssignment] = useState('ai_concept_mapper');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const otpInputsRef = useRef([]);

  const handleForgotPassword = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthMode('email-otp');
    setOtpStep('request');
    if (username && username.includes('@')) {
      setEmail(username.trim());
    }
  };

  useEffect(() => {
    let interval = null;
    if (otpStep === 'verify' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerSeconds === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpStep, timerSeconds]);

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 6).split('');
      pastedDigits.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      if (otpInputsRef.current[nextIndex]) {
        otpInputsRef.current[nextIndex].focus();
      }
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;
    const newDigits = ['', '', '', '', '', ''];
    pasteData.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setOtpDigits(newDigits);
    const focusTarget = Math.min(pasteData.length, 5);
    otpInputsRef.current[focusTarget]?.focus();
  };

  // 1. Send OTP
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailOTP({
        email: cleanEmail,
        full_name: fullName.trim() || undefined
      });

      setOtpStep('verify');
      setOtpDigits(['', '', '', '', '', '']);
      setTimerSeconds(600);
      setCanResend(false);
      setPreviewOtpCode(res.preview_otp || null);
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}`);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 200);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const otpCode = otpDigits.join('').trim();
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailOTP({
        email: email.trim().toLowerCase(),
        otp: otpCode,
        full_name: fullName.trim() || undefined,
        role: role
      });

      setSuccessMsg(res.message || 'OTP verified successfully!');
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ username: username.trim(), password });
      setSuccessMsg(res.message || 'Login successful!');
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role,
        group_assignment: groupAssignment
      });
      setSuccessMsg(res.message || 'Account created successfully!');
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 600);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass-panel animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 30, 0.98) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top Header Glow Bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)',
          width: '100%'
        }} />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={18} />
        </button>

        <div style={{ padding: '28px 32px' }}>
          
          {/* Brand & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
              marginBottom: '10px'
            }}>
              <BrainCircuit size={26} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              {authMode === 'password-login' ? 'Account Sign In' : authMode === 'register' ? 'Create New Account' : 'Forgot Password'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {authMode === 'password-login'
                ? 'Sign in with your username/email and password'
                : authMode === 'register'
                ? 'Create a new account for personalized mastery tracking'
                : 'Enter your email to receive an OTP verification code and log in'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Sign In & Register) */}
          <div style={{
            display: 'flex',
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => { setAuthMode('password-login'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'password-login' ? 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)' : 'transparent',
                color: authMode === 'password-login' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'register' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: authMode === 'register' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <UserPlus size={14} />
              <span>Register</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              marginBottom: '14px'
            }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              fontSize: '0.8rem',
              marginBottom: '14px'
            }}>
              <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Password Login Mode (For existing users) */}
          {authMode === 'password-login' && (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                  Username or Email
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_student or alex@university.edu"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  marginTop: '4px',
                  padding: '11px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? <span>Signing In...</span> : <><LogIn size={16} /><span>Sign In to Account</span></>}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.76rem', color: '#94a3b8', marginTop: '4px' }}>
                <span>New user? </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                  style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Create an Account
                </button>
              </div>
            </form>
          )}

          {/* 2. Register Mode (For new users) */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '3px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Mitchell"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '3px' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@university.edu"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '3px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="jordan_student"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '3px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  marginTop: '4px',
                  padding: '11px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? <span>Registering...</span> : <><Sparkles size={16} /><span>Create Account</span></>}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.76rem', color: '#94a3b8', marginTop: '4px' }}>
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('password-login'); setErrorMsg(null); }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* 3. Email OTP Mode (Forgot Password / Instant OTP) */}
          {authMode === 'email-otp' && (
            <div>
              <div style={{
                padding: '8px 10px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.75rem',
                color: '#c7d2fe',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <KeyRound size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                <span>Forgot password? Enter your email to receive a 6-digit OTP and login immediately.</span>
              </div>

              {otpStep === 'request' ? (
                <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                      Your Account Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="#818cf8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@university.edu"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          background: 'rgba(30, 41, 59, 0.7)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '0.88rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{
                      padding: '11px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.76rem', color: '#94a3b8' }}>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('password-login'); setErrorMsg(null); }}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      ← Back to Password Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ color: '#cbd5e1' }}>OTP sent to: <strong>{email}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Edit
                    </button>
                  </div>

                  {previewOtpCode && (
                    <div style={{
                      padding: '6px 10px',
                      background: 'rgba(6, 182, 212, 0.12)',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      color: '#67e8f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>Preview OTP: <strong>{previewOtpCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpDigits(previewOtpCode.split(''))}
                        style={{ background: 'rgba(6, 182, 212, 0.3)', border: 'none', color: '#fff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      >
                        Fill
                      </button>
                    </div>
                  )}

                  <div onPaste={handlePaste} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        style={{
                          width: '100%',
                          height: '44px',
                          textAlign: 'center',
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          background: digit ? 'rgba(99, 102, 241, 0.15)' : 'rgba(30, 41, 59, 0.7)',
                          border: digit ? '2px solid #818cf8' : '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                    <span style={{ color: '#94a3b8' }}>Expires in: {formatTime(timerSeconds)}</span>
                    <button
                      type="button"
                      disabled={!canResend || loading}
                      onClick={handleSendOTP}
                      style={{ background: 'none', border: 'none', color: canResend ? '#38bdf8' : '#64748b', cursor: canResend ? 'pointer' : 'not-allowed' }}
                    >
                      Resend
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length !== 6}
                    className="btn-primary"
                    style={{
                      padding: '11px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? <span>Verifying...</span> : <><ShieldCheck size={16} /><span>Verify & Sign In</span></>}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
