'use client';

import { useState, useEffect } from 'react';

export default function NavbarActions() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const storedTheme = localStorage.getItem('medsense_theme');
    if (storedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('medsense_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('medsense_theme', 'light');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      }
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div className="search-box">
        <input 
          type="text" 
          placeholder="Search news..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <button className="search-btn" onClick={handleSearch} aria-label="Search">
          <i className="fas fa-search"></i>
        </button>
      </div>
      <button 
        className="icon-btn mobile-search-btn" 
        onClick={() => {
          const q = prompt("Search MedSense News:");
          if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
        }}
        aria-label="Search"
      >
        <i className="fas fa-search"></i>
      </button>
      <button 
        onClick={toggleTheme} 
        className="icon-btn theme-toggle-btn" 
        aria-label="Toggle theme"
        style={{ 
          background: 'none', 
          border: 'none', 
          fontSize: '1.2rem', 
          color: 'var(--text)', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}
      >
        <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
      </button>

    </div>
  );
}
