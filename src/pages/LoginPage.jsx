import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/loginpage.css';
import LoadingOverlay from '../components/overlay';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [Title, setTitle] = useState('');
  const [FullName, setFullName] = useState('');
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [ConfirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPointer, setShowPointer] = useState(false); // 👈 new state

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignup && Password !== ConfirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const url = isSignup
        ? "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/register"
        : "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/login";

      let body;
      if (isSignup) {
        body = { Title, Email, FullName, Password, ConfirmPassword };
      } else {
        body = { Email, Password };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Something went wrong");
      }

      const data = await res.json();

      if (!isSignup && data.token) {
        sessionStorage.setItem("authToken", data.token);
        navigate("/dashboard");
      } else {
        setError("✅ Signup successful! Please input your details to login.");
        setShowPointer(true);
        setIsSignup(false); 
      }

    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError("Network error: Please check your internet connection.");
      }else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="login-bg">
      {loading && (
        <LoadingOverlay text={isSignup ? "Signing up..." : "Logging in..."} />
      )}

      <div className="glass-form">
        <div className="toggle-buttons">
          <button
            className={!isSignup ? 'active' : ''}
            onClick={() => { setIsSignup(false); setError(''); }}
          >
            Sign in {showPointer && !isSignup}
          </button>
          <button
            className={isSignup ? 'active' : ''}
            onClick={() => { setIsSignup(true); setError(''); setShowPointer(false); }}
          >
            Sign up
          </button>
        </div>

        <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <select value={Title} onChange={handleInputChange(setTitle)} required>
                <option value="">Select Title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Master">Master</option>
                <option value="Miss">Miss</option>
                <option value="Doctor">Dr</option>
                <option value="Proffessor">Prof</option>
              </select>

              <input type="text" placeholder="Full Name" value={FullName} onChange={handleInputChange(setFullName)} required />
              <input type="email" placeholder="Email" value={Email} onChange={handleInputChange(setEmail)} required />
            </>
          )}

          {!isSignup && (
            <input type="email" placeholder="Email" value={Email} onChange={handleInputChange(setEmail)} required />
          )}

          <input type="password" placeholder="Password" value={Password} onChange={handleInputChange(setPassword)} required />

          {isSignup && (
            <input type="password" placeholder="Confirm Password" value={ConfirmPassword} onChange={handleInputChange(setConfirmPassword)} required />
          )}

          {error && <p className="error-text">{error}</p>}

          <button className='signin-up-butt' type="submit" disabled={loading}>
            {loading ? (isSignup ? "Signing up..." : "Logging in...") : (isSignup ? 'Sign Up' : 'Login')}
          </button>
        </form>
      </div>
    </div>
  );
}
