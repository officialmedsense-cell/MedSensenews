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

async function checkUpgraded() {
  const { data: articles } = await supabase
    .from('articles')
    .select('title, content, created_at')
    .ilike('content', '%Executive Summary%')
    .order('created_at', { ascending: false });

  if (!articles || articles.length === 0) {
    console.log("No upgraded articles found.");
    return;
  }

  console.log(`\nFound ${articles.length} upgraded articles total.`);
  console.log(`----------------------------------------`);
  articles.slice(0, 20).forEach((art, idx) => {
    const hasFooter = art.content.includes("Medical Review: MedSense Editorial Board");
    const hasPublicHealth = art.content.includes("Why Public Health Officials Are Concerned");
    console.log(`${idx + 1}. [${hasFooter ? "✓ Footer" : "✗ No Footer"}] [${hasPublicHealth ? "Public Health" : "General Medical"}] ${art.title} (${art.content.length} chars)`);
  });
}

checkUpgraded();
