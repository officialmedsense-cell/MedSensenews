'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTION_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Trending', href: '/trending', accent: true },
  { label: 'Health', href: '/category/Health' },
  { label: 'Medicine', href: '/category/Medicine' },
  { label: 'Research', href: '/category/Research' },
  { label: 'Global Health', href: '/category/Global%20Health' },
  { label: 'Public Health', href: '/category/Public%20Health' },
  { label: 'Technology', href: '/category/Technology' },
  { label: 'Weather', href: '/category/Weather' },
  { label: 'Health Alerts', href: '/category/Health%20Alerts' },
  { label: 'Nigeria & Africa Health', href: '/category/Nigeria%2FAfrica%20Health' },
];

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
          backdrop-filter: none;
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
          left: -100%;
          width: min(100vw, 360px);
          height: 100%;
          background-color: var(--bg);
          z-index: 10001;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 1.25rem 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: none;
          border-right: 1px solid var(--border);
        }
        [data-theme="dark"] .mobile-drawer {
          background-color: var(--bg);
          border-right: 1px solid var(--border);
        }
        .mobile-drawer.active {
          left: 0;
        }
        .mobile-menu-links {
          display: flex;
          flex-direction: column;
        }
        .mobile-menu-links a {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          color: var(--text);
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .mobile-menu-links a:hover {
          color: var(--primary);
        }
        .mobile-menu-links a.active {
          color: var(--primary);
        }
        .mobile-menu-links a .menu-arrow {
          color: var(--primary);
          font-size: 0.75rem;
        }
        .mobile-menu-footer {
          margin-top: auto;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
        }
        .mobile-menu-footer .social-links {
          justify-content: flex-start;
          gap: 0.75rem;
        }
      `}} />

      {/* Dark Overlay */}
      <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={toggle} />

      {/* Slide-out Drawer */}
      <div className={`mobile-drawer ${isOpen ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
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
                opacity: 0.8,
                padding: 0
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
              borderRadius: '0px', 
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

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div className="mobile-menu-links">
            {SECTION_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={toggle}
                className={item.accent ? 'active' : ''}
              >
                <span>{item.label}</span>
                <i className="fas fa-chevron-right menu-arrow"></i>
              </Link>
            ))}
          </div>
        </nav>

        <div className="mobile-menu-footer">
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
