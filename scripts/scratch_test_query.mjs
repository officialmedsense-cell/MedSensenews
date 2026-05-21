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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 3);

  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .not('content', 'ilike', '%Executive Summary%')
    .not('content', 'ilike', '%Medical Review: MedSense%')
    .not('content', 'ilike', '%Key Takeaways%')
    .not('content', 'ilike', '%Frequently Asked Questions%')
    .neq('title', 'SYSTEM_HUBS_CONFIG')
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    console.error(error);
    return;
  }

  console.log("Query articles found:", articles ? articles.length : 0);
  if (articles && articles.length > 0) {
    articles.forEach(art => {
      console.log(`- ${art.title} (created: ${art.created_at})`);
    });
  }
}

testQuery();
