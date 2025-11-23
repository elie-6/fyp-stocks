import React from 'react';
import Header from '../components/Header';
import './About.css';

export default function About() {
  return (
    <div>
      <Header />

      <section className="about-page">
        <div className="about-container">
          <h1 className="about-title">About Rogue</h1>

          <p className="about-intro">
            Rogue is more than a platform. It's where modern algorithmic power meets precision insights. 
            We blend data-driven market analysis with a vibe that feels both local and global.
          </p>

          <p className="about-content">
            Our mission is to equip traders and enthusiasts with the tools they need to understand markets, 
            spot opportunities, and make informed decisions — all while embracing a lifestyle that values 
            creativity, style, and community.
          </p>

          <p className="about-content">
            Behind every ticker, every trend, and every score lies a dedication to clarity, simplicity, 
            and intelligence. We push boundaries, but never compromise on the essence: empowering you 
            to act with confidence.
          </p>

          <p className="about-content about-mystery">
            The potential is limitless. Markets evolve, culture evolves, and so do we. 
            What you see now is only the beginning.
          </p>

          {/* Disclaimer */}
          <p className="about-disclaimer">
            Disclaimer: Rogue provides market data and analytical tools for educational purposes only. 
            This is not financial advice. Users are responsible for their own investment decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
