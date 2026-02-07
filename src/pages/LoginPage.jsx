import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../images/css/loginpage.css';
import LoadingOverlay from '../components/overlay';
import { API_ENDPOINTS, setAuthToken, API_BASE_URL } from '../config/api';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialIsSignup = location?.state?.initialTab === 'register';
  const [isSignup, setIsSignup] = useState(initialIsSignup);
  const [Title, setTitle] = useState('');
  const [FullName, setFullName] = useState('');
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [ConfirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [showPointer, setShowPointer] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1=email, 3=new pass
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [showNewPass1, setShowNewPass1] = useState(false);
  const [showNewPass2, setShowNewPass2] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');

  useEffect(() => {
    if (location?.state?.initialTab === 'register') setIsSignup(true);
    if (location?.state?.initialTab === 'login') setIsSignup(false);
  }, [location?.state?.initialTab]);

  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      setRecoveryToken(accessToken);
      setForgotMode(true);
      setResetStep(3);
      setResetSuccess('Set a new password to finish resetting your account.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (recoveryToken) return;
    const storedToken = sessionStorage.getItem('recoveryToken');
    if (!storedToken) return;

    setRecoveryToken(storedToken);
    setForgotMode(true);
    setResetStep(3);
    setResetSuccess('Set a new password to finish resetting your account.');
    sessionStorage.removeItem('recoveryToken');
  }, [recoveryToken]);

  useEffect(() => {
    const navError = location?.state?.error;
    const storedError = sessionStorage.getItem('lastAuthError');
    const message = navError || storedError;
    if (message) {
      setError(message);
      setShowPointer(false);
      sessionStorage.removeItem('lastAuthError');
    }
  }, [location?.state?.error]);


  const normalizeEmail = (value) => value.trim().toLowerCase();

 
  const safeFetch = async (url, body) => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await res.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.warn("⚠️ Response was NOT valid JSON.");
      data = null;
    }

    // If status is an error
    if (!res.ok) {
      const message =
        (data && (data.error || data.message)) ||
        raw ||
        `Server error (${res.status})`;
      const err = new Error(message);
      err.code = data?.code;
      err.status = res.status;
      throw err;
    }

    // If success but backend returned plain text
    if (!data) {
      return { success: true, message: raw };
    }

    // If success and JSON is valid
    return data;

  } catch (err) {
    console.error("🔥 safeFetch ERROR:", err);

    if (err.message === 'Failed to fetch') {
      throw new Error('Network error: Please check your connection.');
    }

    throw err;
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoginSuccess('');
    setShowMigrationModal(false);

    if (forgotMode) return handleForgotFlow();

    if (isSignup && Password !== ConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const url = isSignup
        ? `${API_BASE_URL}${API_ENDPOINTS.SIGNUP}`
        : `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`;

      const normalizedEmail = normalizeEmail(Email);

      const body = isSignup
        ? { title: Title, email: normalizedEmail, full_name: FullName, password: Password }
        : { email: normalizedEmail, password: Password };

      const data = await safeFetch(url, body);

      if (!isSignup) {
        const token = data?.token || data?.session?.access_token || data?.access_token;
        if (token) {
          setAuthToken(token);
          sessionStorage.setItem("authCheckSkipUntil", String(Date.now() + 20000));
          navigate('/dashboard');
          return;
        }
        throw new Error(data?.error || data?.message || 'Login failed. Please try again.');
      }

      setError('✅ Signup successful! Please log in.');
      setShowPointer(true);
      setIsSignup(false);

    } catch (err) {
      if (err.code === 'MIGRATION_RESET_REQUIRED') {
        setShowMigrationModal(true);
        setForgotMode(false);
        setResetStep(1);
        setError('');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const sendResetCode = async (email) => {
  const res = await safeFetch(
    `${API_BASE_URL}/api/auth/forgot-password`,
    { email: normalizeEmail(email) }
  );

  if (!res?.success && res?.error) throw new Error(res.error);

  setResetSuccess('Check your email for a password reset link.');
};

const handleMigrationReset = async () => {
  if (!Email.trim()) {
    setError('Please enter your email first.');
    return;
  }

  setLoading(true);
  setError('');
  setResetSuccess('');

  try {
    await sendResetCode(Email);
    setForgotMode(true);
    setShowMigrationModal(false);
  } catch (err) {
    setError(err.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
};

const handleForgotFlow = async () => {
  setLoading(true);
  setError('');
  setResetSuccess('');

  try {
    if (resetStep === 1) {
      await sendResetCode(Email);
      return;
    }

    // STEP 3 — RESET PASSWORD
    if (resetStep === 3) {
      if (newPass1 !== newPass2) {
        throw new Error('Passwords do not match.');
      }

      if (newPass1.trim().length < 12) {
        throw new Error('Password must be at least 12 characters.');
      }

      if (!recoveryToken) {
        throw new Error('Use the reset link from your email to set a new password.');
      }

      const res = await safeFetch(
        `${API_BASE_URL}/api/auth/recover-password`,
        {
          access_token: recoveryToken,
          newPassword: newPass1,
          confirmPassword: newPass2,
        }
      );

      if (!res?.success && res?.error) throw new Error(res.error);

      setLoginSuccess('Password updated. Please log in.');
      setForgotMode(false);
      setResetStep(1);
      setResetSuccess('');
      setRecoveryToken('');
      setIsSignup(false);
      return;
    }
  } catch (err) {
    console.error("❌ ERROR CAUGHT:", err);
    const message = err.message || 'Something went wrong.';
    setError(message);
  } finally {
    setLoading(false);
  }
};


  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
    if (loginSuccess) setLoginSuccess('');
  };

  // --------------------------
  // UI
  // --------------------------
  return (
    <div className="login-bg">
      {loading && (
        <LoadingOverlay
          text={
            forgotMode
              ? 'Processing...'
              : isSignup
              ? 'Signing up...'
              : 'Logging in...'
          }
        />
      )}

      <div className="glass-form">

        {/* Hide toggle if in forgot mode */}
        {!forgotMode && (
          <div className="toggle-buttons">
            <button
              className={!isSignup ? 'active' : ''}
              onClick={() => { setIsSignup(false); setError(''); }}
            >
              Sign in {showPointer && !isSignup && <span className="pointer">👈</span>}
            </button>

            <button
              className={isSignup ? 'active' : ''}
              onClick={() => {
                setIsSignup(true);
                setShowPointer(false);
                setError('');
              }}
            >
              Sign up
            </button>
          </div>
        )}

        <h2>
          {forgotMode
            ? resetStep === 1
              ? 'Reset Password'
              : 'Create New Password'
            : isSignup
            ? 'Create Account'
            : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit}>

          {/* --------------- FORGOT PASSWORD UI --------------- */}
          {forgotMode && (
            <>
              {resetStep === 1 && (
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={Email}
                  onChange={handleInputChange(setEmail)}
                  required
                />
              )}


              {resetStep === 3 && (
                <>
                  <div className="password-field">
                    <input
                      className="password-input"
                      type={showNewPass1 ? 'text' : 'password'}
                      placeholder="New password"
                      value={newPass1}
                      onChange={handleInputChange(setNewPass1)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={showNewPass1 ? 'Hide password' : 'Show password'}
                      aria-pressed={showNewPass1}
                      onClick={() => setShowNewPass1((prev) => !prev)}
                    >
                      <span className="password-toggle__icon" aria-hidden="true"></span>
                    </button>
                  </div>
                  <div className="password-field">
                    <input
                      className="password-input"
                      type={showNewPass2 ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={newPass2}
                      onChange={handleInputChange(setNewPass2)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={showNewPass2 ? 'Hide password' : 'Show password'}
                      aria-pressed={showNewPass2}
                      onClick={() => setShowNewPass2((prev) => !prev)}
                    >
                      <span className="password-toggle__icon" aria-hidden="true"></span>
                    </button>
                  </div>
                </>
              )}

              {resetSuccess && <p className="success-text">{resetSuccess}</p>}
              {error && <p className="error-text">{error}</p>}

              <button className="signin-up-butt" type="submit">
                {resetStep === 1
                  ? 'Send Reset Link'
                  : 'Set New Password'}
              </button>

              <p
                style={{ marginTop: '10px', cursor: 'pointer', color: '#fff' }}
                onClick={() => {
                  setForgotMode(false);
                  setResetStep(1);
                  setError('');
                }}
              >
                Back to Login
              </p>
            </>
          )}

          {/* --------------- NORMAL LOGIN/SIGNUP UI --------------- */}
          {!forgotMode && (
            <>
              {isSignup && (
                <>
                  <select value={Title} onChange={handleInputChange(setTitle)} required>
                    <option value="">Select Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Master">Master</option>
                    <option value="Miss">Miss</option>
                    <option value="Doctor">Dr</option>
                    <option value="Professor">Prof</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Full Name"
                    value={FullName}
                    onChange={handleInputChange(setFullName)}
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={Email}
                    onChange={handleInputChange(setEmail)}
                    required
                  />
                </>
              )}

              {!isSignup && (
                <input
                  type="email"
                  placeholder="Email"
                  value={Email}
                  onChange={handleInputChange(setEmail)}
                  required
                />
              )}

              <div className="password-field">
                <input
                  className="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={Password}
                  onChange={handleInputChange(setPassword)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <span className="password-toggle__icon" aria-hidden="true"></span>
                </button>
              </div>

              {isSignup && (
                <div className="password-field">
                  <input
                    className="password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={ConfirmPassword}
                    onChange={handleInputChange(setConfirmPassword)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <span className="password-toggle__icon" aria-hidden="true"></span>
                  </button>
                </div>
              )}

              {loginSuccess && <p className="success-text">{loginSuccess}</p>}
              {error && <p className="error-text">{error}</p>}

              <button className="signin-up-butt" type="submit">
                {isSignup ? 'Sign Up' : 'Login'}
              </button>

              {!isSignup && (
                <p
                  style={{ marginTop: '10px', cursor: 'pointer', color: '#fff' }}
                  onClick={() => {
                    setForgotMode(true);
                    setResetStep(1);
                    setError('');
                  }}
                >
                  Forgot Password?
                </p>
              )}
            </>
          )}

        </form>
      </div>
      {showMigrationModal && (
        <div className="migration-modal">
          <div className="migration-modal__content">
            <p className="migration-modal__text">
              We updated our systems, please click the button below to reset your password.
            </p>
            <div className="migration-modal__actions">
              <button
                className="signin-up-butt"
                type="button"
                onClick={handleMigrationReset}
              >
                Reset Password
              </button>
              <button
                className="modal-close"
                type="button"
                onClick={() => setShowMigrationModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
