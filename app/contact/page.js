import React from 'react';

export const metadata = {
  title: 'Contact Us | MedSense News',
  description: 'Get in touch with MedSense News for inquiries, collaborations, partnerships, news tips, contributions, or support.',
};

export default function ContactPage() {
  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-card">
          <div className="contact-info">
            <h1>Contact Us</h1>
            <p>
              We would love to hear from you. For inquiries, collaborations, partnerships, news tips, contributions, or support, feel free to contact MedSense News through our official email address.
            </p>
            <div className="contact-methods">
              <div className="method-item">
                <div className="method-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="method-details">
                  <h4>Official Email</h4>
                  <p>officialmedsense@gmail.com</p>
                </div>
              </div>
              <div className="method-item">
                <div className="method-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="method-details">
                  <h4>Response Time</h4>
                  <p>Usually within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <a href="mailto:officialmedsense@gmail.com" className="email-link">
              <i className="fas fa-paper-plane"></i>
              Send us an Email
            </a>
            
            <div style={{ padding: '2rem', background: 'rgba(30, 58, 138, 0.03)', borderRadius: '1.5rem', border: '1px dashed var(--border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Other Ways to Connect</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                Follow our official channels for the latest updates and direct messaging.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {/* Reusing social icons logic or patterns */}
                <a href="https://x.com/MedsenseN" target="_blank" rel="noopener" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', textDecoration: 'none' }}><i className="fab fa-twitter"></i></a>
                <a href="https://www.linkedin.com/in/medsense-news-72a2473bb" target="_blank" rel="noopener" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', textDecoration: 'none' }}><i className="fab fa-linkedin-in"></i></a>
                <a href="https://www.instagram.com/medsensenews/" target="_blank" rel="noopener" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', textDecoration: 'none' }}><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
