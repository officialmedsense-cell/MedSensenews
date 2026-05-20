import React from 'react';

export const metadata = {
  title: 'About Us | MedSense News',
  description: 'MedSense News is a modern digital health and medical news platform dedicated to delivering accurate, timely, and impactful information across Nigeria, Africa, and the global healthcare community.',
};

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero-v2">
        <div className="container">
          <div className="about-hero-content">
            <span className="hero-badge">Who We Are</span>
            <h1 className="hero-title">MedSense News</h1>
            <p className="hero-subtitle">
              A modern digital health and medical news platform dedicated to delivering accurate, timely, and impactful information across Nigeria, Africa, and the global healthcare community.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">Trusted</span>
                <span className="stat-label">Information</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">Science</span>
                <span className="stat-label">Communication</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">Africa</span>
                <span className="stat-label">& Global Focus</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-decoration"></div>
      </section>

      {/* Intro Section */}
      <section className="about-intro">
        <div className="container">
          <div className="intro-grid">
            <div className="intro-text">
              <p>
                We provide trusted coverage on medical news, public health, healthcare innovations, research discoveries, biotechnology, artificial intelligence in healthcare, and global health trends.
              </p>
              <p className="highlight">
                Empowering healthcare professionals, students, researchers, and the general public through ethical journalism.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-vision">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-card mission">
              <div className="card-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
              </div>
              <h2>Our Mission</h2>
              <p>
                Our mission is to make health and medical information accessible, understandable, and valuable to everyone — including healthcare professionals, students, researchers, and the general public.
              </p>
            </div>
            <div className="mv-card vision">
              <div className="card-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <h2>Our Vision</h2>
              <p>
                MedSense News was created with a vision to bridge the gap between medicine, technology, research, and public awareness through ethical journalism and innovation-driven storytelling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="what-we-do">
        <div className="container">
          <div className="section-header-v2">
            <h2 className="section-title-v2">What We Do</h2>
            <p className="section-subtitle">Operating across multiple health communication and digital information streams.</p>
          </div>
          <div className="wwd-grid">
            {[
              { title: "Scientific Translation", desc: "Breaking down complex medical research into simple, understandable language", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
              { title: "Verified Journalism", desc: "Publishing verified health news from Nigeria, Africa, and global sources", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
              { title: "Outbreak Tracking", desc: "Reporting emerging diseases, outbreaks, and public health trends", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" },
              { title: "Preventive Care", desc: "Promoting preventive healthcare and wellness education", icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
              { title: "Health Campaigns", desc: "Supporting health awareness campaigns and digital health engagement", icon: "M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8z M22 5v14l-4-4V9l4-4z" },
              { title: "Innovation Ecosystem", desc: "Building a connected ecosystem for health information and innovation", icon: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" }
            ].map((item, idx) => (
              <div key={idx} className="wwd-card">
                <div className="wwd-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon}></path>
                  </svg>
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="why-exist">
        <div className="container">
          <div className="exist-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <div className="exist-text">
              <h2 className="section-title-v2">Why MedSense News Exists</h2>
              <p>
                As part of the broader MedSense vision, we are committed to advancing healthcare communication, education, research, and digital innovation for a healthier and more informed society.
              </p>
              <div className="exist-quote" style={{ margin: '3rem auto 0' }}>
                "BEHIND EVERY HEADLINE IS A LIFE"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="core-values" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header-v2 center">
            <h2 className="section-title-v2">Our Core Values</h2>
            <p className="section-subtitle">The principles that guide everything we do.</p>
          </div>
          <div className="values-grid">
            {[
              { title: "Accuracy", desc: "Every piece of information is verified and evidence-based", color: "#3b82f6" },
              { title: "Clarity", desc: "We simplify medical knowledge without losing scientific meaning", color: "#10b981" },
              { title: "Integrity", desc: "We maintain trust, independence, and ethical reporting", color: "#6366f1" },
              { title: "Impact", desc: "We focus on health information that improves real lives", color: "#f59e0b" },
              { title: "Accessibility", desc: "Health knowledge should be available to everyone", color: "#ec4899" }
            ].map((value, idx) => (
              <div key={idx} className="value-item-v2" style={{"--accent-color": value.color}}>
                <div className="value-header">
                  <span className="value-index">0{idx + 1}</span>
                  <h3>{value.title}</h3>
                </div>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial & Fact-Check Policies */}
      <section style={{ background: 'var(--intel-navy)', color: 'white', padding: '6rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem' }} className="mobile-grid-1">
            <div>
              <h2 className="intelligence-section-title" style={{ color: 'white', borderLeftColor: 'var(--intel-accent)' }}>
                Editorial Standards
              </h2>
              <p style={{ opacity: 0.8, lineHeight: 1.8 }}>
                Our editorial process is rigorous. Every article undergoes a three-stage review:
                <br /><br />
                1. <strong>Verification</strong>: Cross-referencing with primary medical journals and official health bodies (WHO, CDC, NCDC).
                <br />
                2. <strong>Medical Review</strong>: Ensuring scientific terminology is used accurately.
                <br />
                3. <strong>Ethical Filter</strong>: Avoiding sensationalism and ensuring patient privacy.
              </p>
            </div>
            <div>
              <h2 className="intelligence-section-title" style={{ color: 'white', borderLeftColor: 'var(--fact-green)' }}>
                Fact-Checking Policy
              </h2>
              <p style={{ opacity: 0.8, lineHeight: 1.8 }}>
                In an era of medical misinformation, MedSense News serves as a shield. Our Fact-Check Hub specifically targets viral health myths and social media claims, providing evidence-based rebuttals from qualified experts.
                <br /><br />
                We prioritize transparent sourcing, always linking to the original data that supports or refutes a claim.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
