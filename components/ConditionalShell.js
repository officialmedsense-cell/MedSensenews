'use client';

import { usePathname } from 'next/navigation';

/**
 * Wraps the main site chrome (header + footer).
 * On /editor routes the header and footer are hidden so the
 * dashboard renders as a fully standalone page.
 */
export default function ConditionalShell({ header, footer, children }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/mseditor242') || pathname.startsWith('/medsense_dashboard');

  if (isDashboard) {
    // Editor pages: no header, no footer, no <main> padding
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}
