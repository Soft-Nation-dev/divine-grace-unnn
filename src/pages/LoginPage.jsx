import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../images/css/loginpage.css';
import LoadingOverlay from '../components/overlay';
import { API_ENDPOINTS, setAuthToken, API_BASE_URL } from '../config/api';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const migrationMode = true;

  const initialIsSignup = location?.state?.initialTab === 'register';
  const [isSignup, setIsSignup] = useState(initialIsSignup);
  const [Title, setTitle] = useState('');
  const [FullName, setFullName] = useState('');
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [ConfirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPointer, setShowPointer] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1=email, 2=code, 3=new pass
  const [resetCode, setResetCode] = useState('');
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    if (location?.state?.initialTab === 'register') setIsSignup(true);
    if (location?.state?.initialTab === 'login') setIsSignup(false);
  }, [location?.state?.initialTab]);

  useEffect(() => {
    if (migrationMode) {
      setForgotMode(true);
      setIsSignup(false);
    }
  }, [migrationMode]);

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
      throw new Error(
        (data && (data.error || data.message)) ||
        raw || 
        `Server error (${res.status})`
      );
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
      setError(err.message);
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
      const res = await safeFetch(
        `${API_BASE_URL}/api/auth/forgot-password`,
        { email: Email.trim() }
      );

      if (!res?.success && res?.error) throw new Error(res.error);

      setResetStep(2);
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
      setResetStep(3);
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

      setError('✅ Password updated! Please log in.');
      setForgotMode(false);
      setResetStep(1);
      setResetSuccess('');
      return;
    }
  } catch (err) {
    console.error("❌ ERROR CAUGHT:", err);
    setError(err.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
};


  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
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
        {!forgotMode && !migrationMode && (
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
          {forgotMode || migrationMode
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
          {(forgotMode || migrationMode) && (
            <>
              {resetStep === 1 && (
                <p className="error-text" style={{ color: '#fff' }}>
                  We updated our systems, please click the button below to reset your password.
                </p>
              )}

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

              {resetSuccess && <p className="error-text" style={{ color: '#7CFF9B' }}>{resetSuccess}</p>}
              {error && <p className="error-text">{error}</p>}

              <button className="signin-up-butt" type="submit">
                {resetStep === 1
                  ? 'Send Code'
                  : resetStep === 2
                  ? 'Verify Code'
                  : 'Reset Password'}
              </button>

              {!migrationMode && (
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
              )}
            </>
          )}

          {/* --------------- NORMAL LOGIN/SIGNUP UI --------------- */}
          {!forgotMode && !migrationMode && (
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
    </div>
  );
}
