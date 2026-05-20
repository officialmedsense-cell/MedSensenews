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

async function checkFilters() {
  const { data: allArticles } = await supabase
    .from('articles')
    .select('id, title, content, status');

  console.log("Total articles in DB:", allArticles.length);

  const upgradedWithFooter = allArticles.filter(art => 
    art.content && art.content.includes("Medical Review: MedSense Editorial Board")
  );
  
  const upgradedWithExecSummary = allArticles.filter(art => 
    art.content && art.content.includes("Executive Summary")
  );

  const unionUpgraded = allArticles.filter(art => 
    art.content && (
      art.content.includes("Medical Review: MedSense Editorial Board") ||
      art.content.includes("Executive Summary") ||
      art.content.includes("<h3>Key Takeaways</h3>") ||
      art.content.includes("<h3>Frequently Asked Questions</h3>")
    )
  );

  console.log("Articles with Footer:", upgradedWithFooter.length);
  console.log("Articles with Exec Summary:", upgradedWithExecSummary.length);
  console.log("Articles with either Footer or Exec Summary or upgraded templates:", unionUpgraded.length);

  // Let's print the ones that do NOT match the upgraded templates but are published
  const nonUpgradedPublished = allArticles.filter(art => 
    art.status === 'published' && !unionUpgraded.some(u => u.id === art.id)
  );
  console.log("Non-upgraded published articles:", nonUpgradedPublished.length);

  console.log("\nSample non-upgraded published articles:");
  nonUpgradedPublished.slice(0, 10).forEach((art, idx) => {
    console.log(`${idx+1}. ${art.title} (len: ${art.content ? art.content.length : 0})`);
  });
}

checkFilters();
