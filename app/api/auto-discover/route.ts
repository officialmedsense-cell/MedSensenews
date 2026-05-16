import { NextResponse } from 'next/server';
import { fetchLiveMedicalNews, processArticleWithAI, publishToNewsSite, searchExternalNews } from '@/app/(dashboard)/MedSense_Dashboard/actions';
import { HEALTH_DAYS } from '@/lib/healthDays';

// Security: Only Vercel's cron service can call this
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    fetched: 0,
    published: 0,
    failed: 0,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('[AutoDiscover] Starting scheduled news discovery...');

    // 1. Fetch live medical news
    const newsResult = await fetchLiveMedicalNews();
    if (!newsResult.success || !newsResult.articles?.length) {
      return NextResponse.json({ ...results, error: 'No articles fetched from feeds.' });
    }

    results.fetched = newsResult.articles.length;
    console.log(`[AutoDiscover] Fetched ${results.fetched} articles.`);

    // 1.5 Special Logic: Official Health Day Priority
    const today = new Date();
    const activeHealthDay = HEALTH_DAYS.find(d => d.month === today.getMonth() && d.day === today.getDate());
    
    if (activeHealthDay) {
      console.log(`[AutoDiscover] Official Health Day Detected: ${activeHealthDay.name}. Prioritizing awareness coverage.`);
      const awarenessNews = await searchExternalNews(activeHealthDay.name);
      if (awarenessNews.success && awarenessNews.articles?.length > 0) {
        // Prepend the official awareness news to ensure it gets processed first
        newsResult.articles.unshift({
          ...awarenessNews.articles[0],
          summary: `Today is ${activeHealthDay.name}. This global observance highlights the critical importance of ${activeHealthDay.keywords.join(', ')} in modern medicine.`,
          fullText: `Global health authorities including the WHO and UN are observing ${activeHealthDay.name} today. This annual event serves as a vital platform for raising awareness and mobilizing international efforts to address challenges related to ${activeHealthDay.keywords[0]}.`,
          originalImage: null,
          source: 'World Health Organization',
          pubDate: today.toISOString()
        });
      }
    }
    for (const article of newsResult.articles) {
      try {
        const aiResult = await processArticleWithAI(
          {
            title: article.title,
            summary: article.summary,
            fullText: article.fullText || article.summary,
            sourceUrl: article.sourceUrl,
            originalImage: article.originalImage,
          },
          'mistral-small-latest',
          'urgent and journalistic — with a powerful, call-to-action headline that commands immediate reader attention'
        );

        if (!aiResult.success || !aiResult.transformed) {
          results.failed++;
          results.errors.push(`AI failed for: "${article.title?.substring(0, 40)}"`);
          continue;
        }

        const pubResult = await publishToNewsSite({
          headline: aiResult.transformed.title,
          category: aiResult.transformed.category || 'Health',
          author: 'Damilare',
          summary: aiResult.transformed.summary,
          fullReport: aiResult.transformed.content,
          visualKeyword: aiResult.transformed.visual_keyword,
          originalImage: aiResult.transformed.originalImage,
          sourceUrl: article.sourceUrl,
        });

        if (pubResult.success) {
          results.published++;
          console.log(`[AutoDiscover] Published: "${aiResult.transformed.title?.substring(0, 50)}"`);
        } else {
          // Duplicate articles are expected — not a real error
          if (pubResult.error?.includes('Duplicate')) {
            console.log(`[AutoDiscover] Skipped duplicate: "${aiResult.transformed.title?.substring(0, 40)}"`);
          } else {
            results.failed++;
            results.errors.push(pubResult.error || 'Unknown publish error');
          }
        }

        // Small delay to avoid hitting API rate limits
        await new Promise(r => setTimeout(r, 1500));

      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message || 'Unexpected error');
      }
    }

    console.log(`[AutoDiscover] Done. Published: ${results.published}, Failed: ${results.failed}`);
    return NextResponse.json(results);

  } catch (err: any) {
    console.error('[AutoDiscover] Fatal error:', err);
    return NextResponse.json({ ...results, error: err.message }, { status: 500 });
  }
}
