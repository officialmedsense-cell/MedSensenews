import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';

export const revalidate = 60;

async function getAllArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: false });
  
  if (error) return [];
  return data;
}

export default async function NewsPage() {
  const articles = await getAllArticles();

  return (
    <div className="container" style={{ marginTop: '4rem', marginBottom: '8rem' }}>
      <header style={{ marginBottom: '4rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <h1 className="intelligence-section-title" style={{ fontSize: '2.5rem' }}>
          <i className="fas fa-newspaper"></i> The Newsroom
        </h1>
        <p style={{ opacity: 0.6 }}>Exhaustive medical journalism feed covering Nigeria, Africa, and Global Breakthroughs.</p>
      </header>

      <div className="bbc-trending-grid-wrapper" style={{ background: 'transparent', padding: 0 }}>
        <div className="mosaic-stories-grid">
          {articles.map((article, i) => {
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
  );
}
