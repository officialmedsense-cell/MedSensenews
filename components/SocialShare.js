'use client';

export default function SocialShare({ url, title }) {
  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`,
      color: '#25D366'
    },
    {
      name: 'X (Twitter)',
      icon: '𝕏',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: '#000000'
    },
    {
      name: 'Facebook',
      icon: 'f',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: '#1877F2'
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: '#0077B5'
    }
  ];

  return (
    <div className="social-share">
      <span className="share-label">SHARE</span>
      <div className="share-buttons">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn"
            style={{ '--brand-color': link.color }}
            title={`Share on ${link.name}`}
          >
            <span className="share-icon">{link.icon}</span>
          </a>
        ))}
        <button 
          className="share-btn copy-btn" 
          onClick={() => {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
          }}
          title="Copy Link"
        >
          <span>🔗</span>
        </button>
      </div>
    </div>
  );
}
