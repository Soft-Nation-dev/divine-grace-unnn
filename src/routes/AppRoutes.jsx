import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import Homepage from '../pages/Dashboard';
import Messages from '../pages/messages';
import RegisterForLsts from '../pages/registerforlsts';
import SubmitPrayerRequest from '../pages/submitaprayerrequest';
import LeadershipSurmit from '../pages/leadershipsurmit';
import About from '../pages/about';
import Contact from '../pages/contact';
import Admin from '../pages/admin';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Homepage />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/registerforlsts" element={<RegisterForLsts />} />
      <Route path="/submitaprayerrequest" element={<SubmitPrayerRequest />} />
      <Route path="/leadershipsurmit" element={<LeadershipSurmit />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
