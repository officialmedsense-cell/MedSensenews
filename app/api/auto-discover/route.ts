import { NextResponse } from 'next/server';
import { DEFAULT_AUTO_PUBLISH_CONFIG } from '@/app/(dashboard)/MedSense_Dashboard/automation-config';
import {
  fetchLiveMedicalNews,
  getAutoPublishConfigFromCloud,
  getSourcesFromCloud,
  processArticleWithAI,
  publishToNewsSite,
  saveAutoPublishConfigToCloud
} from '@/app/(dashboard)/MedSense_Dashboard/actions';

// Security: Only Vercel's cron service can call this
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

function getZonedClockParts(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const lookup = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const hour = lookup.hour === '24' ? '00' : lookup.hour;
    const dateKey = `${lookup.year}-${lookup.month}-${lookup.day}`;
    const timeKey = `${hour}:${lookup.minute}`;

    return { dateKey, timeKey };
  } catch {
    return {
      dateKey: date.toISOString().slice(0, 10),
      timeKey: date.toISOString().slice(11, 16)
    };
  }
}

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
    timestamp: new Date().toISOString()
  };

  try {
    console.log('[AutoDiscover] Starting scheduled news discovery...');

    const configResult = await getAutoPublishConfigFromCloud();
    const config = configResult.success
      ? { ...DEFAULT_AUTO_PUBLISH_CONFIG, ...configResult.config }
      : DEFAULT_AUTO_PUBLISH_CONFIG;

    if (!config.enabled) {
      return NextResponse.json({
        ...results,
        skipped: true,
        reason: 'Auto publish is disabled.',
        schedule: {
          enabled: config.enabled,
          scheduledTime: config.scheduledTime,
          timezone: config.timezone
        }
      });
    }

    const now = new Date();
    const zoned = getZonedClockParts(now, config.timezone || DEFAULT_AUTO_PUBLISH_CONFIG.timezone);

    // Hobby plan compatibility check:
    // Since Vercel Hobby accounts only allow daily cron jobs (e.g., "0 0 * * *"),
    // the cron is only executed once per day. To ensure the scheduler runs successfully
    // in this environment, we bypass the strict minute alignment and run once per calendar day.
    const isDailyCron = true; 

    if (!isDailyCron && zoned.timeKey !== config.scheduledTime) {
      return NextResponse.json({
        ...results,
        skipped: true,
        reason: `Current time (${zoned.timeKey}) does not match schedule (${config.scheduledTime}).`,
        schedule: {
          enabled: config.enabled,
          scheduledTime: config.scheduledTime,
          timezone: config.timezone,
          currentTime: zoned.timeKey,
          currentDate: zoned.dateKey
        }
      });
    }

    const alreadyRanToday = isDailyCron 
      ? config.lastRunDate === zoned.dateKey 
      : (config.lastRunDate === zoned.dateKey && config.lastRunTime === config.scheduledTime);

    if (alreadyRanToday) {
      return NextResponse.json({
        ...results,
        skipped: true,
        reason: isDailyCron 
          ? 'Auto publish already ran today.' 
          : 'Auto publish already ran for this scheduled slot today.',
        schedule: {
          enabled: config.enabled,
          scheduledTime: config.scheduledTime,
          timezone: config.timezone,
          currentTime: zoned.timeKey,
          currentDate: zoned.dateKey,
          lastRunAt: config.lastRunAt
        }
      });
    }

    const sourceResult = await getSourcesFromCloud();
    const sourceUrls = sourceResult.success && Array.isArray(sourceResult.sources)
      ? sourceResult.sources.map((source: any) => source?.url).filter(Boolean)
      : [];

    // 1. Fetch live medical news
    const newsResult = await fetchLiveMedicalNews(sourceUrls, Number(config.freshnessWindow || 24));
    if (!newsResult.success || !newsResult.articles?.length) {
      return NextResponse.json({ ...results, error: 'No articles fetched from feeds.' });
    }

    results.fetched = newsResult.articles.length;
    console.log(`[AutoDiscover] Fetched ${results.fetched} articles.`);

    for (const article of newsResult.articles) {
      try {
        const aiResult = await processArticleWithAI(
          {
            title: article.title,
            summary: article.summary,
            fullText: article.fullText || article.summary,
            sourceUrl: article.sourceUrl,
            originalImage: article.originalImage
          },
          config.aiModel || DEFAULT_AUTO_PUBLISH_CONFIG.aiModel,
          config.tone || DEFAULT_AUTO_PUBLISH_CONFIG.tone
        );

        if (!aiResult.success || !aiResult.transformed) {
          results.failed++;
          results.errors.push(`AI failed for: "${article.title?.substring(0, 40)}"`);
          continue;
        }

        const pubResult = await publishToNewsSite({
          headline: aiResult.transformed.title,
          category: aiResult.transformed.category || 'Health',
          author: config.authorName || 'Damilare',
          summary: aiResult.transformed.summary,
          fullReport: aiResult.transformed.content,
          visualKeyword: aiResult.transformed.visual_keyword,
          originalImage: aiResult.transformed.originalImage,
          sourceUrl: article.sourceUrl,
          status: aiResult.transformed.status === 'ready' ? 'published' : 'draft'
        });

        if (pubResult.success) {
          results.published++;
          console.log(`[AutoDiscover] Published: "${aiResult.transformed.title?.substring(0, 50)}"`);
        } else {
          // Duplicate articles are expected and not a real error.
          const duplicateError = pubResult.error?.toLowerCase() || '';
          if (duplicateError.includes('duplicate') || duplicateError.includes('already exists')) {
            console.log(`[AutoDiscover] Skipped duplicate: "${aiResult.transformed.title?.substring(0, 40)}"`);
          } else {
            results.failed++;
            results.errors.push(pubResult.error || 'Unknown publish error');
          }
        }

        // Small delay to avoid hitting API rate limits (1.0 second)
        await new Promise(r => setTimeout(r, 1000));
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message || 'Unexpected error');
      }
    }

    await saveAutoPublishConfigToCloud({
      ...config,
      lastRunAt: new Date().toISOString(),
      lastRunDate: zoned.dateKey,
      lastRunTime: zoned.timeKey,
      lastResult: `Published ${results.published}, failed ${results.failed}`
    });

    console.log(`[AutoDiscover] Done. Published: ${results.published}, Failed: ${results.failed}`);
    return NextResponse.json(results);
  } catch (err: any) {
    console.error('[AutoDiscover] Fatal error:', err);
    return NextResponse.json({ ...results, error: err.message }, { status: 500 });
  }
}
