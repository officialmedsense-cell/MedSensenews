import React from 'react';

export const metadata = {
  title: 'Terms of Service | MedSense News',
  description: 'By using MedSense News, you agree to our terms and conditions. Read more about our educational purpose, medical disclaimer, and user conduct policies.',
};

export default function TermsPage() {
  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '70vh' }}>
      <div className="legal-content" style={{ maxWidth: '850px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--text-primary)' }}>
        <h1 className="article-title" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2.8rem', fontWeight: '800' }}>Terms of Service</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '0.95rem' }}>
          Effective Date: May 20, 2026 | Last Updated: May 20, 2026
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: '1.7', fontSize: '1.05rem' }}>
          
          {/* Section 1 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              By accessing, browsing, or using the <strong>MedSense News</strong> website (the "Site") and any associated newsletters, syndication feeds, and editorial services (collectively, the "Services"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (the "Terms") and all applicable laws and regulations.
            </p>
            <p>
              If you do not agree to these Terms, please do not access or use our Site or Services. We reserve the right to review, update, or modify these Terms at any time without prior notice. Continued use of the Site after updates are published constitutes full acceptance of the revised Terms.
            </p>
          </div>

          {/* Section 2 - CRITICAL MEDICAL DISCLAIMER */}
          <div className="legal-section" style={{ background: 'var(--bg-secondary, hsla(0, 0%, 50%, 0.03))', padding: '2rem', borderRadius: '1rem', border: '1px solid hsla(0, 0%, 50%, 0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--danger, #ff4d4f)' }}>
              2. Professional Medical Disclaimer
            </h2>
            <p style={{ marginBottom: '1rem', fontWeight: '600' }}>
              All content published on MedSense News is intended strictly for informational, journalistic, and educational purposes. 
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>NO MEDICAL ADVICE:</strong> The articles, reports, medical news briefings, and FAQs provided on this Site do not constitute professional medical advice, clinical diagnosis, personal recommendation, or treatment. 
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>CONSULT YOUR DOCTOR:</strong> Always seek the direct advice of your physician or other qualified health provider with any questions you may have regarding a medical condition, dietary regime, or physical exercise program. Never disregard professional medical advice or delay in seeking it because of something you have read on MedSense News.
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              If you think you may have a medical emergency, call your local doctor, emergency services, or hospital immediately. MedSense News does not recommend or endorse any specific tests, clinicians, medical products, procedures, or opinions that may be mentioned on the Site. Reliance on any information provided by our editors, contributors, or AI synthesis systems is solely at your own risk.
            </p>
          </div>

          {/* Section 3 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              3. Intellectual Property Rights & Content License
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Unless otherwise stated, all material on MedSense News, including but not limited to written articles, editorial designs, clinical summaries, code, logos, and graphic representations, is the property of MedSense News and is protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Permitted Usage:</strong> You are granted a limited, non-exclusive, non-transferable license to access and read our publications for personal, non-commercial use.
            </p>
            <p>
              <strong>Prohibited Activities:</strong> You may not copy, scrape, republish, reproduce, redistribute, translate, or commercially exploit any content from MedSense News without explicit written permission from our Editorial Board. Unauthorized use of automation, scrapers, or framing technologies to extract data from this Site is strictly prohibited.
            </p>
          </div>

          {/* Section 4 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              4. User Conduct and Security
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              As a condition of your use of the Services, you agree not to use the Site for any purpose that is unlawful or prohibited by these Terms. You agree to use the Site in a manner that:
            </p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Does not disrupt, disable, overburden, or impair the website's infrastructure or servers.</li>
              <li>Does not introduce viruses, malware, trojan horses, or other digitally harmful code.</li>
              <li>Respects the privacy and rights of other site visitors and administrators.</li>
              <li>Does not attempt to gain unauthorized access to our staff database, editor dashboard, or publishing servers.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              5. Editorial Standards and Third-Party Resources
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              MedSense News prides itself on rigorous, Reuters-standard medical reporting. However, our articles may contain outbound links or citations to third-party scientific databases, clinical trials, academic publications, or public health bodies (such as the WHO, CDC, or PubMed).
            </p>
            <p>
              We do not verify, endorse, monitor, or assume any responsibility for the accuracy or safety of third-party websites, their products, or their services. Accessing external links is done completely at your own risk.
            </p>
          </div>

          {/* Section 6 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              6. Limitation of Liability & Warranty Disclaimer
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              THE SITE AND ITS SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE BY LAW, MEDSENSE NEWS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              IN NO EVENT SHALL MEDSENSE NEWS, ITS EDITORIAL BOARD, STAFF, OR PARTNERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO, USE OF, OR INABILITY TO USE THE SITE, SERVICES, OR CONTENT, REGARDLESS OF THE LEGAL THEORY ADVANCED.
            </p>
          </div>

          {/* Section 7 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              7. Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by, construed, and enforced in accordance with applicable federal and state laws. Any dispute, claim, or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation, or validity thereof shall be resolved exclusively within appropriate courts of jurisdiction.
            </p>
          </div>

          {/* Contact Inquiries */}
          <div className="legal-section" style={{ marginTop: '2rem', padding: '2.5rem', background: 'var(--bg-secondary, hsla(0, 0%, 50%, 0.02))', borderRadius: '1rem', border: '1px solid var(--border, #eaeaea)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)' }}>✉</span> Editorial & Legal Inquiries
            </h3>
            <p>
              If you have any questions, clarifications, or feedback regarding our Terms of Service, content usage, or syndication licensing, please contact our Legal Compliance Officer:
            </p>
            <p style={{ fontWeight: 800, color: 'var(--primary)', marginTop: '0.8rem', fontSize: '1.15rem' }}>
              officialmedsense@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
