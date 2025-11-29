import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    setTimeout(() => {
      navigate('/');
      window.location.reload(); // refresh to show logged-out state cleanly
    }, 300);
  };

  return (
    <header>
      <h1>FYP Stocks</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>

        {loggedIn ? (
          /* use the same visual class as links so it lines up perfectly */
          <button
            type="button"
            className="header-link"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <a href="/auth" className="header-link">Login / Sign Up</a>
        )}
      </nav>
    </header>
  );
}
