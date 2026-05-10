import Link from 'next/link';

export default function NewsCard({ article }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link href={`/article/${article.id}`} className="news-card">
      <div className="news-card-image">
        <img src={article.image} alt={article.title} loading="lazy" />
        <div className="download-protection-overlay"></div>
      </div>
      <div className="news-card-content">
        <div className="news-card-category">{article.category}</div>
        <h3 className="news-card-title">{article.title}</h3>
        <p className="news-card-excerpt">{article.excerpt}</p>
        <div className="news-card-meta">
          <span>By {article.author}</span>
          <span>{formatDate(article.date)}</span>
        </div>
      </div>
    </Link>
  );
}
