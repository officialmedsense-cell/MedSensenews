'use client';

import { useState } from 'react';

const CATEGORIES = ['Health', 'Medicine', 'Research', 'Public Health', 'Technology'];

export default function NewsletterForm({ compact = false }) {
  const [email, setEmail]         = useState('');
  const [name, setName]           = useState('');
  const [categories, setCategories] = useState([]);
  const [status, setStatus]       = useState('idle'); // idle | loading | success | error
  const [message, setMessage]     = useState('');

  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, categories }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      } else {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
        setName('');
        setCategories([]);
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="newsletter-success">
        <div className="newsletter-success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h4>You&apos;re subscribed!</h4>
        <p>{message}</p>
        <button
          className="newsletter-reset-btn"
          onClick={() => setStatus('idle')}
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <form className={`newsletter-form-full${compact ? ' newsletter-compact' : ''}`} onSubmit={handleSubmit} noValidate>
      {!compact && (
        <div className="newsletter-field">
          <label htmlFor="nl-name">Your Name <span style={{ opacity: 0.6, fontSize: '0.8em' }}>(optional)</span></label>
          <input
            id="nl-name"
            type="text"
            placeholder="Dr. Jane Smith"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={status === 'loading'}
            autoComplete="name"
          />
        </div>
      )}

      <div className="newsletter-field">
        <label htmlFor="nl-email">Email Address</label>
        <input
          id="nl-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          autoComplete="email"
        />
      </div>

      {!compact && (
        <div className="newsletter-field">
          <label>Topics of Interest <span style={{ opacity: 0.6, fontSize: '0.8em' }}>(optional)</span></label>
          <div className="newsletter-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`nl-cat-pill${categories.includes(cat) ? ' active' : ''}`}
                onClick={() => toggleCategory(cat)}
                disabled={status === 'loading'}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="newsletter-alert newsletter-alert-error">
          <i className="fas fa-exclamation-circle"></i> {message}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary newsletter-submit-btn"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <><i className="fas fa-spinner fa-spin"></i> Subscribing…</>
        ) : (
          <><i className="fas fa-paper-plane"></i> Subscribe Now</>
        )}
      </button>

      <p className="newsletter-privacy">
        <i className="fas fa-lock"></i> No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </form>
  );
}
