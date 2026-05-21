import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';
import Link from 'next/link';
import Image from 'next/image';
import WeatherWidget from '@/components/WeatherWidget';
import { HEALTH_DAYS } from '@/lib/healthDays';

export const revalidate = 10; // Check for updates every 10 seconds
export const dynamic = 'force-dynamic'; // Ensure we always see fresh data from Supabase

async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false }) // Use created_at for high-precision sorting
    .order('date', { ascending: false }) // Fallback for legacy articles
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
  const premiumTrendingArticles = trendingArticles.slice(0, 8);
  
  // Editorial Categories
  const medicalArticles = articles.filter(a => a.category === 'Medicine').slice(0, 6);
  const researchArticles = articles.filter(a => a.category === 'Research').slice(0, 8);
  const techArticles = articles.filter(a => a.category === 'Technology' || a.title.toLowerCase().includes('tech') || a.title.toLowerCase().includes('ai ')).slice(0, 8);
  const alertArticles = articles.filter(a => 
    a.category === 'Health Alerts' || 
    a.category === 'Outbreak' ||
    a.title.toLowerCase().includes('outbreak') ||
    a.title.toLowerCase().includes('emergency') ||
    a.title.toLowerCase().includes('virus') ||
    (a.excerpt && a.excerpt.toLowerCase().includes('outbreak'))
  ).slice(0, 5);
  
  const getGeographicScore = (a) => {
    const title = (a.title || '').toLowerCase();
    const excerpt = (a.excerpt || '').toLowerCase();
    const content = (a.content || '').toLowerCase();

    // AI explicitly categorized it (very strong signal)
    if (a.category === 'Nigeria/Africa Health' || a.category === 'Nigeria Health' || a.category === 'Africa Health') {
      return { africa: 100, global: 0 };
    }
    if (a.category === 'Global Health') {
      return { africa: 0, global: 100 };
    }

    let africaScore = 0;
    let globalScore = 0;

    const africanKeywords = [
      'nigeria', 'africa', 'lagos', 'abuja', 'kano', 'port harcourt', 'ibadan', 'kaduna', 
      'enugu', 'anambra', 'oyo', 'delta state', 'edo state', 'ogun', 'ncdc', 'nafdac', 
      'south africa', 'kenya', 'ghana', 'egypt', 'ethiopia', 'tanzania', 'uganda', 
      'rwanda', 'senegal', 'zimbabwe', 'cameroon', 'mali', 'sudan', 'somalia'
    ];

    const globalKeywords = [
      'global', 'world health', 'who ', 'international', 'pandemic', 'cdc ', 'un ', 'united nations', 
      'fda ', 'europe', 'america', 'usa', 'united states', 'london', 'uk '
    ];

    // 1. Check title (highest priority)
    africanKeywords.forEach(kw => {
      if (title.includes(kw)) africaScore += 10;
    });
    globalKeywords.forEach(kw => {
      if (title.includes(kw)) globalScore += 10;
    });

    // 2. Check excerpt (medium priority)
    africanKeywords.forEach(kw => {
      if (excerpt.includes(kw)) africaScore += 5;
    });
    globalKeywords.forEach(kw => {
      if (excerpt.includes(kw)) globalScore += 5;
    });

    // 3. Check content (lowest priority to prevent casual mentions from overriding)
    africanKeywords.forEach(kw => {
      const matches = content.split(kw).length - 1;
      africaScore += matches * 0.5;
    });
    globalKeywords.forEach(kw => {
      const matches = content.split(kw).length - 1;
      globalScore += matches * 0.5;
    });

    return { africa: africaScore, global: globalScore };
  };

  const isAfricanNews = (a) => {
    const { africa, global } = getGeographicScore(a);
    return africa > 0 && africa >= global;
  };

  const isGlobalNews = (a) => {
    const { africa, global } = getGeographicScore(a);
    if (global > 0 && global > africa) return true;

    // Fallback for Public Health if not African
    if (a.category === 'Public Health' && !isAfricanNews(a)) {
      return true;
    }
    return false;
  };

  const isGovOrgInstituteNews = (a) => {
    const title = (a.title || '').toLowerCase();
    const excerpt = (a.excerpt || '').toLowerCase();
    const category = (a.category || '').toLowerCase();

    return (
      category.includes('public health') ||
      category.includes('policy') ||
      category.includes('government') ||
      title.includes('who ') || title.includes('who:') || title.includes('world health organization') ||
      title.includes('cdc') || title.includes('ncdc') || title.includes('nafdac') ||
      title.includes('government') || title.includes('govt') || title.includes('ministry') ||
      title.includes('fda') || title.includes('nih') || title.includes('un ') ||
      title.includes('united nations') || title.includes('unicef') || title.includes('organization') ||
      title.includes('institute') || title.includes('policy') || title.includes('health authority') ||
      excerpt.includes('who ') || excerpt.includes('world health organization') ||
      excerpt.includes('cdc') || excerpt.includes('ncdc') || excerpt.includes('nafdac') ||
      excerpt.includes('government') || excerpt.includes('govt') || excerpt.includes('ministry') ||
      excerpt.includes('fda') || excerpt.includes('un ') || excerpt.includes('united nations') ||
      excerpt.includes('organization') || excerpt.includes('institute') || excerpt.includes('policy')
    );
  };

  const govArticlesAll = articles.filter(isGovOrgInstituteNews);

  // Africa / Nigeria specific gov articles
  let nigeriaGovArticles = govArticlesAll.filter(isAfricanNews);
  if (nigeriaGovArticles.length < 3) {
    nigeriaGovArticles = govArticlesAll.filter(a => isAfricanNews(a) || a.category === 'Public Health');
  }
  nigeriaGovArticles = nigeriaGovArticles.slice(0, 5);

  // Global specific gov articles
  let globalGovArticles = govArticlesAll.filter(isGlobalNews);
  if (globalGovArticles.length < 3) {
    globalGovArticles = govArticlesAll.filter(a => 
      !nigeriaGovArticles.find(n => n.id === a.id) &&
      (isGlobalNews(a) || a.category === 'Public Health' || a.category === 'Medicine')
    );
  }
  globalGovArticles = globalGovArticles.slice(0, 5);

  const nigeriaArticlesFiltered = articles
    .filter(isAfricanNews)
    .filter(a => !nigeriaGovArticles.find(g => g.id === a.id))
    .slice(0, 6);

  const globalArticlesFiltered = articles
    .filter(isGlobalNews)
    .filter(a => !globalGovArticles.find(g => g.id === a.id))
    .slice(0, 6);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (dateString.length === 10 && dateString.includes('-')) {
      const [y, m, d] = dateString.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Lagos'
      });
    }
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos'
    });
  };

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

  // Latest articles for display (capped at 21 for the rotating grid)
  const latestArticlesFull = articles.slice(15).filter(a => 
    a.category !== 'Research' && 
    a.category !== 'Technology' &&
    a.category !== 'Weather' &&
    a.category !== 'Environment' &&
    !mustReadArticles.find(m => m.id === a.id)
  );
  // Only mark what is actually displayed as used, so the rest flows to Additional Coverage
  const latestArticles = latestArticlesFull.slice(0, 21);

  // Health Awareness Days Logic
  const today = new Date();
  const activeHealthDay = HEALTH_DAYS.find(d => d.month === today.getMonth() && d.day === today.getDate());
  
  let healthDayArticles = [];
  if (activeHealthDay) {
    healthDayArticles = articles.filter(a => {
      const text = (a.title + ' ' + (a.excerpt || '')).toLowerCase();
      return (
        text.includes(activeHealthDay.name.toLowerCase()) ||
        activeHealthDay.keywords.some(kw => text.includes(kw.toLowerCase()))
      );
    }).slice(0, 4);
  }

  // Deduplicate articles shown in previous sections to gather the remaining coverage
  const usedArticleIds = new Set([
    featuredArticle?.id,
    ...leftArticles.map(a => a.id),
    ...rightArticles.map(a => a.id),
    ...trendingArticles.map(a => a.id),
    ...researchArticles.map(a => a.id),
    ...techArticles.map(a => a.id),
    ...alertArticles.map(a => a.id),
    ...mustReadArticles.map(a => a.id),
    ...latestArticles.map(a => a.id),
    ...nigeriaGovArticles.map(a => a.id),
    ...globalGovArticles.map(a => a.id),
    ...nigeriaArticlesFiltered.map(a => a.id),
    ...globalArticlesFiltered.map(a => a.id),
    ...weatherArticles.map(a => a.id),
    ...healthDayArticles.map(a => a.id)
  ].filter(Boolean));

  const remainingArticlesAll = articles.filter(a => !usedArticleIds.has(a.id));
  const remainingArticles = remainingArticlesAll.slice(0, 14); // limit to 6 main + 8 sidebar items

  // Determine split for Additional Coverage desktop layout
  // Balance so both columns end at same visual height:
  // 1 row of 3 main cards â‰ˆ 4 sidebar list items in height
  let mainRemaining = remainingArticles;
  let sidebarRemaining = [];
  if (remainingArticles.length >= 5) {
    mainRemaining = remainingArticles.slice(0, 6);
    sidebarRemaining = remainingArticles.slice(6, 10); // exactly 4 sidebar items
  }

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
          <i className="fas fa-bolt" style={{ color: 'var(--primary)', marginRight: '0.5rem' }}></i> Trending Now
        </h3>
        <div className="trending-news-list">
          {premiumTrendingArticles.map((article, idx) => (
            <Link key={article.id} href={`/article/${article.slug || article.id}`} className="trending-news-item">
              <span className="trending-news-index">{String(idx + 1).padStart(2, '0')}</span>
              <div className="trending-news-image">
                <Image
                  src={article.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200"}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 88px, 112px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="trending-news-content">
                <span className="trending-news-meta">{article.category}</span>
                <h4>{article.title}</h4>
                <span className="trending-news-time">{formatDate(article.created_at || article.date)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="bbc-homepage-wrapper">
        <div className="mobile-divider"></div>
      </div>

      {/* 3. MEDICAL RESEARCH & TECHNOLOGY SECTION */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '2rem' }}>
        <div className="bottom-editorial-grid" style={{ gap: '3rem' }}>
          {/* Medical Research */}
          <div>
            <h3 className="intelligence-section-title" style={{ borderLeftColor: 'var(--intel-accent)', marginBottom: '1.25rem' }}>
              <i className="fas fa-microscope"></i> Medical Research
            </h3>
            <div className="medical-tech-list-view" style={{ display: 'flex', flexDirection: 'column' }}>
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
            <div className="medical-tech-list-view" style={{ display: 'flex', flexDirection: 'column' }}>
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
            <div className="latest-insights-desktop latest-insights-list">
              {latestArticles.slice(0, 10).map((article) => (
                <BbcCard key={article.id} article={article} isList={true} />
              ))}
            </div>

            <div className="latest-insights-mobile latest-insights-list">
              {latestArticles.slice(0, 8).map((article) => (
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
                <div className="latest-insights-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {alertArticles.map(article => (
                    <BbcCard key={article.id} article={article} isList={true} />
                  ))}
                </div>
             </div>

             {/* Must Read */}
             <div style={{ marginTop: '3rem' }}>
                <h3 className="intelligence-section-title" style={{ borderLeftColor: 'var(--primary)', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                  <i className="fas fa-bookmark" style={{ color: 'var(--primary)' }}></i> Must Read
                </h3>
                <div className="latest-insights-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {mustReadArticles.map(article => (
                    <BbcCard key={article.id} article={article} isList={true} />
                  ))}
                </div>
             </div>

             {/* Health Days Awareness (Conditional) */}
             {activeHealthDay && healthDayArticles.length > 0 && (
               <div style={{ marginTop: '3rem' }}>
                  <h3 className="intelligence-section-title" style={{ borderLeftColor: '#f59e0b', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                    <i className="fas fa-calendar-check" style={{ color: '#f59e0b' }}></i> Health Days: {activeHealthDay.name}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {healthDayArticles.map(article => (
                      <Link key={article.id} href={`/article/${article.slug || article.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg">
                          <div style={{ width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                            <Image src={article.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200"} alt="" fill sizes="80px" style={{ objectFit: 'cover' }} />
                          </div>
                          <div>
                            <span style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                              Awareness Event
                            </span>
                            <h4 style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.3, fontWeight: 700 }}>{article.title}</h4>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      </section>



      {/* 5. NIGERIA & AFRICA HEALTH */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-split-layout">
          {/* Main Column */}
          <div className="split-main-column">
            <h3 className="intelligence-section-title section-title-desktop-stack" style={{ borderLeftColor: 'var(--intel-blue)', marginBottom: '1.25rem', fontSize: '1.5rem' }}>
              <i className="fas fa-globe-africa" style={{ fontSize: '1.2rem', opacity: 0.8 }}></i> Nigeria & Africa Health
            </h3>
            <div className="section-grid-mobile">
              {nigeriaArticlesFiltered.map((article, i) => {
                let isSmall = i >= 2;
                
                return (
                  <div key={article.id} className={`editorial-card-col ${i === 0 ? "mobile-featured-row" : ""}`}>
                    <BbcCard article={article} isSmall={isSmall} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="split-sidebar-column">
            <div className="gov-news-sidebar">
              <h4 className="gov-sidebar-header">
                <i className="fas fa-landmark" style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}></i> Official & Agency Updates
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {nigeriaGovArticles.length > 0 ? nigeriaGovArticles.map(article => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="gov-sidebar-item-link">
                    <div className="gov-sidebar-item">
                      <div className="gov-sidebar-img-wrapper">
                        <Image src={article.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200"} alt="" fill sizes="90px" style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="gov-sidebar-meta-content">
                        <span className="gov-sidebar-tag">
                          {article.category || 'Official News'}
                        </span>
                        <h5 className="gov-sidebar-title">
                          {article.title}
                        </h5>
                        <span className="gov-sidebar-date">
                          {formatDate(article.created_at || article.date)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No recent public health briefings available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. GLOBAL HEALTH INSIGHTS */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-split-layout">
          {/* Main Column */}
          <div className="split-main-column">
            <h3 className="intelligence-section-title section-title-desktop-stack" style={{ borderLeftColor: 'var(--accent)', marginBottom: '1.25rem', fontSize: '1.5rem' }}>
              <i className="fas fa-globe" style={{ fontSize: '1.2rem', opacity: 0.8 }}></i> Global Health Insights
            </h3>
            <div className="section-grid-mobile">
              {globalArticlesFiltered.map((article, i) => {
                let isSmall = i >= 2;

                return (
                  <div key={article.id} className={`editorial-card-col ${i === 0 ? "mobile-featured-row" : ""}`}>
                    <BbcCard article={article} isSmall={isSmall} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="split-sidebar-column">
            <div className="gov-news-sidebar">
              <h4 className="gov-sidebar-header">
                <i className="fas fa-globe-americas" style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}></i> Institutional Briefings
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {globalGovArticles.length > 0 ? globalGovArticles.map(article => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="gov-sidebar-item-link">
                    <div className="gov-sidebar-item">
                      <div className="gov-sidebar-img-wrapper">
                        <Image src={article.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200"} alt="" fill sizes="90px" style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="gov-sidebar-meta-content">
                        <span className="gov-sidebar-tag">
                          {article.category || 'Global Report'}
                        </span>
                        <h5 className="gov-sidebar-title">
                          {article.title}
                        </h5>
                        <span className="gov-sidebar-date">
                          {formatDate(article.created_at || article.date)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No recent institutional briefings available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WEATHER & ENVIRONMENT */}
      <section className="bbc-homepage-wrapper" style={{ marginBottom: '1.25rem' }}>
        <h3 className="intelligence-section-title section-title-desktop-stack" style={{ borderLeftColor: 'var(--primary)', marginBottom: '1.25rem', fontSize: '1.5rem' }}>
          <i className="fas fa-cloud-sun-rain" style={{ fontSize: '1.2rem', opacity: 0.8, color: 'var(--primary)' }}></i> Weather & Climate Health
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

      {/* 8. ADDITIONAL COVERAGE */}
      {remainingArticles.length > 0 && (
        <section className="bbc-homepage-wrapper" style={{ marginBottom: '3rem', marginTop: '3rem' }}>
          <h3 className="intelligence-section-title" style={{ borderLeftColor: '#6b7280', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
            <i className="fas fa-newspaper" style={{ fontSize: '1.2rem', opacity: 0.8, color: '#6b7280', marginRight: '0.5rem' }}></i> Additional Coverage
          </h3>

          {/* Desktop split layout */}
          {sidebarRemaining.length > 0 ? (
            <div className="editorial-split-layout additional-coverage-split mobile-hide">
              {/* Main Column */}
              <div className="split-main-column">
                <div className="additional-coverage-desktop-main-grid">
                  {mainRemaining.map((article) => (
                    <div key={article.id} className="additional-coverage-item">
                      <BbcCard article={article} isSmall={true} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Column */}
              <div>
                <div className="gov-news-sidebar" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {sidebarRemaining.map((article) => (
                      <Link key={article.id} href={`/article/${article.slug || article.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }} className="gov-sidebar-item-link">
                        <div className="additional-coverage-desktop-list-item">
                          <span className="gov-sidebar-tag">
                            {article.category || 'More News'}
                          </span>
                          <h5 className="additional-coverage-desktop-list-title">
                            {article.title}
                          </h5>
                          <span className="gov-sidebar-date">
                            {formatDate(article.created_at || article.date)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop fallback grid when not enough articles to split */
            <div className="additional-coverage-grid mobile-hide">
              {remainingArticles.map((article) => (
                <div key={article.id} className="additional-coverage-item">
                  <BbcCard article={article} isSmall={true} />
                </div>
              ))}
            </div>
          )}

          {/* Mobile-only rotating grid layout */}
          <div className="additional-coverage-grid desktop-hide">
            {remainingArticles.map((article) => (
              <div key={article.id} className="additional-coverage-item">
                <BbcCard article={article} isSmall={true} />
              </div>
            ))}
          </div>
        </section>
      )}


      <style dangerouslySetInnerHTML={{ __html: `
        .additional-coverage-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          width: 100%;
        }

        .additional-coverage-desktop-main-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          width: 100%;
          align-content: start;
        }

        .additional-coverage-desktop-list-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          transition: opacity 0.15s ease-in-out;
        }

        .additional-coverage-desktop-list-item:hover {
          opacity: 0.85;
        }

        .additional-coverage-desktop-list-title {
          font-size: 0.85rem;
          margin: 0;
          font-weight: 700;
          line-height: 1.35;
          font-family: var(--font-news);
          color: var(--primary-dark);
        }

        .additional-coverage-desktop-list-item:hover .additional-coverage-desktop-list-title {
          text-decoration: underline !important;
        }

        .additional-coverage-item {
          width: 100%;
        }

        .additional-coverage-split {
          align-items: start !important;
        }

        .additional-coverage-split .gov-news-sidebar {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .additional-coverage-split .gov-news-sidebar > div {
          flex: 1;
          justify-content: space-between;
        }

        @media (min-width: 1024px) {
          .desktop-hide {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .additional-coverage-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }

          /* Single-column mobile layout */
          .additional-coverage-grid > * {
            grid-column: span 1 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
        }

        /* Desktop split layout styling for regional grids and government sidebars */
        .editorial-split-layout {
          display: grid;
          grid-template-columns: 2.8fr 1.2fr;
          gap: 2.5rem;
          align-items: start;
        }

        .section-grid-mobile {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          width: 100%;
        }

        .editorial-card-col {
          width: 100%;
        }

        .split-sidebar-column {
          position: sticky;
          top: 100px;
        }

        .gov-news-sidebar {
          border-left: 1px solid var(--border);
          padding-left: 1.5rem;
        }

        .gov-sidebar-header {
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--primary);
          border-bottom: 2px solid var(--primary);
          padding-bottom: 0.6rem;
          margin-bottom: 1.25rem;
          font-family: var(--font-main);
        }

        .gov-sidebar-item-link {
          text-decoration: none;
          color: var(--text);
          display: block;
        }

        .gov-sidebar-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          transition: opacity 0.15s ease-in-out;
        }

        .gov-sidebar-item:hover {
          opacity: 0.85;
        }

        .gov-sidebar-item:hover .gov-sidebar-title {
          text-decoration: underline !important;
        }

        .gov-sidebar-img-wrapper {
          width: 90px;
          height: 65px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid var(--border);
          border-radius: 0px !important;
        }

        .gov-sidebar-meta-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .gov-sidebar-tag {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--primary-light);
          letter-spacing: 0.04em;
        }

        .gov-sidebar-title {
          font-size: 0.85rem;
          margin: 0;
          font-weight: 700;
          line-height: 1.3;
          font-family: var(--font-news);
          color: var(--primary-dark);
        }

        .gov-sidebar-date {
          font-size: 0.65rem;
          color: var(--text-light);
        }

        @media (max-width: 1023px) {
          .editorial-split-layout {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          
          .gov-news-sidebar {
            border-left: none !important;
            border-top: 1px solid var(--border) !important;
            padding-left: 0 !important;
            padding-top: 1.5rem !important;
            margin-top: 1rem !important;
          }
          
          .split-sidebar-column {
            position: static !important;
          }

          .container { padding: 0 !important; }
          .bbc-homepage-wrapper { padding-left: 0 !important; padding-right: 0 !important; }
          
          .main-editorial-grid { 
            grid-template-columns: 1fr !important; 
            gap: 1.5rem !important; 
          }
          
          .mobile-hide { display: none !important; }
          
          .latest-insights-desktop { display: none !important; }
          
          .latest-insights-mobile {
            display: flex !important;
            flex-direction: column !important;
            gap: 1rem !important;
            width: 100% !important;
          }

          .latest-insights-mobile > *,
          .section-grid-mobile > * {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }

          .latest-insights-list .bbc-list-card {
            flex-direction: row !important;
            align-items: center !important;
            gap: 0.75rem !important;
            padding: 0.75rem 0 !important;
            border-bottom: 1px solid var(--border) !important;
          }

          .latest-insights-list .bbc-list-card .bbc-card-image {
            width: 96px !important;
            height: 68px !important;
            flex: 0 0 96px !important;
            border-radius: 0 !important;
          }

          .latest-insights-list .bbc-list-card .bbc-card-content {
            padding: 0 !important;
          }

          .latest-insights-list .bbc-list-card .bbc-card-title {
            font-size: 0.85rem !important;
            line-height: 1.25 !important;
          }

          .latest-insights-list .bbc-list-card .bbc-card-meta {
            font-size: 0.65rem !important;
          }

          .latest-insights-list .bbc-list-card .bbc-card-excerpt {
            display: none !important;
          }

          .medical-tech-list-view .bbc-list-card {
            flex-direction: row !important;
            align-items: center !important;
            gap: 0.75rem !important;
            padding: 0.75rem 0 !important;
            border-bottom: 1px solid var(--border) !important;
          }

          .medical-tech-list-view .bbc-list-card .bbc-card-image {
            width: 96px !important;
            height: 68px !important;
            flex: 0 0 96px !important;
            border-radius: 0 !important;
          }

          .medical-tech-list-view .bbc-list-card .bbc-card-content {
            padding: 0 !important;
          }

          .medical-tech-list-view .bbc-list-card .bbc-card-title {
            font-size: 0.85rem !important;
            line-height: 1.25 !important;
          }

          .medical-tech-list-view .bbc-list-card .bbc-card-meta {
            font-size: 0.65rem !important;
          }

          .medical-tech-list-view .bbc-list-card .bbc-card-excerpt {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
