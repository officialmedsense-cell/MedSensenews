import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';

export const revalidate = 60; // Revalidate every minute

async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: false });
  
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

  // Distribution for the CNN/BBC 3-Column Layout
  const featuredArticle = articles[0]; // Center Column
  const leftColumnArticles = articles.slice(1, 3); // Left Column
  const rightColumnArticles = articles.slice(3, 5); // Right Column
  const remainingArticles = articles.slice(5); // All remaining news

  // 15 Latest articles
  const trendingArticles = articles.slice(0, 15);

  return (
    <>
      <div className="bbc-homepage-wrapper">
        <div className="bbc-top-section">
          {/* Left Column */}
          <div className="bbc-side-column">
            {leftColumnArticles.map(article => (
              <BbcCard key={article.id} article={article} />
            ))}
          </div>

          {/* Center Column - Featured Main Story */}
          {featuredArticle && (
            <BbcCard article={featuredArticle} isFeatured={true} />
          )}

          {/* Right Column */}
          <div className="bbc-side-column">
            {rightColumnArticles.map(article => (
              <BbcCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom More Stories Section */}
      {remainingArticles.length > 0 && (
        <div className="bbc-trending-wrapper">
          <div className="bbc-homepage-wrapper" style={{ minHeight: 'auto', paddingTop: 0 }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
              More Top Stories
            </h3>
            <div className="mosaic-stories-grid">
              {remainingArticles.map((article, i) => {
                const pos = i % 6;
                let sizeClass = 'mosaic-small';
                if (pos === 0) sizeClass = 'mosaic-big';
                else if (pos === 1 || pos === 2) sizeClass = 'mosaic-medium';
                return (
                  <div key={article.id} className={sizeClass}>
                    <BbcCard article={article} isFeatured={pos === 0} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Latest News - Horizontal Scroll */}
      {trendingArticles.length > 0 && (
        <div className="bbc-trending-grid-wrapper" style={{ background: 'var(--bg-secondary)', padding: '4rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="bbc-homepage-wrapper" style={{ minHeight: 'auto', paddingTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                <i className="fas fa-bolt" style={{ marginRight: '0.5rem', color: 'var(--accent)' }}></i>Latest
              </h3>
              <div style={{ flex: 1, height: '2px', background: 'var(--border)' }}></div>
            </div>
            <div className="trending-scroll-track">
              {trendingArticles.map(article => (
                <div key={article.id} className="trending-scroll-card">
                  <BbcCard article={article} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
