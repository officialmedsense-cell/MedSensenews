'use client';

import { useState, useEffect, useRef } from 'react';

export default function SmartHeader({ children, isOuterHeader = false }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const lockUntil = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      
      // Hysteresis threshold to prevent scroll shaking (jitter)
      setIsScrolled(prev => {
        if (prev) {
          return currentScrollY > 80;
        } else {
          return currentScrollY > 180;
        }
      });

      // If we are in the lockout period, ignore visibility toggle
      if (now < lockUntil.current) return;
      
      // Always show at the very top (aligned with hysteresis bottom threshold)
      if (currentScrollY < 100) {
        if (!isVisible) setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // Use a very high 60px threshold to confirm intent and stop jitter
      if (Math.abs(diff) > 60) {
        if (diff > 0 && isVisible) {
          setIsVisible(false);
          lockUntil.current = Date.now() + 400; // Lock state for 400ms
        } else if (diff < 0 && !isVisible) {
          setIsVisible(true);
          lockUntil.current = Date.now() + 400; // Lock state for 400ms
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  if (isOuterHeader) {
    return (
      <header 
        className={`main-header ${isVisible ? 'header-visible' : 'header-hidden'} ${isScrolled ? 'is-scrolled' : ''}`}
        style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--bg)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
      >
        {children}
      </header>
    );
  }

  return (
    <>
      <div className={`smart-header-wrapper ${isVisible ? 'smart-header-visible' : 'smart-header-hidden'} ${isScrolled ? 'is-scrolled' : ''}`}>
        {children}
      </div>
    </>
  );
}
