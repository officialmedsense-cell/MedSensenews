export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://med-sens-news.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/mseditor242/', 
          '/api/', 
          '/admin/', 
          '/dashboard/', 
          '/private/', 
          '/auth/', 
          '/_next/', 
          '/node_modules/',
          '/search?*',
          '/*?session=',
          '/*?ref='
        ],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'Googlebot', 'Bingbot'],
        allow: '/',
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
