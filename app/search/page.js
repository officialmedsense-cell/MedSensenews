import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';

export const revalidate = 60;

export default async function SearchPage({ searchParams }) {
  const query = (await searchParams).q || '';

  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    .order('date', { ascending: false });

  return (
    <div className="bbc-homepage-wrapper" style={{ minHeight: '80vh', padding: '2rem 1.5rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Search Results
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
          {articles?.length || 0} results found for "{query}"
        </p>
        <div style={{ height: '4px', background: 'var(--primary)', width: '60px', margin: '1.5rem auto' }}></div>
      </header>

      {articles && articles.length > 0 ? (
        <div className="other-news-grid">
          {articles.map((article) => (
            <div key={article.id}>
              <BbcCard article={article} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔍</div>
          <h2>No articles found</h2>
          <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
            Try searching for something else, like "Malaria" or "Vaccines".
          </p>
          <a 
            href="/" 
            style={{ 
              display: 'inline-block', 
              marginTop: '2rem', 
              color: 'var(--primary)', 
              fontWeight: 'bold',
              textDecoration: 'none',
              borderBottom: '2px solid var(--primary)'
            }}
          >
            Back to Home
          </a>
        </div>
      )}
    </div>
  );
}
