import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import NavbarActions from '@/components/NavbarActions';
import MobileMenu from '@/components/MobileMenu';
import ScrollToTop from '@/components/ScrollToTop';
import CookieConsent from '@/components/CookieConsent';
import SmartHeader from '@/components/SmartHeader';
import PageLoader from '@/components/PageLoader';
import { Suspense } from 'react';
import LiveClock from '@/components/LiveClock';
import SubscribeModal from '@/components/SubscribeModal';
import NewsletterForm from '@/components/NewsletterForm';
import { supabase } from '@/lib/supabase';
import ConditionalShell from '@/components/ConditionalShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://med-sens-news.vercel.app'),
  title: {
    default: 'MedSense News - Global Health & Medical Breakthroughs',
    template: '%s | MedSense News'
  },
  description: 'Stay informed with MedSense News, your trusted source for professional medical insights, public health updates, and research-driven journalism.',
  robots: {
    index: true,
    follow: true,
  }
};

export const revalidate = 60; 

export default async function SiteLayout({ children }) {
  let breakingNewsText = "Welcome to MedSense News";
  try {
    const { data } = await supabase
      .from('articles')
      .select('title')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(3);
    
    if (data && data.length > 0) {
      breakingNewsText += " \u2022 " + data.map(a => a.title).join(" \u2022 ");
    }
  } catch (err) {}

  const header = (
    <SmartHeader isOuterHeader={true}>
      <div className="navbar-top" style={{ display: 'block' }}>
        <div className="navbar-top-content">
          <div className="desktop-nav-links">
            <LiveClock />
          </div>
          <div className="ticker-label">Breaking</div>
          <div className="breaking-ticker">
            <div className="ticker-text">
              {breakingNewsText}
            </div>
          </div>
        </div>
      </div>

      <nav className="navbar" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div className="navbar-logo-row desktop-logo-row" style={{ 
          display: 'flex',
          alignItems: 'center',
          width: '100%', 
          padding: '0.5rem 2rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <div className="desktop-nav-links">
              <SubscribeModal />
            </div>
          </div>

          <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/" className="logo" style={{ lineHeight: 0 }}>
              <img src="/logo.png" alt="MedSense News" style={{ maxHeight: '34px', objectFit: 'contain' }} />
            </Link>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <NavbarActions />
          </div>
        </div>

        <SmartHeader>
          <div className="navbar-nav-inner" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%', 
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '40px',
            padding: '0 1.5rem'
          }}>
            
            <div className="mobile-menu-container" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <MobileMenu />
            </div>

            <div className="mobile-centered-logo" style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
              <Link href="/" className="logo">
                <img src="/logo.png" alt="MedSense News" style={{ maxHeight: '28px', objectFit: 'contain' }} />
              </Link>
            </div>

            <div className="mobile-subscribe-container" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <SubscribeModal iconOnly={true} />
            </div>

            <nav className="desktop-nav-links">
              <ul style={{ 
                display: 'flex', 
                gap: '2.5rem', 
                listStyle: 'none', 
                margin: 0, 
                padding: 0,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <li>
                  <Link href="/trending" style={{ 
                    textDecoration: 'none', 
                    color: '#ef4444', 
                    fontWeight: 900, 
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <i className="fas fa-fire"></i> Trending
                  </Link>
                </li>
                {['Home', 'Health', 'Medicine', 'Research', 'Global Health', 'Public Health', 'Technology', 'Weather', 'Health Alerts', 'Nigeria/Africa Health'].map(cat => {
                  // Shorthand mapping for top nav to keep it on one line
                  const displayNames = {
                    'Medicine': 'Med',
                    'Global Health': 'Global',
                    'Public Health': 'Public',
                    'Technology': 'Tech',
                    'Health Alerts': 'Alerts',
                    'Nigeria/Africa Health': 'Africa'
                  };
                  return (
                    <li key={cat}>
                      <Link href={cat === 'Home' ? '/' : `/category/${encodeURIComponent(cat)}`} style={{ 
                        textDecoration: 'none', 
                        color: 'var(--text)', 
                        fontWeight: 700, 
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2px'
                      }}>
                        {displayNames[cat] || cat}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </SmartHeader>
      </nav>
    </SmartHeader>
  );

  const footer = (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo footer-logo">
              <div className="logo-icon">
                <img src="/logo.png" alt="MedSense News" />
              </div>
            </Link>
            <p>Your trusted source for global health news, medical breakthroughs, and public health updates. Delivering accurate information to keep you informed and healthy.</p>
            <div className="social-links" style={{ marginTop: '1.5rem' }}>
                <a href="https://web.facebook.com/people/MedSense-News/61579693413492" target="_blank" rel="noopener" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                <a href="https://x.com/MedsenseN" target="_blank" rel="noopener" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                <a href="https://www.linkedin.com/in/medsense-news-72a2473bb" target="_blank" rel="noopener" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                <a href="https://www.instagram.com/medsensenews/" target="_blank" rel="noopener" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="https://youtube.com/@medsensenews?si=FOOZPFr1iDFstftyA" target="_blank" rel="noopener" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
                <a href="https://whatsapp.com/channel/0029Vb66g7lL7UVPoSLvlA1i" target="_blank" rel="noopener" aria-label="WhatsApp"><i className="fab fa-whatsapp"></i></a>
            </div>
          </div>
          <div className="footer-links-group">
            <div className="footer-links">
              <h4>Categories</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/category/Health">Health</Link></li>
                <li><Link href="/category/Medicine">Medicine</Link></li>
                <li><Link href="/category/Research">Research</Link></li>
                <li><Link href={`/category/${encodeURIComponent('Global Health')}`}>Global Health</Link></li>
                <li><Link href={`/category/${encodeURIComponent('Public Health')}`}>Public Health</Link></li>
                <li><Link href="/category/Technology">Technology</Link></li>
                <li><Link href="/category/Weather">Weather</Link></li>
                <li><Link href={`/category/${encodeURIComponent('Health Alerts')}`}>Health Alerts</Link></li>
                <li><Link href={`/category/${encodeURIComponent('Nigeria/Africa Health')}`}>Nigeria & Africa Health</Link></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-links">
            <h4>Newsletter</h4>
            <p className="newsletter-desc">Subscribe for daily health updates</p>
            <NewsletterForm compact={true} />
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 MedSense News. All rights reserved.</p>
          <div className="footer-bottom-links" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.75rem', opacity: 0.7 }}>
              <a href="/privacy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: 'white', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <div className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
      <Suspense fallback={null}>
        <PageLoader />
      </Suspense>
      <ConditionalShell header={header} footer={footer}>
        {children}
        <ScrollToTop />
        <CookieConsent />
      </ConditionalShell>
    </div>
  );
}
