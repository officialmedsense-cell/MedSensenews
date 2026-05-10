import React from 'react';

export const metadata = {
  title: 'Careers | MedSense News',
  description: 'Join MedSense News and contribute to the future of digital health media, medical journalism, and healthcare innovation.',
};

export default function CareersPage() {
  const opportunities = [
    { title: "Medical and health journalism", icon: "fa-stethoscope" },
    { title: "Content writing and editing", icon: "fa-pen-nib" },
    { title: "Graphic design and media", icon: "fa-palette" },
    { title: "Social media management", icon: "fa-share-nodes" },
    { title: "Web development and technology", icon: "fa-code" },
    { title: "Research and data analysis", icon: "fa-microscope" },
    { title: "Public health communication", icon: "fa-bullhorn" },
    { title: "Community outreach and partnerships", icon: "fa-handshake-angle" }
  ];

  return (
    <div className="careers-page">
      {/* Hero Section */}
      <section className="careers-hero">
        <div className="container">
          <h1 className="hero-title" style={{ marginBottom: '1.5rem' }}>Careers at MedSense News</h1>
          <p className="hero-subtitle" style={{ maxWidth: '800px', margin: '0 auto' }}>
            We are building a new generation digital health media platform focused on healthcare communication, medical journalism, innovation, and technology.
          </p>
        </div>
      </section>

      {/* Intro Section */}
      <section style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="section-title-v2" style={{ marginBottom: '2rem' }}>Join Our Mission</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', lineHeight: '1.8' }}>
              We welcome passionate individuals who are interested in contributing to impactful work in a wide range of specialized areas. Whether you are a student, healthcare professional, creative, researcher, or tech enthusiast, MedSense News provides opportunities to learn, grow, and make meaningful contributions to healthcare awareness and innovation.
            </p>
          </div>

          <div className="careers-grid">
            {opportunities.map((item, idx) => (
              <div key={idx} className="career-card">
                <div className="career-icon">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <h3>{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="container">
        <div className="philosophy-section">
          <div className="section-header-v2 center">
            <h2 className="section-title-v2">Our Philosophy</h2>
            <p className="section-subtitle">The foundation of our working culture.</p>
          </div>
          <div className="philosophy-grid">
            {['Creativity', 'Collaboration', 'Professionalism', 'Impact'].map((val, idx) => (
              <div key={idx} className="philosophy-item">
                <h4>{val}</h4>
                <div style={{ width: '40px', height: '3px', background: 'var(--primary)', margin: '0.5rem auto' }}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="careers-contact">
        <div className="container">
          <div style={{ background: 'var(--primary)', color: 'white', padding: '4rem 2rem', borderRadius: '2rem', boxShadow: '0 20px 40px rgba(30, 58, 138, 0.2)' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Start Your Journey</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto 2.5rem' }}>
              To inquire about available opportunities, internships, collaborations, or volunteer positions, please contact us through our official platforms.
            </p>
            <a href="mailto:careers@medsense.news" className="btn btn-primary" style={{ background: 'white', color: 'var(--primary)', padding: '1rem 2.5rem', fontWeight: 800 }}>
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
