import Link from 'next/link';
import Image from 'next/image';

export default function BbcCard({ article, isFeatured = false, isList = false, isSmall = false }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // If it's a simple YYYY-MM-DD, parse as local to avoid UTC shift
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

  return (
    <Link 
      href={`/article/${article.slug || article.id}`} 
      className={`bbc-article-card ${isFeatured ? 'bbc-featured-card' : ''} ${isList ? 'bbc-list-card' : ''} ${isSmall ? 'bbc-small-card' : ''} ${article.category === 'Health Alerts' ? 'alert-card-border' : ''}`} 
      style={{ textDecoration: 'none' }}
    >
      <div className="bbc-card-image" style={{ position: 'relative' }}>
        <Image 
          src={article.image} 
          alt={article.title} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
        />

        {article.category === 'Health Alerts' && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5 }}>
            <span className="fact-check-badge" style={{ background: 'var(--alert-red)' }}>
              <i className="fas fa-exclamation-triangle"></i> Urgent Alert
            </span>
          </div>
        )}
      </div>
      <div className="bbc-card-content">
        <div className="bbc-card-meta">
          <span className="bbc-card-category">
            {article.category}
          </span>
          <span>{formatDate(article.created_at || article.date)}</span>
        </div>
        <h3 className="bbc-card-title">{article.title}</h3>
        {!isSmall && article.excerpt && <p className="bbc-card-excerpt">{article.excerpt}</p>}
      </div>
    </Link>
  );
}
