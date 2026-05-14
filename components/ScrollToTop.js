'use client';

import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the top scroll position
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className="scroll-to-top">
      {isVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
            animation: 'fadeInUp 0.3s ease-out'
          }}
          className="scroll-btn-hover"
        >
          <i className="fas fa-arrow-up" style={{ fontSize: '1.2rem' }}></i>
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scroll-btn-hover:hover {
          background-color: var(--intel-blue) !important;
          transform: translateY(-5px) !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4) !important;
        }
        @media (max-width: 768px) {
          .scroll-to-top button {
            bottom: 1.5rem !important;
            right: 1.5rem !important;
            width: 3rem !important;
            height: 3rem !important;
          }
        }
      `}} />
    </div>
  );
}
