'use client';

import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    // Set immediately on mount
    setNow(new Date());
    // Update every second
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Africa/Lagos'
  });

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Lagos'
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      whiteSpace: 'nowrap',
      fontSize: '0.75rem',
      fontWeight: 600,
      opacity: 0.9,
      letterSpacing: '0.3px',
      paddingRight: '1rem',
      borderRight: '1px solid rgba(255,255,255,0.3)',
      marginRight: '0.5rem',
      flexShrink: 0,
    }}>
      <i className="fas fa-clock" style={{ fontSize: '0.7rem' }} />
      <span>{dateStr}</span>
      <span style={{ opacity: 0.7 }}>|</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
    </div>
  );
}
