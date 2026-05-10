import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';

export const revalidate = 60;

export default async function TrendingPage() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(10);

  return (
    <div className="bbc-homepage-wrapper" style={{ minHeight: '80vh', padding: '2rem 1.5rem' }}>
      <header style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: '#ef4444', 
          fontWeight: '800', 
          fontSize: '0.9rem', 
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '1rem'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
          Trending Now
        </div>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'var(--font-news)' }}>
          Popular Stories
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          The most read medical news and health insights on MedSense right now.
        </p>
        <div style={{ height: '4px', background: 'var(--primary)', width: '80px', margin: '2rem auto' }}></div>
      </header>

      {articles && articles.length > 0 ? (
        <div className="other-news-grid">
          {articles.map((article, index) => (
            <div key={article.id} style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: '-15px', 
                left: '10px', 
                fontSize: '4rem', 
                fontWeight: '900', 
                color: 'var(--primary)', 
                opacity: 0.1, 
                zIndex: 0,
                pointerEvents: 'none',
                fontFamily: 'var(--font-news)'
              }}>
                {index + 1}
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <BbcCard article={article} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p>The trending list is being compiled. Check back soon!</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          70% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
