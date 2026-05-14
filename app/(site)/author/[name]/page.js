import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

async function getAuthorArticles(authorName) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .eq('author', authorName)
    .order('date', { ascending: false });
  
  if (error) return [];
  return data;
}

export default async function AuthorPage({ params }) {
  const { name } = await params;
  const authorName = decodeURIComponent(name);
  const articles = await getAuthorArticles(authorName);

  if (articles.length === 0) notFound();

  return (
    <div className="container" style={{ marginTop: '3rem', marginBottom: '5rem' }}>
      <header style={{ 
        background: 'var(--intel-navy)', 
        color: 'white', 
        padding: '2.5rem 1.5rem', 
        borderRadius: '16px',
        marginBottom: '3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decoration */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.1, pointerEvents: 'none' }}>
          <i className="fas fa-user-edit"></i>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--intel-blue)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '2rem', 
            fontWeight: 800, 
            margin: '0 auto 1.25rem',
            border: '4px solid rgba(255,255,255,0.2)'
          }}>
            {authorName.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>{authorName}</h1>
          <p style={{ opacity: 0.8, fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
            Health Contributor at MedSense News. Specializing in high-authority medical intelligence and global health discoveries.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
             <span><i className="fas fa-newspaper" style={{ marginRight: '0.5rem', color: 'var(--intel-accent)' }}></i> {articles.length} Articles</span>
             <span><i className="fas fa-check-circle" style={{ marginRight: '0.5rem', color: 'var(--fact-green)' }}></i> Verified Author</span>
          </div>
        </div>
      </header>

      <div className="category-view-container">
        <h3 className="intelligence-section-title" style={{ marginBottom: '2rem' }}>
          Latest from {authorName}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {articles.map(article => (
            <BbcCard key={article.id} article={article} isList={true} />
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          header {
            padding: 2rem 1rem !important;
            border-radius: 0 !important;
            margin-left: -1rem;
            margin-right: -1rem;
          }
          h1 { font-size: 1.6rem !important; }
        }
      `}} />
    </div>
  );
}
