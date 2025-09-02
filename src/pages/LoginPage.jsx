import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/loginpage.css';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSignup && password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    console.log('Submitted:', { username, password });
    navigate('/dashboard');
  };

  return (
    <div className="login-bg">
      <div className="glass-form">
    <div className="toggle-buttons">
        <button
          className={!isSignup ? 'active' : ''}
          onClick={() => setIsSignup(false)}
        >
          Sign in
        </button>
        <button
          className={isSignup ? 'active' : ''}
          onClick={() => setIsSignup(true)}
        >
          Sign up
        </button>
      </div>


        <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isSignup && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          <button className='signin-up-butt' type="submit">{isSignup ? 'Sign Up' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}
