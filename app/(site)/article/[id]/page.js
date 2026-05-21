import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import CommentSection from '@/components/CommentSection';
import BbcCard from '@/components/BbcCard';
import SocialShare from '@/components/SocialShare';
import AudioPlayer from '@/components/AudioPlayer';

export const revalidate = 3600; // Cache articles for 1 hour

async function getArticle(identifier) {
  // 1. Try ID if numeric
  if (/^\d+$/.test(identifier)) {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('id', identifier)
      .single();
    if (data) return data;
  }

  // 2. Try Slug
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', identifier)
    .single();
  
  return data;
}

async function getOtherArticles(currentId, category) {
  try {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .neq('id', currentId)
      .order('date', { ascending: false })
      .limit(20);

    return data || [];
  } catch (err) {
    console.error('Error fetching other articles:', err);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: 'Article Not Found' };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://med-sens-news.vercel.app';
  
  return {
    title: `${article.title} | MedSense News`,
    description: article.excerpt,
    alternates: {
      canonical: `${baseUrl}/article/${article.slug || article.id}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${baseUrl}/article/${article.slug || article.id}`,
      siteName: 'MedSense News',
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      images: [
        {
          url: article.image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  
  if (!article) notFound();

  // Increment view count (Smart Tracking)
  await supabase.rpc('increment_article_views', { article_id: article.id });

  const otherArticles = await getOtherArticles(article.id, article.category);

  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const wordsPerMinute = 225;
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const readingTime = calculateReadingTime(article.content);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // If it's a simple YYYY-MM-DD, parse as local to avoid UTC shift
    if (dateString.length === 10 && dateString.includes('-')) {
      const [y, m, d] = dateString.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Lagos'
      });
    }
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos'
    });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': article.title,
    'description': article.excerpt,
    'image': [article.image],
    'datePublished': article.date,
    'dateModified': article.date,
    'author': [{
      '@type': 'Person',
      'name': article.author,
    }],
    'publisher': {
      '@type': 'Organization',
      'name': 'MedSense News',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://ufiirgbphacmlcgszqdx.supabase.co/storage/v1/object/public/article-images/logo.png'
      }
    }
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <article className="article-container" style={{ paddingBottom: '4rem' }}>
      <header className="article-header">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span className="category-tag article-category" style={{ margin: 0 }}>{article.category}</span>

          {article.category === 'Research' && (
            <span className="fact-check-badge" style={{ background: 'var(--intel-blue)' }}>
              <i className="fas fa-microscope"></i> Peer Reviewed
            </span>
          )}
        </div>

        <h1 className="article-title">{article.title}</h1>
        
        <div className="article-meta" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '2rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div className="author-info">
            <div className="author-avatar" style={{ background: 'var(--intel-blue)' }}>
              {article.author.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, color: 'var(--text)' }}>{article.author}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{formatDate(article.created_at || article.date)}</span>
          </div>
        </div>
      </header>

      <AudioPlayer 
        title={article.title}
        author={article.author}
        excerpt={article.excerpt}
        content={article.content}
      />

      <div className="image-branding-wrapper article-main-image-container" style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '3rem' }}>
        <Image 
          src={article.image} 
          alt={article.title} 
          fill
          priority
          style={{ objectFit: 'cover' }}
          className="article-image" 
        />
        <div className="download-protection-overlay"></div>
      </div>

        <div 
          className="article-content"
          style={{ fontSize: '1.2rem', lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />



        <div style={{ margin: '3rem 0' }}>
          <SocialShare 
            url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://med-sens-news.vercel.app'}/article/${article.slug || article.id}`} 
            title={article.title} 
          />
        </div>

        {/* MedSense News Copyright Notice */}
        <div className="medsense-copyright-notice" style={{
          marginTop: '2.5rem',
          padding: '1.5rem',
          borderTop: '4px solid var(--intel-blue)',
          borderRadius: '0 0 8px 8px',
          background: 'var(--bg-secondary)',
        }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary, inherit)',
            lineHeight: '1.8',
            margin: 0,
            opacity: 1
          }}>
            <strong style={{ 
              display: 'block',
              fontSize: '14px', 
              marginBottom: '6px',
              color: 'var(--text-primary, inherit)',
              letterSpacing: '0.01em'
            }}>
              © {new Date().getFullYear()} MedSense News. All rights reserved.
            </strong>
            Unauthorized reproduction, distribution, modification, or commercial use of any content on this platform without prior written permission is strictly prohibited. For licensing, partnerships, or research inquiries, contact the MedSense News.
          </p>
        </div>

      <CommentSection articleId={article.id} />
    </article>

    {otherArticles.length > 0 && (
      <section className="bbc-trending-grid-wrapper other-news-section" style={{ background: 'var(--bg)', padding: '3rem 0', borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
        <div className="bbc-homepage-wrapper" style={{ minHeight: 'auto', paddingTop: 0 }}>
          <div className="other-news-header">
            <h3 className="other-news-title">More News For You</h3>
            <div className="other-news-line"></div>
          </div>
          
          <div className="other-news-grid">
            {otherArticles.map(item => (
              <div key={item.id} className="other-news-item">
                <BbcCard article={item} />
              </div>
            ))}
          </div>
        </div>
      </section>
    )}
  </>
);
}
