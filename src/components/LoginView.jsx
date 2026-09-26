import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_DETAILS } from '../types/roles';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Radio,
  Building2,
  Eye,
  EyeOff,
  BadgeAlert,
  Info
} from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const { login, register, authError, clearError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.CITIZEN,
    badgeId: '',
    unit: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (localError) setLocalError('');
    if (authError) clearError();
  };

  const handleQuickFill = (role) => {
    setMode('login');
    setLocalError('');
    clearError();

    if (role === ROLES.ADMIN) {
      setFormData(prev => ({
        ...prev,
        email: 'admin@rakshasetu.gov.in',
        password: 'AdminSecure@2026',
      }));
    } else if (role === ROLES.RESPONDER) {
      setFormData(prev => ({
        ...prev,
        email: 'responder@rakshasetu.gov.in',
        password: 'ResponderAlpha@2026',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        email: 'citizen@gmail.com',
        password: 'CitizenSafe@2026',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!formData.email || !formData.password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!formData.name) {
        setLocalError('Please enter your full name.');
        return;
      }
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      if (formData.role === ROLES.ADMIN) {
        setLocalError('Admin accounts cannot be self-registered. Please select Citizen or Responder.');
        return;
      }
    }

    setSubmitting(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        user = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          badgeId: formData.badgeId,
          unit: formData.unit,
          phone: formData.phone,
        });
      }

      if (onLoginSuccess && user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="login-page-wrapper animate-fade-in">
      {/* Background Ambience */}
      <div className="login-bg-glow"></div>

      <div className="login-card-container animate-scale-up">
        {/* Top Emblem & Branding */}
        <div className="login-brand-header">
          <div className="login-emblem-badge">
            <Shield size={20} className="shield-icon-blue" />
          </div>
          <h1 className="login-title">RAKSHA–SETU</h1>
          <p className="login-sub">
            Unified National Disaster Management & Interconnected Response System
          </p>
          <div className="login-ps-tag">
            <span>SMART INDIA HACKATHON 2026 • SIH26206 • TEAM MAVERICKS</span>
          </div>
        </div>

        {/* 1-Click Role Demo Quick-Fill Bar */}
        <div className="quick-fill-bar">
          <span className="quick-fill-label">⚡ Evaluator 1-Click Role Fill:</span>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="btn-quick-fill qf-admin"
              onClick={() => handleQuickFill(ROLES.ADMIN)}
              title="Fill Admin Credentials"
            >
              🏛️ Admin HQ
            </button>
            <button
              type="button"
              className="btn-quick-fill qf-responder"
              onClick={() => handleQuickFill(ROLES.RESPONDER)}
              title="Fill Responder Credentials"
            >
              🚑 Responder
            </button>
            <button
              type="button"
              className="btn-quick-fill qf-citizen"
              onClick={() => handleQuickFill(ROLES.CITIZEN)}
              title="Fill Citizen Credentials"
            >
              👤 Citizen
            </button>
          </div>
        </div>

        {/* Mode Switch Tabs (Login / Register) */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setLocalError('');
            }}
          >
            <Lock size={15} />
            <span>Secure Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setLocalError('');
            }}
          >
            <User size={15} />
            <span>Register Account</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {activeError && (
          <div className="auth-error-banner animate-slide-down">
            <AlertCircle size={18} className="error-icon" />
            <div className="error-text">
              <strong>Authentication Notice:</strong> {activeError}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="auth-form-body">
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div className="auth-input-group">
                <label>
                  <User size={14} /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Inspector Rajesh Kumar"
                  className="auth-input"
                  required
                />
              </div>

              {/* Account Role Selector */}
              <div className="auth-input-group">
                <label>
                  <BadgeAlert size={14} /> Account Role Classification
                </label>
                <div className="role-selector-radios">
                  <label className={`role-radio-card ${formData.role === ROLES.CITIZEN ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value={ROLES.CITIZEN}
                      checked={formData.role === ROLES.CITIZEN}
                      onChange={handleChange}
                    />
                    <div className="role-radio-content">
                      <span className="role-icon">👤</span>
                      <div>
                        <strong>Citizen (Civilian)</strong>
                        <span>Emergency reporting & evacuation routes</span>
                      </div>
                    </div>
                  </label>

                  <label className={`role-radio-card ${formData.role === ROLES.RESPONDER ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value={ROLES.RESPONDER}
                      checked={formData.role === ROLES.RESPONDER}
                      onChange={handleChange}
                    />
                    <div className="role-radio-content">
                      <span className="role-icon">🚑</span>
                      <div>
                        <strong>Emergency Responder</strong>
                        <span>NDRF / SDRF rescue operations & task updates</span>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="admin-lock-note">
                  <Info size={13} />
                  <span>
                    Note: Command Administrator roles are locked against self-registration per NDMA Protocol.
                  </span>
                </div>
              </div>

              {/* Responder-Specific Verification Fields */}
              {formData.role === ROLES.RESPONDER && (
                <div className="responder-credentials-box animate-slide-down">
                  <div className="auth-input-group">
                    <label>
                      <Radio size={14} /> Service Unit / Battalion
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      placeholder="e.g. NDRF 8th Battalion (Team Alpha)"
                      className="auth-input"
                    />
                  </div>
                  <div className="auth-input-group">
                    <label>
                      <Lock size={14} /> Official Badge / ID Number
                    </label>
                    <input
                      type="text"
                      name="badgeId"
                      value={formData.badgeId}
                      onChange={handleChange}
                      placeholder="e.g. NDRF-ALPHA-04"
                      className="auth-input"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email Address */}
          <div className="auth-input-group">
            <label>
              <Mail size={14} /> Registered Official Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. admin@rakshasetu.gov.in"
              className="auth-input"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <label>
              <Lock size={14} /> Password
            </label>
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="auth-input"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register mode only) */}
          {mode === 'register' && (
            <div className="auth-input-group">
              <label>
                <CheckCircle2 size={14} /> Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="auth-input"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn-submit-auth" disabled={submitting}>
            {submitting ? (
              <span>Authenticating Cryptographic Credentials...</span>
            ) : mode === 'login' ? (
              <>
                <span>Sign In to Raksha-Setu Console</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Create Verified {formData.role} Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="auth-security-footer">
          <div className="security-shield-line">
            <Shield size={14} className="shield-blue" />
            <span>256–BIT ENCRYPTED • PBKDF2 HASHED • JWT AUTHORIZATION</span>
          </div>
          <p className="ndma-disclaimer">
            National Disaster Management System (NDMA) & DDMA Incident Command Compliant.
            Access logs are monitored 24/7.
          </p>
        </div>
      </div>
    </div>
  );
}
