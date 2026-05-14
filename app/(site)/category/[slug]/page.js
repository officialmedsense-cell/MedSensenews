import { supabase } from '@/lib/supabase';
import BbcCard from '@/components/BbcCard';
import WeatherWidget from '@/components/WeatherWidget';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  return {
    title: `${category} | MedSense News`,
    description: `Latest breaking news and articles in ${category}.`
  };
}

async function getCategoryArticles(category) {
  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published');

  if (category === 'Health Alerts') {
    query = query.or(`category.ilike.Health Alerts,category.ilike.Outbreak,title.ilike.%outbreak%,excerpt.ilike.%outbreak%,title.ilike.%emergency%,excerpt.ilike.%emergency%`);
  } else if (category === 'Weather') {
    query = query.or(`category.ilike.Weather,category.ilike.Environment,title.ilike.%weather%,title.ilike.%climate%,excerpt.ilike.%weather%,excerpt.ilike.%climate%,title.ilike.%storm%,title.ilike.%heat%`);
  } else if (category === 'Global Health') {
    query = query.or(`category.ilike.Global Health,category.ilike.Public Health,title.ilike.%global%,title.ilike.%world%,title.ilike.%who%,title.ilike.%international%,title.ilike.%pandemic%,excerpt.ilike.%global%,excerpt.ilike.%world%`);
  } else if (category === 'Nigeria/Africa Health') {
    query = query.or(`category.ilike.Nigeria/Africa Health,category.ilike.Health,title.ilike.%nigeria%,title.ilike.%africa%,excerpt.ilike.%nigeria%,excerpt.ilike.%africa%`);
  } else {
    query = query.ilike('category', category);
  }

  const { data, error } = await query.order('date', { ascending: false }).limit(200);

  if (error) return [];
  return data;
}

function EditorialCycle({ articles, cycleIndex }) {
  // Desktop Pattern: 2 - 4 - 3 - 8L - 4 - 4 (Total 25)
  // Mobile Pattern:  1 - 3 - 2 - 8L - 3 - 3 ... (Total 20 per set)
  
  // To satisfy both perfectly while sharing content, we'll use a 25-article slice
  // and handle the mobile specific counts using CSS hide/show or just let them flow.
  // However, since the user was very specific, we will render TWO distinct layouts 
  // and toggle them with CSS for zero layout-shift.

  return (
    <div className="cycle-container">
      {cycleIndex > 0 && <hr className="cycle-divider" />}

      {/* DESKTOP EXCLUSIVE VIEW (2-4-3-8L-4-4) */}
      <div className="desktop-cycle-layout">
        <div className="grid-2">{articles.slice(0, 2).map(a => <BbcCard key={a.id} article={a} />)}</div>
        <div className="grid-4">{articles.slice(2, 6).map(a => <BbcCard key={a.id} article={a} />)}</div>
        <div className="grid-3">{articles.slice(6, 9).map(a => <BbcCard key={a.id} article={a} />)}</div>
        <div className="list-section">
          <h3 className="list-header">Editorial Intelligence</h3>
          <div className="list-grid">{articles.slice(9, 17).map(a => <BbcCard key={a.id} article={a} isList={true} />)}</div>
        </div>
        <div className="grid-4">{articles.slice(17, 21).map(a => <BbcCard key={a.id} article={a} />)}</div>
        <div className="grid-4">{articles.slice(21, 25).map(a => <BbcCard key={a.id} article={a} />)}</div>
      </div>

      {/* MOBILE EXCLUSIVE VIEW (Full-Screen + 2-Column Grid) */}
      <div className="mobile-cycle-layout">
        <div className="m-grid-1">{articles.slice(0, 1).map(a => <BbcCard key={a.id} article={a} isFeatured={cycleIndex === 0} />)}</div>
        <div className="m-grid-2">{articles.slice(1, 5).map(a => <BbcCard key={a.id} article={a} />)}</div>
        <div className="list-section">
           <div className="list-grid">{articles.slice(5, 13).map(a => <BbcCard key={a.id} article={a} isList={true} />)}</div>
        </div>
        <div className="m-grid-2">{articles.slice(13, 25).map(a => <BbcCard key={a.id} article={a} />)}</div>
      </div>
    </div>
  );
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  const articles = await getCategoryArticles(category);
  const isWeather = category === 'Weather';

  const cycles = [];
  for (let i = 0; i < articles.length; i += 25) {
    cycles.push(articles.slice(i, i + 25));
  }

  return (
    <div className="container" style={{ marginTop: '2.5rem', marginBottom: '8rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
        <h1 className="article-title" style={{ fontSize: '2.2rem', color: 'var(--intel-navy)', fontWeight: 900, textTransform: 'uppercase' }}>
          {isWeather && <i className="fas fa-cloud-sun-rain" style={{ marginRight: '0.75rem', color: 'var(--intel-blue)' }}></i>}
          {category === 'Nigeria/Africa Health' ? 'Nigeria & Africa Health' : category}
        </h1>
      </div>

      {isWeather && <WeatherWidget />}

      <div className="dynamic-editorial-flow">
        {cycles.map((chunk, index) => (
          <EditorialCycle key={index} articles={chunk} cycleIndex={index} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-cycle-layout { display: none; }
        .desktop-cycle-layout { display: flex; flex-direction: column; gap: 3rem; }
        
        .cycle-divider { border: 0; border-top: 1px solid var(--border); margin: 4rem 0; opacity: 0.5; }
        .grid-2, .grid-3, .grid-4 { display: grid; gap: 1.5rem; }
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }
 
        .list-section { background: var(--bg-secondary); padding: 3rem; border-radius: 12px; }
        .list-header { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; margin-bottom: 2.5rem; color: var(--intel-blue); text-align: center; }
        .list-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.5rem; }
 
        @media (max-width: 1023px) {
          /* Make container fill more screen */
          .container { padding: 0 0.75rem !important; }
          
          .desktop-cycle-layout { display: none; }
          .mobile-cycle-layout { display: flex; flex-direction: column; gap: 1rem; }
          
          .m-grid-1, .m-grid-2 { display: grid; gap: 0.75rem; }
          .m-grid-1 { grid-template-columns: 1fr; }
          .m-grid-2 { grid-template-columns: repeat(2, 1fr); }
 
          .mobile-cycle-layout .list-section { padding: 1.25rem 0.5rem; border-radius: 8px; margin: 0 -0.25rem; }
          .mobile-cycle-layout .list-grid { grid-template-columns: 1fr; gap: 1rem; }
          
          /* Forced 2-column density for consistency */
          .m-grid-2 h3 { font-size: 0.85rem !important; line-height: 1.25 !important; }
          .m-grid-2 p { display: none !important; }
        }
      `}} />
    </div>
  );
}
