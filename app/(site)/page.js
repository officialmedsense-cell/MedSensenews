import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';

export const revalidate = 10; // Check for updates every 10 seconds
export const dynamic = 'force-dynamic'; // Ensure we always see fresh data from Supabase

async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(150);
  
  if (error) return [];
  return data;
}

export default async function Home() {
  const articles = await getArticles();
  
  if (articles.length === 0) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <p>No published articles yet. Check back later!</p>
        </div>
      </div>
    );
  }

  // News Distribution (Optimized for Instant Headlines)
  const featuredArticle = articles[0]; // Absolute newest as main headline
  const leftArticles = articles.slice(1, 3); // #2 and #3 on the left
  const rightArticles = articles.slice(3, 5); // #4 and #5 on the right
  const trendingArticles = articles.slice(5, 15);
  
  // Editorial Categories
  const medicalArticles = articles.filter(a => a.category === 'Medicine').slice(0, 6);
  const researchArticles = articles.filter(a => a.category === 'Research').slice(0, 5);
  const techArticles = articles.filter(a => a.category === 'Technology' || a.title.toLowerCase().includes('tech') || a.title.toLowerCase().includes('ai ')).slice(0, 5);
  const alertArticles = articles.filter(a => 
    a.category === 'Health Alerts' || 
    a.category === 'Outbreak' ||
    a.title.toLowerCase().includes('outbreak') ||
    a.title.toLowerCase().includes('emergency') ||
    a.title.toLowerCase().includes('virus') ||
    (a.excerpt && a.excerpt.toLowerCase().includes('outbreak'))
  ).slice(0, 5);
  
  const nigeriaArticles = articles.filter(a => 
    a.category === 'Health' || 
    a.title.toLowerCase().includes('nigeria') || 
    a.title.toLowerCase().includes('africa') ||
    (a.excerpt && a.excerpt.toLowerCase().includes('nigeria'))
  ).slice(0, 20);

  const globalArticles = articles.filter(a => {
    const title = a.title.toLowerCase();
    const excerpt = (a.excerpt || '').toLowerCase();
    
    // 1. Exclude Regional (Nigeria/Africa)
    if (title.includes('nigeria') || title.includes('africa') || 
        excerpt.includes('nigeria') || excerpt.includes('africa') ||
        a.category === 'Nigeria Health' || a.category === 'Africa Health') {
      return false;
    }

    // 2. Detect Global Entities
    return (
      a.category === 'Public Health' ||
      a.category === 'Global Health' ||
      title.includes('global') ||
      title.includes('world') ||
      title.includes('who') ||
      title.includes('international') ||
      title.includes('pandemic')
    );
  }).slice(0, 20);
  
  const weatherArticles = articles.filter(a => 
    a.category === 'Weather' || 
    a.category === 'Environment' ||
    a.title.toLowerCase().includes('weather') ||
    a.title.toLowerCase().includes('climate') ||
    a.title.toLowerCase().includes('storm') ||
    a.title.toLowerCase().includes('pollution') ||
    a.title.toLowerCase().includes('heat')
  ).slice(0, 15);

  
  const mustReadArticles = articles.filter(a => {
    const text = (a.title + ' ' + (a.excerpt || '')).toLowerCase();
    return (
      text.includes('who') ||
      text.includes('government') ||
      text.includes('ministry') ||
      text.includes('nigeria') ||
      text.includes('ng ') ||
      text.includes('war') ||
      text.includes('crisis') ||
      text.includes('policy')
    );
  }).slice(0, 5);

  const latestArticles = articles.slice(15).filter(a => 
    a.category !== 'Research' && 
    a.category !== 'Technology' &&
    a.category !== 'Weather' &&
    a.category !== 'Environment' &&
    !mustReadArticles.find(m => m.id === a.id)
  );

  return (
    <div className="homepage-shell">
      {/* 1. HERO SECTION (2-1-2 Grid) */}
      <section className="bbc-homepage-wrapper" style={{ paddingTop: '1rem', marginBottom: '2rem' }}>
        <div className="main-editorial-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr 1fr', 
          gap: '2rem' 
        }}>
          {/* Left Column */}
          <div className="mobile-hide" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {leftArticles.map(article => (
              <BbcCard key={article.id} article={article} />
            ))}
          </div>

          {/* Center Column */}
          <div className="mobile-full-width">
            {featuredArticle && <BbcCard article={featuredArticle} isFeatured={true} />}
          </div>

          {/* Right Column */}
          <div className="mobile-hide" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {rightArticles.map(article => (
              <BbcCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* 2. TRENDING NOW */}
      <section className="bbc-homepage-wrapper" style={{ marginTop: '2rem', marginBottom: '0' }}>
        <h3 className="intelligence-section-title" style={{ fontSize: '1rem', margin: '0 0 1.25rem 0', borderLeftColor: 'var(--intel-blue)' }}>
          <i className="fas fa-bolt" style={{ color: '#eab308', marginRight: '0.5rem' }}></i> Trending Now
        </h3>
        <div className="mobile-scroll-track" style={{ padding: '0 0 1rem 0', margin: '0' }}>
          {trendingArticles.map((article, idx) => (
            <Link key={article.id} href={`/article/${article.slug || article.id}`} className="mobile-trending-item" style={{ 
              textDecoration: 'none',
              flex: '0 0 320px', // Slightly wider to accommodate image
              background: 'linear-gradient(135deg, var(--intel-blue) 0%, var(--intel-navy) 100%)',
              margin: '0 1.25rem 0 0',
              borderRadius: '12px',
              overflow: 'hidden',
              padding: '0.75rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={article.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>{idx + 1}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.3, color: 'white', fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.25rem', display: 'block' }}>{article.category}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="bbc-homepage-wrapper">
        <div style={{ height: '1px', background: 'var(--border)', opacity: 0.4, margin: '0.5rem 0 2rem' }}></div>
      </div>

      {/* 3. MEDICAL RESEARCH & TECHNOLOGY SECTION */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '2rem' }}>
        <div className="bottom-editorial-grid" style={{ gap: '3rem' }}>
          {/* Medical Research */}
          <div>
            <h3 className="intelligence-section-title" style={{ borderLeftColor: 'var(--intel-accent)', marginBottom: '1.25rem' }}>
              <i className="fas fa-microscope"></i> Medical Research
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {researchArticles.map(article => (
                <BbcCard key={article.id} article={article} isList={true} />
              ))}
            </div>
          </div>

          {/* Health Technology */}
          <div>
            <h3 className="intelligence-section-title" style={{ borderLeftColor: 'var(--brand-accent)', marginBottom: '1.25rem' }}>
              <i className="fas fa-microchip"></i> Health Technology
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {techArticles.length > 0 ? techArticles.map(article => (
                <BbcCard key={article.id} article={article} isList={true} />
              )) : (
                <p style={{ opacity: 0.6, fontSize: '0.9rem', padding: '1rem' }}>No recent technology news available.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. LATEST INSIGHTS & ALERTS SECTION */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '2.5rem' }}>
        <div className="bottom-editorial-grid">
          {/* Left Column: Latest Insights */}
          <div className="latest-insights-column">
             <h3 className="intelligence-section-title" style={{ marginBottom: '1.25rem', fontSize: '1.5rem' }}>
              <i className="fas fa-clock" style={{ fontSize: '1.2rem', opacity: 0.8 }}></i> Latest Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {latestArticles.slice(0, 12).map((article) => (
                <BbcCard key={article.id} article={article} isList={true} />
              ))}
            </div>
          </div>

          {/* Right Column: Alerts */}
          <div className="alerts-sidebar-column">
             {/* Health Alerts */}
             <div>
                <h3 className="intelligence-section-title" style={{ borderLeftColor: 'var(--alert-red)', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                  <i className="fas fa-exclamation-circle" style={{ color: 'var(--alert-red)' }}></i> Health Alerts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {alertArticles.map(article => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg">
                        <div style={{ width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <img src={article.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <span style={{ color: 'var(--alert-red)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            {article.category === 'Outbreak' || article.title.toLowerCase().includes('outbreak') ? 'Outbreak Alert' : 'Emergency Update'}
                          </span>
                          <h4 style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.3, fontWeight: 700 }}>{article.title}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
             </div>

             {/* Must Read */}
             <div style={{ marginTop: '3rem' }}>
                <h3 className="intelligence-section-title" style={{ borderLeftColor: 'var(--primary)', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                  <i className="fas fa-bookmark" style={{ color: 'var(--primary)' }}></i> Must Read
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {mustReadArticles.map(article => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg">
                        <div style={{ width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <img src={article.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <span style={{ color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            Policy & Crisis
                          </span>
                          <h4 style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.3, fontWeight: 700 }}>{article.title}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </section>



      {/* 5. NIGERIA & AFRICA HEALTH */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '1.25rem' }}>
        <h3 className="intelligence-section-title section-title-desktop-stack" style={{ borderLeftColor: 'var(--intel-blue)', marginBottom: '1.25rem', fontSize: '1.5rem' }}>
          <i className="fas fa-globe-africa" style={{ fontSize: '1.2rem', opacity: 0.8 }}></i> Nigeria & Africa Health
        </h3>
        <div className="section-grid-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
          {nigeriaArticles.map((article, i) => {
            let flexBasis = 'calc(50% - 0.75rem)'; // 2 across for top row
            let isSmall = false;
            if (i >= 2) {
              flexBasis = 'calc(25% - 1.125rem)'; // 4 across for the rest
              isSmall = true;
            }
            
            return (
              <div key={article.id} className={i === 0 ? "mobile-featured-row" : ""} style={{ 
                flex: i === 0 ? '0 0 100%' : `0 0 ${flexBasis}`, 
                maxWidth: i === 0 ? '700px' : 'none',
                margin: i === 0 ? '0 auto 2.5rem' : '0',
                minWidth: i >= 2 ? '140px' : '250px'
              }}>
                <BbcCard article={article} isSmall={isSmall} />
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. GLOBAL HEALTH INSIGHTS */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '1.25rem' }}>
        <h3 className="intelligence-section-title section-title-desktop-stack" style={{ borderLeftColor: 'var(--accent)', marginBottom: '1.25rem', fontSize: '1.5rem' }}>
          <i className="fas fa-globe" style={{ fontSize: '1.2rem', opacity: 0.8 }}></i> Global Health Insights
        </h3>
        <div className="section-grid-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
          {globalArticles.map((article, i) => {
            let flexBasis = 'calc(50% - 0.75rem)'; // 2 across for top row
            let isSmall = false;
            if (i >= 2) {
              flexBasis = 'calc(25% - 1.125rem)'; // 4 across for the rest
              isSmall = true;
            }

            return (
              <div key={article.id} className={i === 0 ? "mobile-featured-row" : ""} style={{ 
                flex: i === 0 ? '0 0 100%' : `0 0 ${flexBasis}`, 
                maxWidth: i === 0 ? '700px' : 'none',
                margin: i === 0 ? '0 auto 2.5rem' : '0',
                minWidth: i >= 2 ? '140px' : '250px'
              }}>
                <BbcCard article={article} isSmall={isSmall} />
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. WEATHER & ENVIRONMENT */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '1.25rem' }}>
        <h3 className="intelligence-section-title section-title-desktop-stack" style={{ borderLeftColor: '#0ea5e9', marginBottom: '1.25rem', fontSize: '1.5rem' }}>
          <i className="fas fa-cloud-sun-rain" style={{ fontSize: '1.2rem', opacity: 0.8, color: '#0ea5e9' }}></i> Weather & Climate Health
        </h3>
        {/* Live Weather Widget */}
        <WeatherWidget />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {weatherArticles.length > 0 ? weatherArticles.map((article) => (
            <div key={article.id} style={{ width: '100%' }}>
              <BbcCard article={article} isList={true} />
            </div>
          )) : (
            <p style={{ textAlign: 'center', opacity: 0.6, width: '100%' }}>No recent weather-related news available.</p>
          )}
        </div>
      </section>


      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          .container { padding: 0 0.75rem !important; }
          .bbc-homepage-wrapper { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
          
          .main-editorial-grid { 
            grid-template-columns: 1fr !important; 
            gap: 1.5rem !important; 
          }
          
          .mobile-hide { display: none !important; }
          
          /* Regional sections 2-column grid */
          .section-grid-mobile {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
            width: 100% !important;
          }
          
          .mobile-featured-row {
            grid-column: span 2 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 0 1rem 0 !important;
          }
          
          .section-grid-mobile h3 { font-size: 0.85rem !important; line-height: 1.25 !important; }
          .section-grid-mobile p { display: none !important; }
        }
      `}} />
    </div>
  );
}
