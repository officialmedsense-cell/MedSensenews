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

async function checkArticle() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content, created_at')
    .ilike('title', '%Diagnostic Dilemma%');

  if (error) {
    console.error(error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log("Article not found!");
    return;
  }

  const art = articles[0];
  console.log("Title:", art.title);
  console.log("Created At:", art.created_at);
  console.log("Content length:", art.content ? art.content.length : 0);
  
  const content = art.content || "";
  console.log("Contains 'Executive Summary':", content.toLowerCase().includes("executive summary"));
  console.log("Contains 'Medical Review: MedSense':", content.toLowerCase().includes("medical review: medsense"));
  console.log("Contains 'Key Takeaways':", content.toLowerCase().includes("key takeaways"));
  console.log("Contains 'Frequently Asked Questions':", content.toLowerCase().includes("frequently asked questions"));
  
  console.log("\nLast 500 chars of content:");
  console.log(content.slice(-500));
}

checkArticle();
