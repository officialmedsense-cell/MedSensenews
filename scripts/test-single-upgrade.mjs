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
const mistralApiKey = process.env.MISTRAL_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const PROMPT = `You are a senior medical journalist and public health editor writing for MedSense News, a professional global health and medical intelligence platform.
Your task is to rewrite and significantly upgrade an existing medical news article into a high-value, human-quality editorial health report suitable for Google News, SEO, and AdSense approval.

STRICT RULES:
1. NEVER copy the original wording.
2. NEVER sound robotic or AI-generated.
3. NEVER use repetitive transitions or generic filler.
4. NEVER fabricate medical facts.
5. DO NOT hallucinate sources, quotes, or statistics.
6. Write naturally like a professional health journalist.
7. The article MUST provide genuine educational/public health value.
8. Preserve the core factual event/topic of the original article.
9. Make the article useful to readers, not just informative.
10. Avoid clickbait exaggeration.
11. STRICT WRITING RULE: NEVER use hyphens (-) anywhere in your output, neither in the headline nor the body text. Use commas, colons, or other punctuation instead.
12. NO FABRICATED EXPERTS: NEVER invent experts, institutions, quotes, studies, statistics, or commentary that cannot be verified publicly. If no verified expert quote exists in the original source, omit the expert commentary section entirely.

OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure:
{
  "headline": "",
  "seo_title": "",
  "meta_description": "",
  "category": "",
  "executive_summary": "",
  "article": "",
  "key_takeaways": [],
  "faq": [
    {
      "question": "",
      "answer": ""
    }
  ],
  "tags": [],
  "quality_score": 0
}

TARGET LENGTH: 800-1600 words.`;

async function testSingleUpgrade() {
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .not('content', 'ilike', '%Executive Summary%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!articles || articles.length === 0) {
    console.log("No articles found.");
    return;
  }

  const article = articles[0];
  console.log(`Testing upgrade for: "${article.title}"`);
  console.log(`Content length: ${article.content.length} characters`);

  const models = ["mistral-small-latest", "mistral-large-latest", "open-mixtral-8x7b"];

  for (const model of models) {
    console.log(`\nUsing model: ${model}`);
    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${mistralApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: PROMPT },
            { role: "user", content: `ORIGINAL ARTICLE:\nTitle: ${article.title}\n\nContent:\n${article.content}` }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ SUCCESS with ${model}!`);
        console.log("Response starts with:", data.choices[0].message.content.substring(0, 200));
        break;
      } else {
        console.log(`✗ FAILED with ${model}. Status: ${response.status}`);
        const text = await response.text();
        console.log(text);
      }
    } catch (e) {
      console.log(`Error with ${model}:`, e.message);
    }
  }
}

testSingleUpgrade();
