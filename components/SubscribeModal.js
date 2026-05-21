'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import NewsletterForm from './NewsletterForm';

function ModalContent({ onClose }) {
  return createPortal(
    <div
      className="nl-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nl-modal-title"
    >
      <div className="nl-modal">
        <button
          className="nl-modal-close"
          onClick={onClose}
          aria-label="Close subscribe modal"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="nl-modal-header">
          <div className="nl-modal-icon">
            <i className="fas fa-newspaper"></i>
          </div>
          <h2 id="nl-modal-title">Stay in the Know</h2>
          <p>Get the latest health news, medical breakthroughs, and research updates delivered to your inbox — free.</p>
        </div>

        <div className="nl-modal-body">
          <NewsletterForm />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function SubscribeModal({ iconOnly = false }) {
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {iconOnly ? (
        /* Mobile: compact circular bell icon */
        <button
          className="icon-btn"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Subscribe to newsletter"
          id="subscribe-trigger-mobile"
          style={{
            background: 'var(--subscribe-bg, var(--primary))',
            color: 'white',
            border: 'none',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            boxShadow: '0 4px 10px var(--subscribe-shadow, rgba(30, 58, 138, 0.25))',
          }}
        >
          <i className="fas fa-bell"></i>
        </button>
      ) : (
        /* Desktop: full pill Subscribe button */
        <button
          className="btn btn-primary subscribe-btn"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          id="subscribe-trigger-btn"
        >
          <i className="fas fa-bell" style={{ marginRight: '0.4rem' }}></i><span>Subscribe</span>
        </button>
      )}

      {/* Portal: renders directly on <body>, above everything */}
      {mounted && open && <ModalContent onClose={close} />}
    </>
  );
}
