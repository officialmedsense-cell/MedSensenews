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
  console.error("Error: Supabase environment variables are missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreLegacyArticles() {
  console.log("Restoring legacy articles back to 'published' status as requested...");

  // 1. Fetch all draft articles that are not system configurations
  const { data: draftArticles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, status')
    .eq('status', 'draft')
    .neq('title', 'SYSTEM_HUBS_CONFIG');

  if (fetchError) {
    console.error("Error fetching draft articles:", fetchError);
    process.exit(1);
  }

  console.log(`Total quarantined draft articles found: ${draftArticles.length}`);

  if (draftArticles.length === 0) {
    console.log("No quarantined draft articles found to restore. Database is already in the desired state.");
    return;
  }

  // 2. Perform chunked updates back to 'published'
  const chunkSize = 50;
  let totalRestored = 0;

  for (let i = 0; i < draftArticles.length; i += chunkSize) {
    const chunk = draftArticles.slice(i, i + chunkSize);
    const chunkIds = chunk.map(art => art.id);

    console.log(`Restoring chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(draftArticles.length / chunkSize)} (${chunkIds.length} articles)...`);

    const { error: updateError } = await supabase
      .from('articles')
      .update({ status: 'published' })
      .in('id', chunkIds);

    if (updateError) {
      console.error(`Error updating chunk starting at index ${i}:`, updateError);
      process.exit(1);
    }

    totalRestored += chunkIds.length;
  }

  console.log(`\nSuccess! Reverted ${totalRestored} legacy articles back to 'published' status.`);
}

restoreLegacyArticles().catch(err => {
  console.error("Unhandled error in restoration script:", err);
  process.exit(1);
});
