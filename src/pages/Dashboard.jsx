import React from 'react';
import '../css/homepage.css';
import Header from '../components/header';

export default function Homepage() {
  return (
    <section className="homepage-section">
      <Header />
      <section className='hero-section'>
        <h1>Welcome to Divine Grace Unn</h1>
      <p>This is the homepage of our application.</p>
      </section>
    </section>
  );
}