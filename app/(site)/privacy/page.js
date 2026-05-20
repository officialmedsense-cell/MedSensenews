import React from 'react';

export const metadata = {
  title: 'Privacy Policy | MedSense News',
  description: 'MedSense News is committed to protecting your personal information. Read our comprehensive privacy policy to understand how we handle, collect, and safeguard your data.',
};

export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '70vh' }}>
      <div className="legal-content" style={{ maxWidth: '850px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--text-primary)' }}>
        <h1 className="article-title" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2.8rem', fontWeight: '800' }}>Privacy Policy</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '0.95rem' }}>
          Effective Date: May 20, 2026 | Last Updated: May 20, 2026
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: '1.7', fontSize: '1.05rem' }}>
          
          {/* Section 1 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              1. Introduction
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Welcome to <strong>MedSense News</strong>. We are a premier digital health journalism and medical intelligence platform dedicated to delivering high-value, accurate, and educational medical reporting.
            </p>
            <p>
              Your privacy is of paramount importance to us. This Privacy Policy document outlines the types of personal information that is received and collected by MedSense News and how it is used, stored, and safeguarded. By using our website and services, you consent to the data practices described in this statement.
            </p>
          </div>

          {/* Section 2 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              2. Information We Collect
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              To provide you with our educational and medical journalism services, we may collect different types of information depending on how you interact with our platform:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <strong>Personal Identification Data:</strong> If you subscribe to our newsletters, submit feedback, or contact our editorial staff, we may collect your email address, name, and any other details you choose to provide.
              </li>
              <li>
                <strong>Log and Technical Usage Data:</strong> When you access our website, our servers automatically log standard network data, including your IP address, browser type, referring pages, exit pages, operating system, date/time stamps, and clickstream data.
              </li>
              <li>
                <strong>Device Information:</strong> We may collect data regarding the device you use to access the website, including device models, unique identifiers, and network configurations to improve mobile responsiveness.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              3. How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We use the collected information for various professional editorial and technical purposes, including to:
            </p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Operate, maintain, and optimize the MedSense News website and user interface.</li>
              <li>Improve our medical journalism, ensuring content relevance and clinical accuracy based on popular topics.</li>
              <li>Deliver news alerts, expert briefings, and corporate updates to our mailing list subscribers.</li>
              <li>Monitor and analyze overall site performance, page views, and user engagement trends.</li>
              <li>Detect, prevent, and address technical errors or unauthorized malicious activities.</li>
            </ul>
          </div>

          {/* Section 4 - AD ADSENSE SPECIFIC REQUIRED SECTIONS */}
          <div className="legal-section" style={{ background: 'var(--bg-secondary, hsla(0, 0%, 50%, 0.03))', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border, #eaeaea)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
              4. Cookies, Web Beacons, and Google AdSense
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              MedSense News uses cookies to store information about visitors' preferences, to record user-specific information on which pages the site visitor accesses or visits, and to personalize or customize our web page content based on visitors' browser type or other information that the visitor sends via their browser.
            </p>
            <div style={{ paddingLeft: '1rem', borderLeft: '4px solid var(--primary)', margin: '1.5rem 0' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Google DoubleClick DART Cookie</h3>
              <p style={{ marginBottom: '0.8rem' }}>
                Google, as a third-party vendor, uses cookies to serve ads on MedSense News.
              </p>
              <p style={{ marginBottom: '0.8rem' }}>
                Google's use of the DoubleClick DART cookie enables it and its partners to serve ads to our users based on their visit to MedSense News and other sites on the Internet.
              </p>
              <p>
                Users may opt out of the use of the DART cookie by visiting the <strong>Google Ad and Content Network Privacy Policy</strong> at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>https://policies.google.com/technologies/ads</a>
              </p>
            </div>
            <p style={{ marginBottom: '1rem' }}>
              Some of our advertising partners may use cookies and web beacons on our site. These third-party ad servers or ad networks use technology to send, directly to your browser, the advertisements and links that appear on MedSense News. They automatically receive your IP address when this occurs.
            </p>
            <p>
              Other technologies (such as cookies, JavaScript, or Web Beacons) may also be used by our site's third-party ad networks to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on the site. MedSense News has no access to or control over these cookies that are used by third-party advertisers.
            </p>
          </div>

          {/* Section 5 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              5. GDPR and CCPA Data Protection Rights
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We want to make sure you are fully aware of all of your data protection rights. Depending on your jurisdiction (including the European Union under GDPR and California under CCPA), you are entitled to the following rights:
            </p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>The Right to Access:</strong> You have the right to request copies of your personal data.</li>
              <li><strong>The Right to Rectification:</strong> You have the right to request that we correct any information you believe is inaccurate or incomplete.</li>
              <li><strong>The Right to Erasure:</strong> You have the right to request that we erase your personal data under certain conditions.</li>
              <li><strong>The Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal data under certain conditions.</li>
              <li><strong>The Right to Object:</strong> You have the right to object to our processing of your personal data under certain conditions.</li>
              <li><strong>The Right to Data Portability:</strong> You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
              <li><strong>The Right to Non-Discrimination:</strong> We will not discriminate against you in any way for exercising your privacy rights.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              6. Children's Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.
            </p>
            <p>
              MedSense News does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately, and we will do our best efforts to promptly remove such information from our records.
            </p>
          </div>

          {/* Section 7 */}
          <div className="legal-section">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              7. Third-Party Links
            </h2>
            <p>
              Our articles contain curated citations and links to high-authority academic journals, medical registries, and global health organizations (e.g., CDC, WHO, The Lancet). These external websites operate independently and have separate privacy policies. We have no responsibility or liability for the content, cookies, or data collection activities of these linked sites.
            </p>
          </div>

          {/* Contact Inquiries */}
          <div className="legal-section" style={{ marginTop: '2rem', padding: '2.5rem', background: 'var(--bg-secondary, hsla(0, 0%, 50%, 0.02))', borderRadius: '1rem', border: '1px solid var(--border, #eaeaea)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)' }}>✉</span> Privacy Inquiries & Opt-Out Requests
            </h3>
            <p>
              If you have any questions about our Privacy Policy, our cookie practices, or wish to exercise your data access or deletion rights, please contact our Editorial Compliance Desk:
            </p>
            <p style={{ fontWeight: 800, color: 'var(--primary)', marginTop: '0.8rem', fontSize: '1.15rem' }}>
              officialmedsense@gmail.com
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
              Correspondence is typical within 2–3 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
