import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildEmailHtml({ title, excerpt, category, author, image, articleId, subscriberEmail }) {
  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://medsensenews.com'}/article/${articleId}`;
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://medsensenews.com'}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;

  const categoryColors = {
    'Health':        '#0ea5e9',
    'Medicine':      '#8b5cf6',
    'Research':      '#059669',
    'Public Health': '#f59e0b',
    'Technology':    '#ef4444',
  };
  const catColor = categoryColors[category] || '#1e3a8a';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1e3a8a;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
            <img src="https://ufiirgbphacmlcgszqdx.supabase.co/storage/v1/object/public/article-images/logo.png"
                 alt="MedSense News" height="36"
                 style="height:36px;object-fit:contain;"
                 onerror="this.style.display='none'" />
            <p style="color:rgba(255,255,255,0.75);font-size:12px;margin:10px 0 0;letter-spacing:2px;text-transform:uppercase;">
              Breaking Medical News Alert
            </p>
          </td>
        </tr>

        <!-- Hero Image -->
        ${image ? `
        <tr>
          <td style="background:#fff;padding:0;">
            <img src="${image}" alt="${title}" width="600"
                 style="width:100%;max-width:600px;height:280px;object-fit:cover;display:block;" />
          </td>
        </tr>` : ''}

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <!-- Category pill -->
            <div style="margin-bottom:16px;">
              <span style="display:inline-block;background:${catColor};color:#fff;padding:5px 14px;border-radius:100px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                ${category}
              </span>
            </div>

            <!-- Title -->
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;line-height:1.3;color:#0f172a;">
              ${title}
            </h1>

            <!-- Meta -->
            <p style="margin:0 0 20px;font-size:13px;color:#64748b;">
              By <strong style="color:#1e3a8a;">${author}</strong>
              &nbsp;·&nbsp;
              ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <!-- Divider -->
            <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 24px;" />

            <!-- Excerpt -->
            <p style="margin:0 0 28px;font-size:16px;line-height:1.75;color:#334155;">
              ${excerpt}
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin-bottom:8px;">
              <a href="${articleUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#0ea5e9);color:#fff;text-decoration:none;padding:14px 36px;border-radius:100px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                Read Full Article →
              </a>
            </div>

          </td>
        </tr>

        <!-- Social links -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 12px;font-size:13px;color:#64748b;font-weight:600;">Follow MedSense News</p>
            <a href="https://web.facebook.com/people/MedSense-News/61579693413492" style="display:inline-block;margin:0 6px;color:#1e3a8a;text-decoration:none;font-size:13px;">Facebook</a>
            <a href="https://x.com/MedsenseN" style="display:inline-block;margin:0 6px;color:#1e3a8a;text-decoration:none;font-size:13px;">X / Twitter</a>
            <a href="https://www.instagram.com/medsensenews/" style="display:inline-block;margin:0 6px;color:#1e3a8a;text-decoration:none;font-size:13px;">Instagram</a>
            <a href="https://www.linkedin.com/in/medsense-news-72a2473bb" style="display:inline-block;margin:0 6px;color:#1e3a8a;text-decoration:none;font-size:13px;">LinkedIn</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1e3a8a;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.9);font-size:13px;">
              © ${new Date().getFullYear()} MedSense News · Powered by MedSense Network
            </p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">
              You're receiving this because you subscribed to MedSense News alerts.
              &nbsp;<a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.7);text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ── POST handler: send newsletter to all active subscribers ──────────────────

export async function POST(request) {
  try {
    const { articleId, title, excerpt, category, author, image } = await request.json();

    if (!articleId || !title) {
      return NextResponse.json({ error: 'Missing article data.' }, { status: 400 });
    }

    // Fetch all active subscribers
    const { data: subscribers, error: dbError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email, name, categories')
      .eq('status', 'active');

    if (dbError) throw dbError;
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers. Article published without email blast.' });
    }

    // Filter by category preference if subscriber has preferences set
    const targets = subscribers.filter(s => {
      if (!s.categories || s.categories.length === 0) return true; // no filter = gets everything
      return s.categories.includes(category);
    });

    if (targets.length === 0) {
      return NextResponse.json({ message: 'No subscribers interested in this category.' });
    }

    // Resend free plan: batch in groups of 100 (rate limit safety)
    const BATCH = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < targets.length; i += BATCH) {
      const batch = targets.slice(i, i + BATCH);

      await Promise.allSettled(
        batch.map(subscriber =>
          resend.emails.send({
            from: 'MedSense News <onboarding@resend.dev>',
            to: subscriber.email,
            subject: `📰 ${title}`,
            html: buildEmailHtml({
              title,
              excerpt: excerpt || '',
              category: category || 'Health',
              author: author || 'MedSense Editorial Team',
              image,
              articleId,
              subscriberEmail: subscriber.email,
            }),
          }).then(() => { sent++; }).catch(() => { failed++; })
        )
      );
    }

    return NextResponse.json({
      message: `Newsletter sent to ${sent} subscriber(s).${failed > 0 ? ` (${failed} failed)` : ''}`,
      sent,
      failed,
      total: targets.length,
    });

  } catch (err) {
    console.error('[Newsletter Send]', err);
    return NextResponse.json({ error: err.message || 'Send failed.' }, { status: 500 });
  }
}
