import { NextResponse } from 'next/server';
import { fetchLiveMedicalNews, processArticleWithAI, publishToNewsSite } from '@/app/(dashboard)/MedSense_Dashboard/actions';

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

    // 2. Process each article with AI and publish
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
          'mistral-small',
          'professional'
        );

        if (!aiResult.success || !aiResult.transformed) {
          results.failed++;
          results.errors.push(`AI failed for: "${article.title?.substring(0, 40)}"`);
          continue;
        }

        const pubResult = await publishToNewsSite({
          headline: aiResult.transformed.title,
          category: aiResult.transformed.category || 'Health',
          author: 'MedSense AI',
          summary: aiResult.transformed.summary,
          fullReport: aiResult.transformed.content,
          visualKeyword: aiResult.transformed.visual_keyword,
          originalImage: aiResult.transformed.originalImage,
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
