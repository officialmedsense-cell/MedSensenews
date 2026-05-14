import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 3600;

const categories = [
  { name: 'Health', icon: 'fa-heartbeat', description: 'General wellness, fitness, and healthcare news.' },
  { name: 'Medicine', icon: 'fa-stethoscope', description: 'Clinical updates, treatments, and medical advancements.' },
  { name: 'Research', icon: 'fa-microscope', description: 'Peer-reviewed studies and clinical findings.' },

  { name: 'Health Alerts', icon: 'fa-exclamation-triangle', description: 'Urgent public health notices and outbreak alerts.' },
  { name: 'Technology', icon: 'fa-microchip', description: 'AI in healthcare, biotech, and digital medicine.' },
  { name: 'Public Health', icon: 'fa-users', description: 'Global health policy, epidemiology, and community health.' },
  { name: 'Nigeria Health', icon: 'fa-map-marker-alt', description: 'Local health updates and policy in Nigeria.' },
  { name: 'Africa Health', icon: 'fa-globe-africa', description: 'Health news from across the African continent.' }
];

export default async function CategoriesPage() {
  return (
    <div className="container" style={{ marginTop: '5rem', marginBottom: '8rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="intelligence-section-title" style={{ justifyContent: 'center', borderLeft: 'none' }}>
          Explore Medical Sectors
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', opacity: 0.7 }}>
          Browse our specialized medical journalism hubs for deep-dives into various healthcare domains.
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '2rem' 
      }}>
        {categories.map(cat => (
          <Link key={cat.name} href={`/category/${cat.name}`} style={{ 
            textDecoration: 'none', 
            color: 'inherit',
            background: 'var(--bg-secondary)',
            padding: '2.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }} className="category-hover-card">
            <i className={`fas ${cat.icon}`} style={{ 
              fontSize: '2.5rem', 
              color: 'var(--intel-blue)', 
              marginBottom: '1.5rem' 
            }}></i>
            <h3 style={{ margin: '0 0 1rem 0', fontFamily: 'var(--font-news)', fontSize: '1.5rem' }}>{cat.name}</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>{cat.description}</p>
          </Link>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .category-hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border-color: var(--intel-blue);
          background: white;
        }
      `}} />
    </div>
  );
}
