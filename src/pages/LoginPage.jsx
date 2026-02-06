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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [showPointer, setShowPointer] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1=email, 2=code, 3=new pass
  const [resetCode, setResetCode] = useState('');
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (location?.state?.initialTab === 'register') setIsSignup(true);
    if (location?.state?.initialTab === 'login') setIsSignup(false);
  }, [location?.state?.initialTab]);

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

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSeconds]);

 
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

      const body = isSignup
        ? { title: Title, email: Email, full_name: FullName, password: Password }
        : { email: Email, password: Password };

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
    { email: email.trim() }
  );

  if (!res?.success && res?.error) throw new Error(res.error);

  setResetStep(2);
  setResendSeconds(60);
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

    // STEP 2 — VERIFY CODE
    if (resetStep === 2) {
      if (resetCode.trim().length !== 6) {
        throw new Error('Code must be exactly 6 digits.');
      }

      const res = await safeFetch(
        `${API_BASE_URL}/api/auth/verify-reset-code`,
        { email: Email.trim(), code: resetCode.trim() }
      );

      if (!res?.success && res?.error) throw new Error(res.error);

      setResetSuccess('Code verified. You can set a new password now.');
      setTimeout(() => {
        setResetSuccess('');
        setResetStep(3);
      }, 1500);
      return;
    }

    // STEP 3 — RESET PASSWORD
    if (resetStep === 3) {
      if (newPass1 !== newPass2) {
        throw new Error('Passwords do not match.');
      }

      const res = await safeFetch(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          email: Email.trim(),
          newPassword: newPass1,
          confirmPassword: newPass2,
        }
      );

      if (!res?.success && res?.error) throw new Error(res.error);

      setLoginSuccess('Password updated. Please log in.');
      setForgotMode(false);
      setResetStep(1);
      setResetSuccess('');
      setIsSignup(false);
      return;
    }
  } catch (err) {
    console.error("❌ ERROR CAUGHT:", err);
    const message = err.message || 'Something went wrong.';
    if (message.toLowerCase().includes('invalid code')) {
      setError('That code looks wrong. Please confirm and try again.');
    } else if (message.toLowerCase().includes('expired')) {
      setError('Code expired. Please request a new code.');
    } else {
      setError(message);
    }
  } finally {
    setLoading(false);
  }
};


  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
    if (loginSuccess) setLoginSuccess('');
  };

  const formatSeconds = (totalSeconds) => {
    const seconds = Math.max(totalSeconds, 0);
    return `00:${String(seconds).padStart(2, '0')}`;
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
              : resetStep === 2
              ? 'Verify Code'
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

              {resetStep === 2 && (
                <>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={resetCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setResetCode(val);
                      if (error) setError('');
                    }}
                    required
                  />
                  <div className="resend-row">
                    <button
                      type="button"
                      className="resend-button"
                      onClick={() => sendResetCode(Email)}
                      disabled={resendSeconds > 0}
                    >
                      Resend Code
                    </button>
                    {resendSeconds > 0 && (
                      <span className="resend-timer">Resend in {formatSeconds(resendSeconds)}</span>
                    )}
                  </div>
                </>
              )}

              {resetStep === 3 && (
                <>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPass1}
                    onChange={handleInputChange(setNewPass1)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={newPass2}
                    onChange={handleInputChange(setNewPass2)}
                    required
                  />
                </>
              )}

              {resetSuccess && <p className="success-text">{resetSuccess}</p>}
              {error && <p className="error-text">{error}</p>}

              <button className="signin-up-butt" type="submit">
                {resetStep === 1
                  ? 'Send Code'
                  : resetStep === 2
                  ? 'Verify Code'
                  : 'Reset Password'}
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

              <input
                type="password"
                placeholder="Password"
                value={Password}
                onChange={handleInputChange(setPassword)}
                required
              />

              {isSignup && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={ConfirmPassword}
                  onChange={handleInputChange(setConfirmPassword)}
                  required
                />
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
