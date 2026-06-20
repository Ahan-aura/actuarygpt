import React, { useState } from 'react';
import { Shield, AlertTriangle, Users, UserCheck } from 'lucide-react';

export default function Login({ API_BASE, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState("customer");
  const [passkeyInput, setPasskeyInput] = useState("");
  const [authError, setAuthError] = useState(null);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
    const payload = isRegisterMode 
      ? { username: usernameInput, password: passwordInput, role: roleInput, passkey: passkeyInput }
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

  const saveLogin = (loginData) => {
    const loggedInUser = {
      name: loginData.username,
      role: loginData.role
    };
    onLoginSuccess(loggedInUser);
    setUsernameInput("");
    setPasswordInput("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Shield size={44} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' }} />
          <h2>ActuaryGPT</h2>
          <p>Access the AI-powered Actuarial and Automated Underwriting Portal</p>
        </div>

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
          </div>

          {isRegisterMode && roleInput === 'officer' && (
            <div className="form-group animate-fade-in">
              <label>Officer Security Passkey</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Required secure officer passkey..." 
                value={passkeyInput} 
                onChange={(e) => setPasskeyInput(e.target.value)} 
                required 
              />
            </div>
          )}

          {!isRegisterMode && (
            <div className="form-group">
              <label>Officer Passkey <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Only required for Actuary Officers)</span></label>
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
      </div>
    </div>
  );
}
