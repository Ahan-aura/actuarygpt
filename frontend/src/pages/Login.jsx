import React, { useState } from 'react';
import { Shield, AlertTriangle, Users, UserCheck } from 'lucide-react';

export default function Login({ API_BASE, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState("customer");
  const [passkeyInput, setPasskeyInput] = useState("");
  const [recoveryHintInput, setRecoveryHintInput] = useState("What is your mother's maiden name?");
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState("");
  const [authError, setAuthError] = useState(null);

  // Forgot / Reset Password state
  const [forgotUsername, setForgotUsername] = useState("");
  const [recoveredHint, setRecoveredHint] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [forgotStatus, setForgotStatus] = useState("idle"); // 'idle', 'got_hint', 'success'
  const [forgotError, setForgotError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
    const payload = isRegisterMode 
      ? { 
          username: usernameInput, 
          password: passwordInput, 
          role: roleInput, 
          passkey: passkeyInput, 
          recovery_hint: recoveryHintInput || null, 
          recovery_answer: recoveryAnswerInput || null 
        }
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
        // Auto-login after registration
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameInput, password: passwordInput, passkey: passkeyInput })
        });
        if (!loginResponse.ok) {
          const errorData = await loginResponse.json();
          throw new Error(errorData.detail || "Auto-login failed after registration.");
        }
        const loginData = await loginResponse.json();
        setIsRegisterMode(false);
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
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Username search failed.");
      }

      const data = await response.json();
      setRecoveredHint(data.recovery_hint);
      setForgotStatus("got_hint");
    } catch (err) {
      console.error(err);
      setForgotError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: forgotUsername,
          recovery_answer: answerInput,
          new_password: newPasswordInput
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Reset request failed.");
      }

      setForgotStatus("success");
    } catch (err) {
      console.error(err);
      setForgotError(err.message);
    } finally {
      setIsSubmitting(false);
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
    setRecoveryHintInput("What is your mother's maiden name?");
    setRecoveryAnswerInput("");
  };

  const resetForgotFlow = () => {
    setIsForgotMode(false);
    setForgotUsername("");
    setRecoveredHint("");
    setAnswerInput("");
    setNewPasswordInput("");
    setForgotStatus("idle");
    setForgotError(null);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Shield size={44} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' }} />
          <h2>{isForgotMode ? "Reset Password" : "ActuaryGPT"}</h2>
          <p>
            {isForgotMode 
              ? "Recover access to your account using your security recovery hint" 
              : "Access the AI-powered Actuarial and Automated Underwriting Portal"}
          </p>
        </div>

        {isForgotMode ? (
          <div>
            {forgotStatus === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ 
                  padding: '1.25rem 1rem', 
                  backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  borderRadius: '8px', 
                  fontSize: '0.9rem', 
                  color: 'var(--text-main)', 
                  textAlign: 'center', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem' 
                }}>
                  <span style={{ fontWeight: 700, color: 'var(--risk-low)' }}>Password Reset Successful</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Your password has been successfully updated. You can now sign in using your new credentials.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => {
                    resetForgotFlow();
                    setUsernameInput(forgotUsername);
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : forgotStatus === 'got_hint' ? (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ 
                  padding: '0.85rem', 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-main)' 
                }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                    Security Recovery Question / Hint
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>{recoveredHint}</span>
                </div>

                <div className="form-group">
                  <label>Your Answer</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter the answer to the hint..." 
                    value={answerInput} 
                    onChange={(e) => setAnswerInput(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter your new password..." 
                    value={newPasswordInput} 
                    onChange={(e) => setNewPasswordInput(e.target.value)} 
                    required 
                  />
                </div>

                {forgotError && (
                  <div style={{ color: 'var(--risk-high)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle size={14} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Resetting..." : "Update Password"}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    onClick={() => setForgotStatus("idle")}
                  >
                    Back to Username Lookup
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Searching..." : "Retrieve Recovery Hint"}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    onClick={resetForgotFlow}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
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
              <label>Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                required 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
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
            </div>

            {isRegisterMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="animate-fade-in">
                <div className="form-group">
                  <label>Security Recovery Question <span style={{ fontSize: '0.75rem', color: 'var(--risk-high)' }}>*</span></label>
                  <select 
                    className="form-input" 
                    value={recoveryHintInput} 
                    onChange={(e) => setRecoveryHintInput(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '6px', height: '42px', padding: '0 0.75rem', width: '100%', fontSize: '0.9rem' }}
                    required
                  >
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                    <option value="In what city were you born?">In what city were you born?</option>
                    <option value="What was the name of your primary school?">What was the name of your primary school?</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Security Answer <span style={{ fontSize: '0.75rem', color: 'var(--risk-high)' }}>*</span></label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter the correct answer..." 
                    value={recoveryAnswerInput} 
                    onChange={(e) => setRecoveryAnswerInput(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            )}

            {isRegisterMode && roleInput === 'officer' && (
              <div className="form-group animate-fade-in">
                <label>Officer Security Passkey</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter officer security passkey..." 
                  value={passkeyInput} 
                  onChange={(e) => setPasskeyInput(e.target.value)} 
                  required 
                />
              </div>
            )}

            {!isRegisterMode && (
              <div className="form-group">
                <label>Officer Passkey</label>
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
