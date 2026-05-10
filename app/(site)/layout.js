import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import NavbarActions from '@/components/NavbarActions';
import MobileMenu from '@/components/MobileMenu';
import SmartHeader from '@/components/SmartHeader';
import LiveClock from '@/components/LiveClock';
import SubscribeModal from '@/components/SubscribeModal';
import NewsletterForm from '@/components/NewsletterForm';
import { supabase } from '@/lib/supabase';

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

  return (
    <div className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
      <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--bg)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
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
            padding: '1rem 2rem',
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
              justifyContent: 'center', 
              alignItems: 'center', 
              width: '100%', 
              position: 'relative',
              minHeight: '50px'
            }}>
              
              <div className="mobile-menu-btn" style={{ position: 'absolute', left: '1.5rem' }}>
                <MobileMenu />
              </div>

              <div className="mobile-centered-logo">
                <Link href="/" className="logo">
                  <img src="/logo.png" alt="MedSense News" style={{ maxHeight: '28px', objectFit: 'contain' }} />
                </Link>
              </div>

              <div className="mobile-menu-btn" style={{ position: 'absolute', right: '1.5rem' }}>
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
                  {['Home', 'Health', 'Medicine', 'Research', 'Public Health', 'Technology'].map(cat => (
                    <li key={cat}>
                      <Link href={cat === 'Home' ? '/' : `/category/${cat}`} style={{ 
                        textDecoration: 'none', 
                        color: 'var(--text)', 
                        fontWeight: 700, 
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>{cat}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </SmartHeader>
        </nav>
      </header>

      <main>{children}</main>

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
                  <li><a href="/category/Health">Health</a></li>
                  <li><a href="/category/Medicine">Medicine</a></li>
                  <li><a href="/category/Research">Research</a></li>
                  <li><a href="/category/Public Health">Public Health</a></li>
                  <li><a href="/category/Technology">Technology</a></li>
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
            <p>&copy; 2026 MedSense News. All rights reserved. Powered by MedSense Network.</p>
            <div className="footer-bottom-links" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.75rem', opacity: 0.7 }}>
                <a href="/privacy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</a>
                <a href="/terms" style={{ color: 'white', textDecoration: 'none' }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
