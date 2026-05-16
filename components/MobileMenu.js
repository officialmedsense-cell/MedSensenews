'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CATEGORIES = ['Research', 'Global Health', 'Public Health', 'Technology', 'Weather', 'Health Alerts', 'Nigeria/Africa Health'];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Check initial theme
    const storedTheme = localStorage.getItem('medsense_theme');
    if (storedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const themeStr = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeStr);
    localStorage.setItem('medsense_theme', themeStr);
  };

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    document.body.style.overflow = next ? 'hidden' : '';
  };

  const drawerContent = (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 10000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .drawer-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        .mobile-drawer {
          position: fixed;
          top: 0;
          left: -300px;
          width: 300px;
          height: 100%;
          background-color: #ffffff;
          z-index: 10001;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          box-shadow: 10px 0 30px rgba(0,0,0,0.2);
        }
        [data-theme="dark"] .mobile-drawer {
          background-color: #000000;
          border-right: 1px solid #333;
        }
        .mobile-drawer.active {
          left: 0;
        }
      `}} />

      {/* Dark Overlay */}
      <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={toggle} />

      {/* Slide-out Drawer */}
      <div className={`mobile-drawer ${isOpen ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>MEDSENSE</span>
            <button 
              onClick={toggleTheme} 
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '1.1rem', 
                color: 'inherit', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.8
              }}
              aria-label="Toggle theme"
            >
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </div>
          <button onClick={toggle} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'inherit', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Search Bar in Menu */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search news..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            style={{ 
              width: '100%', 
              padding: '0.6rem 1rem', 
              paddingRight: '2.5rem',
              borderRadius: '20px', 
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'inherit',
              fontSize: '0.9rem',
              outline: 'none'
            }} 
          />
          <i 
            className="fas fa-search" 
            onClick={() => searchQuery.trim() && (window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`)}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.9rem', cursor: 'pointer' }}
          ></i>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <Link href="/trending" onClick={toggle} style={{ textDecoration: 'none', color: '#ef4444', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-fire"></i> Trending
          </Link>
          <Link href="/" onClick={toggle} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: '1.1rem' }}>Home</Link>
          <Link href="/category/Health" onClick={toggle} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: '1.1rem' }}>Health</Link>
          <Link href="/category/Medicine" onClick={toggle} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: '1.1rem' }}>Medicine</Link>
          {CATEGORIES.map(cat => (
            <Link key={cat} href={`/category/${encodeURIComponent(cat)}`} onClick={toggle} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: '1.1rem' }}>
              {cat === 'Nigeria/Africa Health' ? 'Nigeria & Africa Health' : cat}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.3rem' }}>
            <a href="https://web.facebook.com/people/MedSense-News/61579693413492" target="_blank" rel="noopener" style={{ color: 'inherit' }}><i className="fab fa-facebook"></i></a>
            <a href="https://x.com/MedsenseN" target="_blank" rel="noopener" style={{ color: 'inherit' }}><i className="fab fa-twitter"></i></a>
            <a href="https://whatsapp.com/channel/0029Vb66g7lL7UVPoSLvlA1i" target="_blank" rel="noopener" style={{ color: 'inherit' }}><i className="fab fa-whatsapp"></i></a>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* The Hamburger Button */}
      <button 
        onClick={toggle}
        className="mobile-menu-btn"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none'
        }}
        aria-label="Toggle Menu"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      {mounted && typeof document !== 'undefined' && createPortal(drawerContent, document.body)}
    </>
  );
}
