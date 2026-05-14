'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('medsense_consent');
    if (!hasAccepted) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptConsent = () => {
    localStorage.setItem('medsense_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-wrapper">
      <div className="cookie-consent-card">
        <div className="cookie-content">
          <i className="fas fa-shield-alt" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
          <p>
            By using MedSense News, you agree to our 
            <Link href="/privacy"> Privacy Policy</Link> and 
            <Link href="/terms"> Terms of Service</Link>.
          </p>
        </div>
        <button onClick={acceptConsent} className="accept-btn">
          Accept
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .cookie-consent-wrapper {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          width: 90%;
          max-width: 500px;
          animation: slideUpFade 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cookie-consent-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .cookie-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .cookie-content p {
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
          color: var(--text);
        }
        .cookie-content a {
          color: var(--primary);
          text-decoration: underline;
          font-weight: 600;
        }
        .accept-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .accept-btn:hover {
          opacity: 0.9;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @media (max-width: 600px) {
          .cookie-consent-card {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
          .cookie-content {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}} />
    </div>
  );
}
