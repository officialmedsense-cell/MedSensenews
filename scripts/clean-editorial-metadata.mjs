import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
  envConfig.forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove inline comments and trailing quotes
      value = value.split(' #')[0].trim();
      value = value.replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.PUBLICATION_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLICATION_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing required Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanEditorialMetadata() {
  console.log("Fetching all articles to check for Editorial Metadata boxes...");
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content');

  if (error) {
    console.error("Failed to fetch articles:", error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log("No articles found in database.");
    return;
  }

  console.log(`Analyzing ${articles.length} articles...`);

  // Target the metadata boxes (with varying spaces or quotes)
  const metadataRegex = /<div style="margin-top:\s*40px;\s*padding:\s*20px;\s*background:\s*#f8f9fa;[^>]*>[\s\S]*?<\/div>/gi;

  let cleanedCount = 0;

  for (const article of articles) {
    const content = article.content || "";
    if (metadataRegex.test(content)) {
      console.log(`Cleaning metadata box from: "${article.title}"`);
      
      // Strip the metadata box completely
      const cleanedContent = content.replace(metadataRegex, "").trim();

      // Ensure the "Medical Review: MedSense Editorial Board" disclaimer is always present
      let finalContent = cleanedContent;
      const disclaimer = "Medical Review: MedSense Editorial Board";
      if (!finalContent.includes(disclaimer)) {
        finalContent += `\n\n<hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />\n<p style="font-size: 12px; color: #888;"><em>Medical Review: MedSense Editorial Board</em></p>`;
      }

      const { error: updateError } = await supabase
        .from('articles')
        .update({ content: finalContent })
        .eq('id', article.id);

      if (updateError) {
        console.error(`✗ Failed to update: "${article.title}":`, updateError.message);
      } else {
        console.log(`✓ Cleaned & updated: "${article.title}"`);
        cleanedCount++;
      }
    }
  }

  console.log(`\nCleanup complete! Cleaned and updated ${cleanedCount} articles.`);
}

cleanEditorialMetadata();
