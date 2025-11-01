// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

// --- SVGs for Register Page ---
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <circle cx="12" cy="16" r="1" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RegisterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
  </svg>
);

const NoteLogo = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
// --- End of SVGs ---


const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // --- ADDED ---
  const [confirmPassword, setConfirmPassword] = useState('');
  // --- END ADDED ---
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- UPDATED: Add validation check ---
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return; // Stop the submission
    }
    // --- END UPDATED ---

    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      await registerUser({ username, password });
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Floating visuals */}
      <div className="floating-shapes" aria-hidden>
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
        <div className="shape shape-4" />
        <div className="shape shape-5" />
        <div className="shape shape-6" />
      </div>
      <div className="particles" aria-hidden>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      <div className="auth-split-container">
        <section className="auth-left" aria-label="Marketing">
          <div className="main-logo" aria-hidden>
            <NoteLogo />
          </div>
          <h1 className="logo-title">Modern Notepad</h1>
          <p className="logo-subtitle">Secure note-taking made simple</p>

          <ul className="feature-list" aria-hidden>
            <li className="feature-item">
              <span className="feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <span>Auto-save your notes</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                </svg>
              </span>
              <span>Sync across devices</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span>End-to-end encryption</span>
            </li>
          </ul>
        </section>

        <main className="auth-right" aria-label="Register form">
          {/* This wrapper div centers and nudges the content */}
          <div className="auth-right-content">
            <div className="login-header">
              <h2 className="login-title">Create Account</h2>
              <p className="login-subtitle">Get started in seconds</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden>
                    <UserIcon />
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden>
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a strong password"
                    required
                  />
                </div>
              </div>

              {/* --- ADDED: Confirm Password Field --- */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden>
                    <LockIcon />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
              {/* --- END ADDED --- */}


              {error && <div className="error-message" role="alert">{error}</div>}
              {message && <div className="success-message" role="alert">{message}</div>}

              <button type="submit" className="btn" disabled={isLoading} aria-disabled={isLoading}>
                {isLoading ? 'Creating Account...' : (
                  <>
                    <RegisterIcon />
                    <span>Sign Up</span>
                  </>
                )}
              </button>
            </form>

            <p className="auth-link">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;