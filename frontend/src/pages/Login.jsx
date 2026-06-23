import React, { useState } from 'react';
import { Shield, AlertTriangle, Users, UserCheck } from 'lucide-react';

export default function Login({ API_BASE, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState("customer");
  const [passkeyInput, setPasskeyInput] = useState("");
  const [recoveryHintInput, setRecoveryHintInput] = useState("");
  const [authError, setAuthError] = useState(null);

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState("");
  const [recoveredHint, setRecoveredHint] = useState("");
  const [recoveredPassword, setRecoveredPassword] = useState("");
  const [forgotStatus, setForgotStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'
  const [forgotError, setForgotError] = useState(null);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
    const payload = isRegisterMode 
      ? { username: usernameInput, password: passwordInput, role: roleInput, passkey: passkeyInput, recovery_hint: recoveryHintInput || null }
      : { username: usernameInput, password: passwordInput, passkey: passkeyInput };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication request failed.");
      }

      if (isRegisterMode) {
        setIsRegisterMode(false);
        // Auto-login after registration
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameInput, password: passwordInput, passkey: passkeyInput })
        });
        const loginData = await loginResponse.json();
        saveLogin(loginData);
      } else {
        const loginData = await response.json();
        saveLogin(loginData);
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.message);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotStatus("loading");

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Recovery request failed.");
      }

      const data = await response.json();
      setRecoveredHint(data.recovery_hint);
      setRecoveredPassword(data.password);
      setForgotStatus("success");
    } catch (err) {
      console.error(err);
      setForgotError(err.message);
      setForgotStatus("error");
    }
  };

  const saveLogin = (loginData) => {
    const loggedInUser = {
      name: loginData.username,
      role: loginData.role
    };
    onLoginSuccess(loggedInUser);
    setUsernameInput("");
    setPasswordInput("");
    setRecoveryHintInput("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Shield size={44} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' }} />
          <h2>{isForgotMode ? "Recover Password" : "ActuaryGPT"}</h2>
          <p>
            {isForgotMode 
              ? "Retrieve your credentials using your account recovery hint" 
              : "Access the AI-powered Actuarial and Automated Underwriting Portal"}
          </p>
        </div>

        {!isForgotMode && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(99, 102, 241, 0.04)', border: '1px dashed var(--primary)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '0.25rem' }}>Demo Credentials:</div>
            <p style={{ margin: '0.2rem 0' }}>• Customer: <b style={{ color: 'var(--primary)' }}>customer1</b> / <b>password123</b></p>
            <p style={{ margin: '0.2rem 0' }}>• Officer: <b style={{ color: 'var(--secondary)' }}>actuary1</b> / <b>password123</b> <span style={{ opacity: 0.8 }}>(Passkey: <b style={{ color: 'var(--risk-medium)' }}>ACTUARY_SECURE_2026</b>)</span></p>
          </div>
        )}

        {isForgotMode ? (
          <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {forgotStatus === 'success' ? (
              <>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: 'rgba(99, 102, 241, 0.06)', 
                  border: '1px solid rgba(99, 102, 241, 0.25)', 
                  borderRadius: '8px', 
                  fontSize: '0.9rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem',
                  lineHeight: '1.5'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                    Account Recovery Success
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Your Recovery Hint:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{recoveredHint}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Your Password:</span>
                    <span style={{ color: 'var(--secondary)', letterSpacing: '0.5px', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.25rem' }}>
                      {recoveredPassword}
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => {
                    setIsForgotMode(false);
                    setForgotUsername("");
                    setForgotStatus("idle");
                    // Auto-fill retrieved user
                    setUsernameInput(forgotUsername);
                  }}
                >
                  Back to Sign In
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter username to retrieve details..." 
                    value={forgotUsername} 
                    onChange={(e) => setForgotUsername(e.target.value)} 
                    required 
                  />
                </div>

                {forgotError && (
                  <div style={{ color: 'var(--risk-high)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle size={14} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={forgotStatus === 'loading'}>
                  {forgotStatus === 'loading' ? "Searching..." : "Retrieve Password & Hint"}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    onClick={() => {
                      setIsForgotMode(false);
                      setForgotError(null);
                      setForgotStatus('idle');
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter your username..." 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                  onClick={() => {
                    setIsForgotMode(true);
                    setForgotUsername(usernameInput);
                    setForgotError(null);
                    setForgotStatus('idle');
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                required 
              />
            </div>

            {isRegisterMode && (
              <div className="form-group animate-fade-in">
                <label>Security Recovery Hint <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. My first pet's name, or favorite color" 
                  value={recoveryHintInput} 
                  onChange={(e) => setRecoveryHintInput(e.target.value)} 
                />
              </div>
            )}

            {isRegisterMode && roleInput === 'officer' && (
              <div className="form-group animate-fade-in">
                <label>Officer Security Passkey <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Use: ACTUARY_SECURE_2026)</span></label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="ACTUARY_SECURE_2026" 
                  value={passkeyInput} 
                  onChange={(e) => setPasskeyInput(e.target.value)} 
                  required 
                />
              </div>
            )}

            {!isRegisterMode && (
              <div className="form-group">
                <label>Officer Passkey <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Only required for Actuary Officers. Use: ACTUARY_SECURE_2026)</span></label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter passkey if logging in as Actuary..." 
                  value={passkeyInput} 
                  onChange={(e) => setPasskeyInput(e.target.value)} 
                />
              </div>
            )}

            {isRegisterMode && (
              <div className="role-selector">
                <label>Choose Account Type</label>
                <div className="role-options">
                  <div 
                    className={`role-option-card ${roleInput === 'customer' ? 'active' : ''}`}
                    onClick={() => {
                      setRoleInput('customer');
                      setPasskeyInput("");
                    }}
                  >
                    <Users size={20} style={{ color: roleInput === 'customer' ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span className="role-title">Customer</span>
                    <span className="role-desc">Apply for Policies</span>
                  </div>

                  <div 
                    className={`role-option-card ${roleInput === 'officer' ? 'active' : ''}`}
                    onClick={() => setRoleInput('officer')}
                  >
                    <UserCheck size={20} style={{ color: roleInput === 'officer' ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span className="role-title">Underwriter</span>
                    <span className="role-desc">Actuary Officers</span>
                  </div>
                </div>
              </div>
            )}

            {authError && (
              <div style={{ color: 'var(--risk-high)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={14} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {isRegisterMode ? "Create Account & Sign In" : "Sign In to Portal"}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isRegisterMode ? "Already have an account?" : "Need a new account?"}
              </span>{" "}
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError(null);
                  setPasskeyInput("");
                }}
              >
                {isRegisterMode ? "Sign In instead" : "Register a new user"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
