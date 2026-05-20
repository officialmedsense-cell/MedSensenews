import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
  envConfig.forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.split(' #')[0].trim();
      value = value.replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.PUBLICATION_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLICATION_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are missing! Make sure PUBLICATION_SUPABASE_URL and PUBLICATION_SUPABASE_KEY (or service role key) are defined.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function archiveLegacyArticles() {
  console.log("Starting database quarantine migration for legacy thin content...");
  
  // 1. Fetch all published articles
  const { data: publishedArticles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, content, status')
    .eq('status', 'published');

  if (fetchError) {
    console.error("Error fetching published articles:", fetchError);
    process.exit(1);
  }

  console.log(`Total currently published articles in database: ${publishedArticles.length}`);

  // 2. Identify the upgraded vs non-upgraded ones
  const premiumArticles = [];
  const thinArticles = [];

  publishedArticles.forEach(art => {
    const isUpgraded = art.content && (
      art.content.includes("Medical Review: MedSense Editorial Board") ||
      art.content.includes("Executive Summary") ||
      art.content.includes("<h3>Key Takeaways</h3>") ||
      art.content.includes("<h3>Frequently Asked Questions</h3>")
    );

    if (isUpgraded) {
      premiumArticles.push(art);
    } else {
      thinArticles.push(art);
    }
  });

  console.log(`\nPremium (Upgraded) articles detected (will stay published): ${premiumArticles.length}`);
  console.log(`Thin (Legacy) articles detected (will be quarantined to draft): ${thinArticles.length}`);

  if (thinArticles.length === 0) {
    console.log("No thin/scraped articles found that need quarantining. Database is already clean!");
    return;
  }

  // Double check user intention
  console.log("\nSample articles slated for quarantine (status -> 'draft'):");
  thinArticles.slice(0, 5).forEach((art, idx) => {
    console.log(` - [${idx + 1}] ${art.title} (ID: ${art.id}, length: ${art.content ? art.content.length : 0} chars)`);
  });

  // 3. Perform chunked updates
  const chunkSize = 50;
  let totalUpdated = 0;
  
  for (let i = 0; i < thinArticles.length; i += chunkSize) {
    const chunk = thinArticles.slice(i, i + chunkSize);
    const chunkIds = chunk.map(art => art.id);

    console.log(`\nUpdating chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(thinArticles.length / chunkSize)} (${chunkIds.length} articles)...`);

    const { error: updateError } = await supabase
      .from('articles')
      .update({ status: 'draft' })
      .in('id', chunkIds);

    if (updateError) {
      console.error(`Error updating chunk starting at index ${i}:`, updateError);
      process.exit(1);
    }

    totalUpdated += chunkIds.length;
  }

  console.log(`\nSuccess! Successfully quarantined ${totalUpdated} legacy/thin articles to 'draft' status.`);
  console.log(`Exactly ${premiumArticles.length} premium upgraded articles remain as 'published'.`);
}

archiveLegacyArticles().catch(err => {
  console.error("Unhandled error in migration script:", err);
  process.exit(1);
});
