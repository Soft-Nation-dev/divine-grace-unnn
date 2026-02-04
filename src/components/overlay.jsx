// src/components/LoadingOverlay.jsx
import React from 'react';
import '../images/css/overlay.css';
import ChurchLogo from '/logo.png';

export default function LoadingOverlay({ text }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <img src={ChurchLogo} alt="Church Logo" className="loading-logo" />
      {text && <p style={{ color: "#fff", marginTop: 10 }}>{text}</p>}
      </div>
    </div>
  );
}
