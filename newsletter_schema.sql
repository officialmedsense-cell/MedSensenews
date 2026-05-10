-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: ufiirgbphacmlcgszqdx

-- 1. Create the newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT,
  categories     TEXT[] DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at  TIMESTAMPTZ DEFAULT now(),
  resubscribed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ
);

-- 2. Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- 3. Row Level Security — only the service role (server-side API) can read/write
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Block all public (anon) access
CREATE POLICY "No public read" ON newsletter_subscribers
  FOR SELECT USING (false);

CREATE POLICY "No public insert" ON newsletter_subscribers
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public update" ON newsletter_subscribers
  FOR UPDATE USING (false);

-- 4. (Optional) View active subscribers count in the editor dashboard
CREATE OR REPLACE VIEW public.newsletter_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active')       AS active_subscribers,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') AS unsubscribed,
  COUNT(*)                                         AS total
FROM newsletter_subscribers;
