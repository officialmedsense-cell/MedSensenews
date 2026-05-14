'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When the path or search changes, it means navigation completed
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for all clicks on the page
    const handleClick = (e) => {
      // Find the nearest anchor tag
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      
      // Only trigger for internal links that aren't the same page
      if (href && href.startsWith('/') && !href.startsWith('#')) {
        const currentPath = window.location.pathname + window.location.search;
        if (href !== currentPath) {
          setLoading(true);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      zIndex: 9999,
      background: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden'
    }}>
      <div className="loader-bar"></div>
      <style dangerouslySetInnerHTML={{ __html: `
        .loader-bar {
          height: 100%;
          background: var(--intel-accent);
          width: 0;
          box-shadow: 0 0 10px var(--intel-accent);
          animation: progress 2s cubic-bezier(0.1, 0, 0.45, 1) forwards;
        }
        @keyframes progress {
          0% { width: 0; }
          20% { width: 40%; }
          50% { width: 70%; }
          100% { width: 95%; }
        }
      `}} />
    </div>
  );
}
