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

// Support both publication keys or next public keys
const supabaseUrl = process.env.PUBLICATION_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLICATION_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mistralApiKey = process.env.MISTRAL_API_KEY;

if (!supabaseUrl || !supabaseKey || !mistralApiKey) {
  console.error("Missing required environment variables.");
  console.log("Supabase URL:", !!supabaseUrl);
  console.log("Supabase Key:", !!supabaseKey);
  console.log("Mistral API Key:", !!mistralApiKey);
  process.exit(1);
}

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
11. STRICT WRITING RULE: NEVER use hyphens (-), en-dashes (–), or em-dashes (—) anywhere in your output, neither in the headline nor the body text. Use commas, colons, parentheses, or other punctuation instead. Any use of a hyphen or dash is a complete failure.
12. NO FABRICATED EXPERTS: NEVER invent experts, institutions, quotes, studies, statistics, or commentary that cannot be verified publicly. If no verified expert quote exists in the original source, omit the expert commentary section entirely.
13. REDUCE REPETITION: Avoid re-explaining the same concept multiple times or repeating phrases.
14. CONCISE & DENSE: Prioritize concise, information-dense journalism over excessive expansion. Keep paragraphs tighter and more natural to mimic professional newsroom writing patterns.
15. REAL CITATIONS: Include mentions of real journal references or reputable organizations (e.g. WHO, CDC, NIH, major universities, published peer-reviewed studies) if applicable to the topic.
16. BRADING & AUTHOR CREDENTIALS: Add "Medical Review: MedSense Editorial Board" at the very end of the article text.
17. GENETIC / STATISTICAL CLAIM RULE: Never include precise genetic percentages, epidemiological figures, or study-specific statistics unless they are explicitly provided from verified sources in the input article. If uncertain, generalize the claim or remove numerical specificity.

OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure:
{
  "headline": "",
  "seo_title": "",
  "meta_description": "",
  "category": "",
  "opening": "",
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

ARTICLE REQUIREMENTS:
The upgraded article must include:
1. Strong Professional Headline
2. Natural journalistic opening (lede paragraphs formatted as HTML <p> tags — NO heading, NO label)
3. Structured Article Sections (Use standard HTML <h3>, <p>, <ul> tags. Do NOT use markdown ## for headers, use proper <h3> HTML tags. DO NOT output \`\`\`html markdown blocks inside the JSON string.)
4. Add Public Health Context or Clinical Significance
5. Add Human Value
6. SEO Optimization
7. FAQ Section
8. Key Takeaways
9. Quality Score

STRUCTURAL REQUIREMENTS:
* For Public Health Topics (outbreaks, epidemics, disease surveillance, healthcare policy, environmental health, vaccination, food safety, or population health):
  1. Focus on public safety and awareness.
  2. Explain why the issue matters to communities and healthcare systems.
  3. Include prevention guidance where medically appropriate.
  4. Discuss affected populations or regions.
  5. Explain transmission risks where relevant.
  6. Include healthcare preparedness or government response when applicable.
  7. Avoid fearmongering or panic-driven language.
  8. Maintain calm, evidence-based reporting.
  9. Emphasize practical health education and awareness.
  10. Prioritize clarity and accessibility for general readers.
  11. Style: Write like a professional global health/public health newsroom similar to Reuters Health, WHO reports, Health Policy Watch, or major medical journalism platforms.
  12. Inside the JSON "article" field, structure the HTML content using these headers (using <h3> HTML tags):
    - <h3>What Happened</h3>
    - <h3>Why Public Health Officials Are Concerned</h3>
    - <h3>Symptoms or Risk Factors</h3> (if applicable)
    - <h3>Who May Be Affected</h3>
    - <h3>Government or WHO Response</h3> (if applicable)
    - <h3>Prevention and Safety Guidance</h3>
    - <h3>What Readers Should Know</h3>

* For General Medical/Clinical Research Topics (supplement news, clinical trials, medical tech, biology research):
  1. Style: Professional medical journalism tone.
  2. Inside the JSON "article" field, structure the HTML content using these headers (using <h3> HTML tags):
    - <h3>Clinical Significance</h3>
    - <h3>Deep Dive and Research Findings</h3>
    - <h3>Future Outlook and Medical Implications</h3>
    - <h3>Patient or Practitioner Guidance</h3>

STYLE GUIDELINES:
* Professional medical journalism tone
* Clean formatting
* Clear readability
* No sensationalism
* No emojis
* No excessive hype
* No generic AI phrases
* No repeated sentence patterns

TARGET LENGTH: 800-1600 words. Keep it within this sweet spot for SEO and readability.
IMPORTANT: The final article must feel like it was written by an experienced health newsroom editor for a legitimate medical publication.`;

async function upgradeBatch() {
  console.log("Fetching up to 20 old articles to upgrade...");
  
  // Find articles that don't have the new format
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 3); // Protect recent news by not upgrading articles created in the last 3 days

  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .not('content', 'ilike', '%Executive Summary%')
    .not('content', 'ilike', '%Medical Review: MedSense%')
    .not('content', 'ilike', '%Key Takeaways%')
    .not('content', 'ilike', '%Frequently Asked Questions%')
    .neq('title', 'SYSTEM_HUBS_CONFIG')
    .lt('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true }) // Start from the oldest articles first
    .limit(20);

  if (error) {
    console.error("Failed to fetch articles:", error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log("No older articles found to upgrade!");
    return;
  }

  console.log(`Found ${articles.length} articles to upgrade. Starting process...`);

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i+1}/${articles.length}] Upgrading article: ${article.title}`);

    let attempts = 0;
    const maxAttempts = 5;
    let retryDelayMs = 15000; // start with 15s delay
    let success = false;
    let data;

    while (attempts < maxAttempts && !success) {
      try {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${mistralApiKey}`
          },
          body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [
              { role: "system", content: PROMPT },
              { role: "user", content: `ORIGINAL ARTICLE:\nTitle: ${article.title}\n\nContent:\n${article.content}` }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (response.status === 429) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.error(`[MISTRAL] Rate limit hit (429). Max retries reached for: ${article.title}`);
            break;
          }
          console.warn(`[MISTRAL] Rate limit hit (429). Retrying in ${retryDelayMs / 1000}s... (Attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          retryDelayMs *= 2; // Exponential backoff
          continue;
        }

        if (!response.ok) {
          console.error(`Mistral API error for ${article.title}: ${response.status}`);
          const errText = await response.text();
          console.error(errText);
          break; // break loop on non-429 errors
        }

        data = await response.json();
        success = true;
      } catch (err) {
        console.error(`Fetch error during attempt for ${article.title}:`, err.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        retryDelayMs *= 2;
      }
    }

    if (!success) {
      console.log(`Skipping article due to consecutive errors: ${article.title}`);
      continue;
    }

    try {
      const rawJson = data.choices[0].message.content;
      const result = JSON.parse(rawJson.replace(/```json/gi, '').replace(/```/g, '').trim());

      // Ensure article HTML does not have markdown blocks
      let articleBody = result.article || "";
      articleBody = articleBody.replace(/```html/g, '').replace(/```/g, '').trim();

      // Helper functions inside script to sanitize
      function sanitizeDashesAndHyphens(text) {
        if (!text) return "";
        let cleaned = text
          .replace(/\s*[—–]\s*/g, ", ")
          .replace(/[—–]/g, ", ")
          .replace(/(\w)-(\w)/g, "$1 $2")
          .replace(/-/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        cleaned = cleaned
          .replace(/(\w)remove$/gi, "$1")
          .replace(/(\w)share$/gi, "$1")
          .replace(/\s+remove$/gi, "")
          .replace(/\s+share$/gi, "");
        return cleaned.trim();
      }

      function sanitizeObjectStrings(obj) {
        if (typeof obj === "string") return sanitizeDashesAndHyphens(obj);
        if (Array.isArray(obj)) return obj.map(item => sanitizeObjectStrings(item));
        if (obj !== null && typeof obj === "object") {
          const newObj = {};
          for (const key of Object.keys(obj)) {
            if (key === "reviewed_date" || key === "sources" || key === "sourceUrl") {
              newObj[key] = obj[key];
            } else {
              newObj[key] = sanitizeObjectStrings(obj[key]);
            }
          }
          return newObj;
        }
        return obj;
      }

      const cleanResult = sanitizeObjectStrings(result);

      // Format the result back into standard HTML for the "content" column
      let formattedContent = `${cleanResult.opening || ""}

${articleBody}

<h3>Key Takeaways</h3>
<ul>
${(cleanResult.key_takeaways || []).map((t) => `<li>${t}</li>`).join('\n')}
</ul>

<h3>Frequently Asked Questions</h3>
${(cleanResult.faq || []).map((f) => `<h4>${f.question}</h4><p>${f.answer}</p>`).join('\n')}

<hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />
<p style="font-size: 12px; color: #888;"><em>Medical Review: MedSense Editorial Board</em></p>`;

      // Update the DB
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title: result.headline,
          content: formattedContent
        })
        .eq('id', article.id);

      if (updateError) {
        console.error("Failed to update DB for", article.id, updateError);
      } else {
        console.log(`✓ Success: ${result.headline} (Quality: ${result.quality_score})`);
      }

    } catch (err) {
      console.error(`Failed to process ${article.title}:`, err.message);
    }

    // Delay to avoid Mistral rate limits
    console.log("Waiting 15 seconds for API limits...");
    await new Promise(r => setTimeout(r, 15000));
  }

  console.log("\nBatch upgrade complete!");
}

upgradeBatch();
