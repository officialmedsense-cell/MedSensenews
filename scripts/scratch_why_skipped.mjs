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

async function checkWhy() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content, created_at');

  if (error) {
    console.error(error);
    return;
  }

  const notUpgraded = articles.filter(r => !r.content || !r.content.includes("Medical Review: MedSense Editorial Board"));
  
  console.log("Not Upgraded Count:", notUpgraded.length);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 3);

  notUpgraded.slice(0, 10).forEach(art => {
    const isNew = new Date(art.created_at) >= cutoffDate;
    const hasExec = art.content && art.content.includes("Executive Summary");
    const hasMed = art.content && art.content.includes("Medical Review: MedSense");
    const hasKey = art.content && art.content.includes("Key Takeaways");
    const hasFaq = art.content && art.content.includes("Frequently Asked Questions");
    const isHub = art.title === "SYSTEM_HUBS_CONFIG";

    console.log(`\nTitle: ${art.title}`);
    console.log(`Created At: ${art.created_at}`);
    console.log(`Is in last 3 days: ${isNew}`);
    console.log(`Has Executive Summary: ${hasExec}`);
    console.log(`Has Medical Review: ${hasMed}`);
    console.log(`Has Key Takeaways: ${hasKey}`);
    console.log(`Has FAQ: ${hasFaq}`);
    console.log(`Is Hub Config: ${isHub}`);
  });
}

checkWhy();
