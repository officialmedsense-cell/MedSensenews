import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import CommentSection from '@/components/CommentSection';
import BbcCard from '@/components/BbcCard';
import SocialShare from '@/components/SocialShare';

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
    // 1. Fetch from same category
    const { data: categoryArticles } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .neq('id', currentId)
      .limit(8);

    let otherArticles = categoryArticles || [];

    // 2. If less than 8, fill with latest published articles
    if (otherArticles.length < 8) {
      const excludeIds = [currentId, ...otherArticles.map(a => a.id)];
      const { data: latestArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('date', { ascending: false })
        .limit(8 - otherArticles.length);
      
      if (latestArticles) {
        otherArticles = [...otherArticles, ...latestArticles];
      }
    }
    return otherArticles;
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

  const otherArticles = await getOtherArticles(article.id, article.category);

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
        hour12: true
      });
    }
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
    <article className="article-container">
      <header className="article-header">
        <span className="category-tag article-category">{article.category}</span>
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          <div className="author-info">
            <div className="author-avatar">
              {article.author.charAt(0).toUpperCase()}
            </div>
            <span>By {article.author}</span>
          </div>
          &bull; 
          <span>{formatDate(article.date)}</span>
        </div>
      </header>

      <div className="image-branding-wrapper article-main-image-container" style={{ position: 'relative', width: '100%' }}>
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
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />

        <SocialShare 
          url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://med-sens-news.vercel.app'}/article/${article.slug || article.id}`} 
          title={article.title} 
        />



      <CommentSection articleId={article.id} />
    </article>

    {otherArticles.length > 0 && (
      <section className="bbc-trending-grid-wrapper other-news-section" style={{ background: 'var(--bg-secondary)', padding: '3rem 0', borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
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
