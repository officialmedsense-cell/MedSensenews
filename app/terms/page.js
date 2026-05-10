import React from 'react';

export const metadata = {
  title: 'Terms of Service | MedSense News',
  description: 'By using MedSense News, you agree to our terms and conditions. Read more about our educational purpose and user conduct policies.',
};

export default function TermsPage() {
  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '70vh' }}>
      <div className="legal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="article-title" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Terms of Service</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="legal-section">
            <p>
              By accessing and using MedSense News, you agree to comply with our terms and conditions.
            </p>
          </div>

          <div className="legal-section">
            <h3><i className="fas fa-info-circle" style={{ marginRight: '0.6rem', color: 'var(--primary)' }}></i>Informational Purpose</h3>
            <p>
              All content published on MedSense News is intended for informational and educational purposes only and should not replace professional medical advice, diagnosis, or treatment.
            </p>
          </div>

          <div className="legal-section">
            <h3><i className="fas fa-copyright" style={{ marginRight: '0.6rem', color: 'var(--primary)' }}></i>Content Usage</h3>
            <p>
              Users may not reproduce, republish, or distribute content from MedSense News without proper permission or attribution.
            </p>
          </div>

          <div className="legal-section">
            <p>
              We reserve the right to update, modify, or remove content and services at any time without prior notice.
            </p>
          </div>

          <div className="legal-section">
            <h3><i className="fas fa-user-check" style={{ marginRight: '0.6rem', color: 'var(--primary)' }}></i>User Conduct</h3>
            <p>
              Users are expected to engage respectfully on the platform and avoid any activity that may harm the integrity, security, or reputation of MedSense News.
            </p>
          </div>

          <div className="legal-section">
            <p>
              Continued use of the platform indicates acceptance of these terms.
            </p>
          </div>

          <div className="legal-section" style={{ marginTop: '2rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-envelope" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>Policy Inquiries</h3>
            <p>For inquiries regarding our policies or terms, contact:</p>
            <p style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '0.5rem' }}>officialmedsense@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
