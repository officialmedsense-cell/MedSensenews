import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response('<h2>Invalid unsubscribe link.</h2>', { headers: { 'Content-Type': 'text/html' }, status: 400 });
  }

  try {
    await supabaseAdmin
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('email', decodeURIComponent(email).toLowerCase().trim());

    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed – MedSense News</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 16px; padding: 48px 40px; max-width: 440px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; background: #1e3a8a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">👋</div>
    <h1>You've been unsubscribed</h1>
    <p>We're sorry to see you go. You will no longer receive newsletter emails from MedSense News.</p>
    <a href="/">Return to MedSense News</a>
  </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });

  } catch (err) {
    return new Response('<h2>Error processing your request. Please try again.</h2>', { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}
