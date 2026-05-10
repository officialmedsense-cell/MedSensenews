import { supabase } from '@/lib/supabase';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://med-sens-news.vercel.app';

  // Static routes
  const routes = ['', '/about', '/careers', '/contact', '/privacy', '/terms', '/category/Health', '/category/Medicine', '/category/Research', '/category/Public%20Health', '/category/Technology'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: route === '' ? 1 : 0.8,
    })
  );

  // Dynamic article routes
  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('id, date, slug')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(100);

    if (articles) {
      const articleRoutes = articles.map((article) => ({
        url: `${baseUrl}/article/${article.slug || article.id}`,
        lastModified: new Date(article.date).toISOString(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }));
      return [...routes, ...articleRoutes];
    }
  } catch (error) {
    console.error('Sitemap generation error:', error);
  }

  return routes;
}
