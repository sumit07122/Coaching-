import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Users,
  Sparkles,
  Building,
  Lock,
  Mail,
  UserPlus,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { CoachingCategory } from '../types';
import { isProduction } from '../lib/supabase';

export const Login: React.FC = () => {
  const {
    demoUsers,
    currentInstitute,
    allInstitutes,
    switchInstitute,
    loginAsDemoUser,
    loginWithEmail,
    registerOwnerAndInstitute,
    requestPasswordReset,
    isLoading,
    authError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  // Tabs: 'demo' | 'email' | 'register' - In production mode, default to real email sign in
  const [activeTab, setActiveTab] = useState<'demo' | 'email' | 'register'>(
    isProduction ? 'email' : 'demo'
  );
  const [selectedDemoUserId, setSelectedDemoUserId] = useState<string>(demoUsers[0]?.id || 'USR-001');

  // Email login form
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('+91 9');
  const [regInstName, setRegInstName] = useState('');
  const [regCity, setRegCity] = useState('Mathura');
  const [regCategory, setRegCategory] = useState<CoachingCategory>('academic_k12');

  // Password reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleEnterDemo = () => {
    loginAsDemoUser(selectedDemoUserId);
    navigate(from, { replace: true });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const ok = await loginWithEmail(emailInput.trim(), passwordInput);
    if (ok) {
      navigate(from, { replace: true });
    }
  };

  const handleRegisterInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regInstName.trim() || !regEmail.trim()) return;

    const categoryLabels: Record<CoachingCategory, string> = {
      academic_k12: 'School Academic (Class 9-12 CBSE)',
      engineering_medical: 'Science & Competitive (JEE / NEET)',
      commerce_professional: 'Commerce & CA Foundation',
      skills_languages: 'Vocational & Computer Training',
    };

    const ok = await registerOwnerAndInstitute({
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
      instituteName: regInstName.trim(),
      city: regCity.trim(),
      state: 'Uttar Pradesh',
      category: regCategory,
      categoryLabel: categoryLabels[regCategory],
    });

    if (ok) {
      navigate(from, { replace: true });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    await requestPasswordReset(resetEmail.trim());
    setResetSuccess(true);
    setTimeout(() => {
      setIsResetModalOpen(false);
      setResetSuccess(false);
      setResetEmail('');
    }, 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-family-sans)',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid #1e293b',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            F
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>FIXIA CoachingOS</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
              Multi-Tenant Institute Management Platform
            </span>
          </div>
        </div>

        {/* Institute Switcher Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={14} style={{ color: '#94a3b8' }} />
          <select
            value={currentInstitute.name}
            onChange={e => switchInstitute(e.target.value)}
            style={{
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {allInstitutes.map(inst => (
              <option key={inst.name} value={inst.name}>
                {inst.name} ({inst.city})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Grid */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: '40px',
            alignItems: 'center',
          }}
        >
          {/* Left Hero Narrative */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(37, 99, 235, 0.15)',
                color: '#60a5fa',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <Sparkles size={14} />
              Production Multi-Tenant Institute OS (&lt; 100 Students)
            </div>

            <h1
              style={{
                fontSize: '34px',
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#ffffff',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}
            >
              Automate students, attendance, batches and fee collections in seconds.
            </h1>

            <p style={{ fontSize: '14.5px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
              Built specifically for coaching institutes in India. Protect your student records with
              strict tenant isolation, manage staff permissions, and issue professional receipts instantly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                  <strong>Multi-Tenant Data Isolation:</strong> Every record secured at database kernel level.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                  <strong>Owner, Admin & Staff RBAC:</strong> Tailored role views for directors, receptionists, and teachers.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                  <strong>Commercial Licensing:</strong> Supports monthly SaaS, one-time software licenses, and custom development.
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Building size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                <strong style={{ color: '#f8fafc', display: 'block' }}>
                  Active Workspace: {currentInstitute.name}
                </strong>
                {currentInstitute.address} &bull; Reg: {currentInstitute.regNumber}
              </div>
            </div>
          </div>

          {/* Right Card: Auth & Onboarding Hub */}
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Top Auth Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                backgroundColor: '#0f172a',
                padding: '4px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('demo')}
                style={{
                  padding: '7px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'demo' ? '#2563eb' : 'transparent',
                  color: activeTab === 'demo' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                1-Click Demo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                style={{
                  padding: '7px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'email' ? '#2563eb' : 'transparent',
                  color: activeTab === 'email' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                style={{
                  padding: '7px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'register' ? '#2563eb' : 'transparent',
                  color: activeTab === 'register' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                New Institute
              </button>
            </div>

            {authError && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#fca5a5',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB 1: 1-Click Demo Personas */}
            {activeTab === 'demo' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  Select Demo Persona
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '14px' }}>
                  Explore how different institute roles experience FIXIA CoachingOS.
                </p>

                {isProduction && (
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid #eab308',
                      borderRadius: '6px',
                      color: '#fef08a',
                      fontSize: '12px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>
                      Production Mode Active: 1-Click Demo accounts are disabled. Please sign in with verified credentials on the Sign In tab.
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {demoUsers.map(user => {
                    const isSelected = selectedDemoUserId === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => setSelectedDemoUserId(user.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #334155',
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : '#0f172a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>
                              {user.name}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor:
                                  user.role === 'owner'
                                    ? '#1e3a8a'
                                    : user.role === 'admin'
                                    ? '#065f46'
                                    : '#78350f',
                                color:
                                  user.role === 'owner'
                                    ? '#93c5fd'
                                    : user.role === 'admin'
                                    ? '#6ee7b7'
                                    : '#fde68a',
                                textTransform: 'uppercase',
                              }}
                            >
                              {user.role}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{user.roleTitle}</span>
                        </div>

                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid #3b82f6' : '2px solid #475569',
                            backgroundColor: isSelected ? '#ffffff' : 'transparent',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  style={{ width: '100%' }}
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  disabled={isProduction}
                  onClick={handleEnterDemo}
                >
                  {isProduction ? 'Demo Disabled in Production' : 'Enter Workspace as Selected Role'}
                </Button>
              </div>
            )}

            {/* TAB 2: Sign In with Email & Password */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailLogin}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  Sign In to Institute
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '14px' }}>
                  Enter your credentials registered with Supabase Authentication.
                </p>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="e.g. rakesh.sharma@fixia.in"
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(true)}
                      style={{ fontSize: '11.5px', color: '#60a5fa', cursor: 'pointer' }}
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  style={{ width: '100%', marginTop: '8px' }}
                  isLoading={isLoading}
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                >
                  Sign In to Dashboard
                </Button>
              </form>
            )}

            {/* TAB 3: Register New Institute Onboarding */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterInstitute}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  Onboard Your Institute
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '14px' }}>
                  Create an isolated tenant workspace for your coaching centre in seconds.
                </p>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Coaching Institute Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={regInstName}
                    onChange={e => setRegInstName(e.target.value)}
                    placeholder="e.g. Krishna Science Academy"
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1' }}>Director Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      placeholder="e.g. Er. Rajesh Gupta"
                      style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1' }}>City</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={regCity}
                      onChange={e => setRegCity(e.target.value)}
                      placeholder="e.g. Mathura / Agra"
                      style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1' }}>Director Email</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="director@institute.org"
                      style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1' }}>Director Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="+91 94120 12345"
                      style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Director Account Password (Min 6 chars)</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Create a strong account password"
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Coaching Vertical</label>
                  <select
                    className="form-select"
                    value={regCategory}
                    onChange={e => setRegCategory(e.target.value as CoachingCategory)}
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  >
                    <option value="academic_k12">K-12 School Tuition (Class 9-12 CBSE/ICSE)</option>
                    <option value="engineering_medical">Science & Competitive (JEE / NEET / Foundation)</option>
                    <option value="commerce_professional">Commerce & CA Foundation</option>
                    <option value="skills_languages">Skill & Computer Training</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  style={{ width: '100%', marginTop: '6px' }}
                  isLoading={isLoading}
                  icon={<UserPlus size={16} />}
                >
                  Create Institute Workspace
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Account Password"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePasswordReset}>
              Send Reset Link
            </Button>
          </div>
        }
      >
        <form onSubmit={handlePasswordReset}>
          {resetSuccess ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                borderRadius: '8px',
                color: 'var(--color-success-text)',
                fontSize: '13px',
              }}
            >
              Password reset link has been dispatched to <strong>{resetEmail}</strong>.
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                Enter your registered email address. We will verify your institute membership and send instructions to securely update your password.
              </p>
              <div className="form-group">
                <label className="form-label required">Registered Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="e.g. rakesh.sharma@fixia.in"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
