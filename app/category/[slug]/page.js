import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  return {
    title: `${category} | MedSense News`,
    description: `Latest breaking news and articles in ${category}.`
  };
}

async function getCategoryArticles(category) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .ilike('category', category) // Case-insensitive matching
    .order('date', { ascending: false });
  
  if (error) return [];
  return data;
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  const articles = await getCategoryArticles(category);

  return (
    <div className="container" style={{ marginTop: '3rem', marginBottom: '5rem', minHeight: '60vh' }}>
      <div className="section-header" style={{ marginBottom: '2rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
        <h1 className="article-title" style={{ fontSize: '2.2rem', color: 'var(--primary)', fontWeight: 800 }}>
          {category}
        </h1>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.7 }}>
          <i className="fas fa-newspaper" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
          <p>No articles found for the {category} category yet. Please check back later!</p>
        </div>
      ) : (
        <div className="bbc-bottom-section">
          {articles.map(article => (
            <BbcCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
