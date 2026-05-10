import React from 'react';

export const metadata = {
  title: 'Privacy Policy | MedSense News',
  description: 'MedSense News is committed to protecting your personal information. Read our privacy policy to understand how we handle your data.',
};

export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '70vh' }}>
      <div className="legal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="article-title" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Privacy Policy</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="legal-section">
            <p>
              At MedSense News, we value your privacy and are committed to protecting your personal information. Any information collected through our website, newsletters, forms, or services is handled responsibly and used only to improve user experience, communication, and platform functionality.
            </p>
          </div>

          <div className="legal-section">
            <p>
              We do not sell or share users’ personal information with unauthorized third parties. By using our platform, you agree to the collection and use of information in accordance with our policies.
            </p>
          </div>

          <div className="legal-section">
            <p>
              MedSense News may use cookies, analytics tools, and third-party services to enhance website performance and understand user engagement.
            </p>
          </div>

          <div className="legal-section">
            <p>
              Users are responsible for ensuring that information submitted to the platform is accurate and appropriate.
            </p>
          </div>

          <div className="legal-section" style={{ marginTop: '2rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-envelope" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>Privacy Inquiries</h3>
            <p>For privacy-related inquiries, contact us at:</p>
            <p style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '0.5rem' }}>officialmedsense@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
