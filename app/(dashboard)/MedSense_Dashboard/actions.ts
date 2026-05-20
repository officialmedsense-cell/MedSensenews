"use server";

import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure']
  }
});

/**
 * Sanitizes all types of dashes and hyphens in the text:
 * - Em-dashes (—) and en-dashes (–) are replaced with a clean comma and space (, ).
 * - Hyphens (-) in compound words are replaced with a space.
 * - Lingering/standalone hyphens are replaced with space.
 */
function sanitizeDashesAndHyphens(text: string): string {
  if (!text) return "";
  let cleaned = text
    .replace(/\s*[—–]\s*/g, ", ") // replaces "foo — bar" or "foo—bar" with "foo, bar"
    .replace(/[—–]/g, ", ")
    .replace(/(\w)-(\w)/g, "$1 $2") // "fact-checking" -> "fact checking"
    .replace(/-/g, " ")
    .replace(/\s+/g, " ") // normalize spacing
    .trim();

  // Strip UI artifacts like "remove" or "share" joined or standalone at the end of elements
  cleaned = cleaned
    .replace(/(\w)remove$/gi, "$1") // "Medicineremove" -> "Medicine"
    .replace(/(\w)share$/gi, "$1")
    .replace(/\s+remove$/gi, "")
    .replace(/\s+share$/gi, "");

  return cleaned.trim();
}

/**
 * Recursively walks an object and sanitizes all string values.
 */
function sanitizeObjectStrings(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeDashesAndHyphens(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectStrings(item));
  }
  if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      // Do not sanitize metadata dates or links
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

// --- Global Intelligence Sources (Expanded) ---
const FEEDS = [
  "https://nigeriahealthwatch.com/feed/",
  "https://rss.punchng.com/v1/category/healthwise",
  "https://healthnews.ng/feed/",
  "https://www.medicalnewstoday.com/rss/headlines",
  "https://www.sciencedaily.com/rss/top/health.xml",
  "https://medicalxpress.com/rss-feed/",
  "https://www.who.int/rss-feeds/news-english.xml",
  "https://www.cdc.gov/media/releases/rss-media-releases.xml",
  "https://www.thelancet.com/rssfeed/lancet_current.xml",
  "https://www.nature.com/nature/current_issue/rss",
  "https://feeds.feedburner.com/daily-health-news"
];

// --- Publication Client (MedSense News) ---
const pubUrl = process.env.PUBLICATION_SUPABASE_URL || "";
const pubKey = process.env.PUBLICATION_SUPABASE_KEY || "";
const pubClient = (pubUrl && pubKey) ? createClient(pubUrl, pubKey) : null;

/**
 * Scrapes the clean text content from the original HTML page of a news article.
 * Extracts paragraphs inside <article> or standard containers and cleans up HTML elements.
 */
export async function scrapeFullArticleText(url: string): Promise<string> {
  if (!url || url === "#") return "";
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      next: { revalidate: 3600 }
    });
    if (!res.ok) return "";
    const html = await res.text();

    // 1. Strip scripts, styles, headers, footers, navs, and comments
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // 2. Extract paragraphs inside the main article body container if possible
    const articleMatch = cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i) 
      || cleanHtml.match(/<div[^>]*class="[^"]*(?:article|entry-content|post-content|story-body|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    const contentToParse = articleMatch ? articleMatch[1] : cleanHtml;

    // 3. Extract text from <p> tags
    const pMatches = contentToParse.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (!pMatches) return "";

    const paragraphs = pMatches
      .map(p => {
        let text = p.replace(/<[^>]*>/g, ' ').trim();
        text = text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ');
        return text;
      })
      .filter(text => {
        const lowerText = text.toLowerCase();
        return text.length > 50 && 
          !lowerText.includes('copyright') && 
          !lowerText.includes('all rights reserved') &&
          !lowerText.includes('click here') &&
          !lowerText.includes('follow us') &&
          !lowerText.includes('privacy policy') &&
          !lowerText.includes('terms of service') &&
          !lowerText.includes('read more') &&
          !lowerText.includes('advertisement') &&
          !lowerText.includes('sign up for') &&
          !lowerText.includes('subscribe to');
      });

    return paragraphs.join('\n\n');
  } catch (e) {
    console.error(`[Scraper] Failed to fetch full page from ${url}:`, e);
    return "";
  }
}

/**
 * Live News Discovery
 * Fetches real articles from global medical RSS feeds.
 * Filters for articles published TODAY only.
 */
export async function fetchLiveMedicalNews(customFeeds?: string[], freshnessHours: number = 24) {
  try {
    const allArticles: any[] = [];
    
    // Exclusively use custom Intelligence Hubs if provided, otherwise fallback to global feeds.
    const selectedFeeds = (customFeeds && customFeeds.length > 0) ? customFeeds : FEEDS;
    console.log(`[DISCOVERY] Scanning ${selectedFeeds.length} active hubs...`);
    
    for (const url of selectedFeeds) {
      if (!url || url === "#") continue;
      
      try {
        // Attempt RSS Parsing
        let feed: any;
        try {
           feed = await parser.parseURL(url);
        } catch (rssErr) {
           // More robust headers to bypass basic blocks and accept both JSON & XML
           const res = await fetch(url, { 
             headers: { 
               'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
               'Accept': 'application/json, application/rss+xml, application/xml, text/xml, */*'
             } 
           });
           const text = await res.text();
           try {
              feed = await parser.parseString(text);
           } catch (xmlErr) {
              try {
                 const json = JSON.parse(text);
                 const itemsArray = Array.isArray(json) ? json : (json.articles || json.items || json.data || json.results || [json]); // Fallback to wrap object in array if single
                 
                 feed = {
                   title: json.name || json.title || json.source || (Array.isArray(json) ? "JSON Hub" : "Intelligence Hub"),
                   items: itemsArray.map((item: any) => ({
                     title: item.title || item.headline || item.name || "Untitled Alert",
                     contentSnippet: item.description || item.summary || item.excerpt || "No summary provided.",
                     content: item.content || item.body || item.description || item.summary || "No full content available.",
                     link: item.url || item.link || item.source_url || url,
                     isoDate: item.publishedAt || item.date || item.created_at || new Date().toISOString()
                   }))
                 };
               } catch (jsonErr) {
                  console.warn(`[DISCOVERY] Hub parse failed for URL ${url}. Skipping.`);
                  continue;
               }
           }
        }

        // Freshness Window (Configurable: up to freshnessHours ago, no upper limit delay to get the absolute latest)
        const lowerBound = new Date();
        lowerBound.setHours(lowerBound.getHours() - freshnessHours);
        
        let filtered = feed.items.filter((item: any) => {
          const itemDateString = item.isoDate || item.pubDate;
          if (!itemDateString) return true; // Default to fresh if no date is provided by the feed
          const itemDate = new Date(itemDateString);
          return itemDate >= lowerBound && itemDate <= new Date();
        });

        // Strictly ignore news that is not within the 24-hour window
        if (filtered.length === 0) continue;

        allArticles.push(...filtered.map((item: any) => {
          let imgUrl = null;
          if (item.enclosure && item.enclosure.url) imgUrl = item.enclosure.url;
          else if (item['media:content'] && item['media:content'].$) imgUrl = item['media:content'].$.url;
          else if (item['media:thumbnail'] && item['media:thumbnail'].$) imgUrl = item['media:thumbnail'].$.url;
          else {
            const match = (item.content || item.contentSnippet || '').match(/<img[^>]+src="([^">]+)"/);
            if (match) imgUrl = match[1];
          }

          const content = item.content || item['content:encoded'] || item.contentSnippet || item.description || "";
          const snippet = item.contentSnippet || item['content:encodedSnippet'] || item.description || "No summary available.";
          
          return {
            title: item.title,
            summary: snippet,
            fullText: content,
            originalImage: imgUrl,
            source: feed.title || "Medical Hub",
            sourceUrl: item.link || "#",
            category: "Breaking",
            pubDate: item.isoDate
          };
        }).slice(0, 25)); // Allow up to 25 items per feed for a high-volume intake
      } catch (err) {
        console.error(`Link Failure [${url}]:`, err);
      }
    }

    // --- Deduplication & Database Check ---
    
    // 1. In-memory deduplication (by URL and Title)
    const uniqueMap = new Map();
    allArticles.forEach(art => {
      const key = art.sourceUrl !== "#" ? art.sourceUrl : art.title;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, art);
      }
    });
    
    let deduplicated = Array.from(uniqueMap.values());

    // 2. Database check: Filter out articles that are already published
    // Fetch last 300 articles to perform case/punctuation-insensitive matching in-memory
    try {
      if (pubClient) {
        const normalizeUrl = (url: string) => {
          try {
            const u = new URL(url);
            return (u.origin + u.pathname).toLowerCase().replace(/\/$/, ''); // lowercase and strip trailing slash
          } catch (e) {
            return url.toLowerCase().replace(/\/$/, '');
          }
        };

        const cleanTitle = (t: string) => 
          t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

        const { data: recentArticles } = await pubClient
          .from('articles')
          .select('title, source_url')
          .order('date', { ascending: false })
          .limit(300);

        if (recentArticles && recentArticles.length > 0) {
          const existingUrls = new Set(
            recentArticles
              .map((a: any) => a.source_url ? normalizeUrl(a.source_url) : '')
              .filter(u => u !== '')
          );
          
          const existingTitles = new Set(
            recentArticles
              .map((a: any) => a.title ? cleanTitle(a.title) : '')
              .filter(t => t !== '')
          );
          
          deduplicated = deduplicated.filter(a => {
            const normUrl = a.sourceUrl && a.sourceUrl !== "#" ? normalizeUrl(a.sourceUrl) : '';
            const cleanedTitle = a.title ? cleanTitle(a.title) : '';
            
            const isUrlDup = normUrl !== '' && existingUrls.has(normUrl);
            const isTitleDup = cleanedTitle !== '' && existingTitles.has(cleanedTitle);
            
            return !isUrlDup && !isTitleDup;
          });
        }
      }
    } catch (dbErr) {
      console.error("Duplicate DB check error:", dbErr);
      // Continue with deduplicated list if DB check fails
    }
    
    // Sort each source's articles by date descending
    deduplicated.sort((a, b) => {
      const dateA = new Date(a.pubDate || 0).getTime();
      const dateB = new Date(b.pubDate || 0).getTime();
      return dateB - dateA;
    });

    // Group by source to ensure diversity (Round-Robin interleaving)
    const groupedBySource: Record<string, any[]> = {};
    deduplicated.forEach(art => {
      if (!groupedBySource[art.source]) groupedBySource[art.source] = [];
      groupedBySource[art.source].push(art);
    });

    const interleaved = [];
    let hasMore = true;
    let idx = 0;
    while (hasMore) {
      hasMore = false;
      for (const source in groupedBySource) {
        if (idx < groupedBySource[source].length) {
          interleaved.push(groupedBySource[source][idx]);
          hasMore = true;
        }
      }
      idx++;
    }

    // Take top 200 (most recent but diverse) and randomize their final presentation
    const randomizedTopFeeds = interleaved.slice(0, 200).sort(() => Math.random() - 0.5);

    return {
      success: true,
      articles: randomizedTopFeeds,
      count: randomizedTopFeeds.length
    };
  } catch (error: any) {
    console.error("RSS Fetch Error:", error);
    return { success: false, error: "Failed to reach live news feeds." };
  }
}

/**
 * External News Search
 * Searches Google News for specific topics requested by staff.
 */
export async function searchExternalNews(query: string) {
  try {
    const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+medical+health&hl=en-NG&gl=NG&ceid=NG:en`;
    const response = await fetch(searchUrl);
    const xml = await response.text();
    
    // Minimalistic parser for the purpose of this demo
    const items = xml.split('<item>').slice(1).map(item => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const source = item.match(/<source.*?>(.*?)<\/source>/)?.[1] || "Global News";
      
      return {
        title: title.split(' - ')[0],
        sourceUrl: link,
        date: pubDate,
        source: source,
        category: "Breaking"
      };
    }).slice(0, 5);

    return { success: true, articles: items };
  } catch (err) {
    return { success: false, articles: [] };
  }
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdminKey = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!serviceKey) console.warn("[DB_SECURITY] Service Role Key is missing. Falling back to Anon key.");
const supabase = createClient(supabaseUrl, supabaseAdminKey);

/**
 * MedSense AI Service Action
 * Connects to Mistral AI using your provided API key.
 */
export async function processArticleWithAI(sourceArticle: { title: string, summary: string, fullText: string, sourceUrl: string, originalImage?: string | null }, model: string, tone: string) {
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

  if (!MISTRAL_API_KEY) {
    return { success: false, error: "Mistral API Key is missing." };
  }

  // --- STRONG WEB SCRAPER INTEGRATION ---
  // If the available fullText is very short (less than 300 characters), scrape the actual article page!
  let fullTextToProcess = sourceArticle.fullText || sourceArticle.summary || "";
  if (sourceArticle.sourceUrl && sourceArticle.sourceUrl !== "#" && fullTextToProcess.length < 300) {
    console.log(`[SCRAPER] Content is too short (${fullTextToProcess.length} chars). Activating strong crawler for: ${sourceArticle.sourceUrl}`);
    const scrapedContent = await scrapeFullArticleText(sourceArticle.sourceUrl);
    if (scrapedContent && scrapedContent.length > fullTextToProcess.length) {
      fullTextToProcess = scrapedContent;
      console.log(`[SCRAPER] Successfully scraped high-fidelity content (${fullTextToProcess.length} chars).`);
    } else {
      console.log(`[SCRAPER] Scraper returned no content or shorter text; using feed snippet fallback.`);
    }
  }

  let attempts = 0;
  const maxAttempts = 3;
  let retryDelayMs = 4000;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: model || "mistral-small-latest",
          messages: [
            { 
              role: "system", 
              content: `You are a senior medical journalist and public health editor writing for MedSense News, a professional global health and medical intelligence platform.

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
              11. STRICT WRITING RULE: NEVER use hyphens (-), en-dashes (–), or em-dashes (—) anywhere in your output. Use commas, colons, parentheses, or other punctuation instead. Any use of a hyphen or dash is a complete failure.
              12. STRICT CONTENT FILTER: If the article is primarily about sports, football, general politics, or entertainment, you must set "rejected": true.
              13. NO FABRICATED EXPERTS: NEVER invent experts, institutions, quotes, studies, statistics, or commentary that cannot be verified publicly. If no verified expert quote exists in the original source, omit the expert commentary section entirely.
              14. REDUCE REPETITION: Do not restate the same idea in multiple sections or repeatedly explain concepts already introduced.
              15. CONCISE & DENSE: Prioritize clarity over excessive expansion. Keep articles concise and information-dense. Do not artificially lengthen articles to increase word count. Keep article length proportional to the importance of the story.
              16. AVOID AI FILLER: NEVER use repetitive transitions or generic filler (e.g. "This highlights the importance of", "Serves as a reminder", "In an era where", "Underscores the need for", "Could become a cornerstone"). Use direct journalistic writing instead.
              17. Write with natural newsroom pacing: use tighter paragraphs, vary sentence structure, and avoid overly polished or philosophical transitions.
              18. The tone should resemble Reuters Health, AP Health, Health Policy Watch, or WHO-style reporting.
              19. Focus on factual reporting: what happened, why it matters, who is affected, what officials are doing, what readers should know.
              20. GENETIC / STATISTICAL CLAIM RULE: Never include precise genetic percentages, epidemiological figures, or study-specific statistics unless they are explicitly provided from verified sources in the input article. If uncertain, generalize the claim or remove numerical specificity.

              OUTPUT FORMAT:
              Return ONLY valid JSON in this exact structure:
              {
                "rejected": boolean,
                "headline": "A POWERFUL, professional headline",
                "seo_title": "",
                "meta_description": "",
                "category": "Health, Medicine, Research, Public Health, Technology, or Health Alerts",
                "visual_keyword": "A single specific medical keyword for image searching",
                "opening": "2 to 4 strong journalistic lead paragraphs. NO heading or label. Write as natural prose opening. Answer: what happened, why it matters, who is affected. Tone: Reuters Health lede style.",
                "article": "The main content using HTML <h3>, <p>, <ul>. DO NOT use markdown blocks. DO NOT repeat content from the opening field.",
                "key_takeaways": ["point 1", "point 2"],
                "faq": [{"question": "Q1?", "answer": "A1"}],
                "tags": [],
                "quality_score": 95,
                "metadata": {
                  "reviewed_by": "MedSense Editorial Board",
                  "reviewed_date": "",
                  "sources": [],
                  "fact_checked": true,
                  "update_status": "New Article"
                }
              }

              ARTICLE REQUIREMENTS:
              1. Strong Professional Headline
              2. Natural journalistic opening (lede paragraphs — NO heading, NO label)
              3. Structured Article Sections
              4. Add Public Health Context or Clinical Significance
              5. Add Human Value
              6. SEO Optimization
              7. FAQ Section
              8. Key Takeaways
              9. Quality Score
              10. Metadata (populate reviewed_date with today's date in YYYY-MM-DD format)

              STRUCTURAL REQUIREMENTS:
              * For Public Health Topics (outbreaks, epidemics, disease surveillance, healthcare policy, environmental health, vaccination, food safety, or population health):
                1. Focus on community impact, healthcare preparedness, prevention guidance, surveillance, and practical reader awareness.
                2. Inside the JSON "article" field, structure the HTML content using these headers (using <h3> HTML tags):
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

              IMPORTANT: The final article must feel like it was edited by a real newsroom editor. Prefer high-value journalism over mass production.` 
            },
            { 
              role: "user", 
              content: `Title: ${sourceArticle.title}\nSummary: ${sourceArticle.summary}\nFull Text: ${fullTextToProcess.replace(/All rights reserved[\s\S]*?(?:permission from|PUNCH)[\s\S]*/gi, '').replace(/This material, and other digital content.*/gi, '').trim()}` 
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (response.status === 429) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error("Mistral HTTP 429: Rate limit exceeded (Max retries reached)");
        }
        console.warn(`[MISTRAL] Rate limit hit (429). Retrying in ${retryDelayMs / 1000}s... (Attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        retryDelayMs *= 2.5; // Exponential backoff: 4s -> 10s -> 25s
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.detail || parsed.message || parsed.error?.message || errText;
        } catch (e) {}
        throw new Error(`Mistral HTTP ${response.status}: ${errMsg}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        let rawContent = data.choices[0].message.content;
        rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let result = JSON.parse(rawContent);
        result = sanitizeObjectStrings(result);
        
        if (result.rejected === true) {
          throw new Error("Article rejected by AI: Content is non-medical (e.g., sports, politics, entertainment).");
        }

        let articleBody = result.article || "";
        articleBody = articleBody.replace(/```html/g, '').replace(/```/g, '').trim();

        let formattedContent = `${result.opening || ""}\n\n${articleBody}\n\n<h3>Key Takeaways</h3>\n<ul>\n${(result.key_takeaways || []).map((t: string) => `<li>${t}</li>`).join('\n')}\n</ul>\n\n<h3>Frequently Asked Questions</h3>\n${(result.faq || []).map((f: any) => `<h4>${f.question}</h4><p>${f.answer}</p>`).join('\n')}`;

        formattedContent += `\n\n<hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />\n<p style="font-size: 12px; color: #888;"><em>Medical Review: MedSense Editorial Board</em></p>`;

        const qualityScore = result.quality_score || 0;
        const qualityStatus = qualityScore < 75 ? "draft" : "ready";

        return { 
          success: true, 
          transformed: {
            title: result.headline || result.title,
            summary: result.meta_description || result.summary || "",
            content: formattedContent,
            category: result.category,
            visual_keyword: result.visual_keyword || "medical",
            originalImage: sourceArticle.originalImage,
            quality_score: qualityScore,
            status: qualityStatus
          },
          msg: qualityScore < 75 
            ? `⚠️ Quality score ${qualityScore}/100 — sent to review queue (draft).` 
            : "Intelligence classified and report generated."
        };
      } else {
        const errMsg = data?.detail || data?.message || data?.error?.message || "Invalid response from Mistral AI";
        throw new Error(`Mistral Error: ${errMsg}`);
      }

    } catch (error: any) {
      if ((error.message?.includes("429") || error.message?.includes("rate limit")) && attempts < maxAttempts - 1) {
        attempts++;
        console.warn(`[MISTRAL] Caught rate limit error in catch block. Retrying in ${retryDelayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        retryDelayMs *= 2.5;
        continue;
      }
      console.error("AI Processing Error:", error);
      return { success: false, error: String(error.message || error) };
    }
  }
  return { success: false, error: "Failed to process article after multiple rate-limit retries." };
}

/**
 * Supabase Data Actions
 * Fetch and Save articles to your Supabase database.
 */
export async function getArticlesFromSupabase() {
  if (!supabaseUrl) return { success: false, error: "Supabase not configured." };

  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, articles: data };
  } catch (error: any) {
    console.error("Supabase Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveArticleToSupabase(article: any) {
  if (!supabaseUrl) return { success: false, error: "Supabase not configured." };

  try {
    const { data, error } = await supabase
      .from("articles")
      .insert([
        {
          title: article.title,
          summary: article.summary,
          category: article.category,
          source: article.source,
          relevance: article.relevance,
          status: article.status || 'published',
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    const statusMsg = (article.status === 'draft') ? "Saved to review queue (quality score < 75)." : "Data committed to Supabase.";
    return { success: true, msg: statusMsg };
  } catch (error: any) {
    console.error("Supabase Save Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteArticleFromSupabase(articleId: string) {
  if (!pubClient) return { success: false, error: "Publication Target not configured." };

  try {
    const { error } = await pubClient
      .from("articles")
      .delete()
      .eq("id", articleId);

    if (error) throw error;
    return { success: true, msg: "Article purged from live database." };
  } catch (error: any) {
    console.error("Supabase Delete Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Staff Registry Actions
 */
export async function getStaffAccounts() {
  if (!supabaseUrl) return { success: false, error: "Supabase not configured." };
  try {
    const { data, error } = await supabase.from("staff").select("*");
    if (error) {
       console.error("[STAFF_GET_ERROR]", error);
       return { success: false, error: error.message };
    }
    if (data && data.length > 0) {
       console.log("[STAFF_SCHEMA_CHECK] Found columns:", Object.keys(data[0]));
       console.log("[STAFF_SCHEMA_CHECK] Sample ID format:", data[0].id, "Type:", typeof data[0].id);
    }
    console.log("[STAFF_GET_SUCCESS] Found", data?.length, "accounts");
    return { success: true, staff: data };
  } catch (error: any) {
    console.error("[STAFF_GET_EXCEPTION]", error);
    return { success: false, error: error.message };
  }
}

export async function addStaffAccount(name: string, email: string, password: string) {
  if (!supabaseUrl) return { success: false, error: "Supabase not configured." };
  
  if (password.length < 6) {
     return { success: false, error: "Password must be at least 6 characters for Supabase Auth." };
  }

  console.log(`[STAFF_SYNC] Synchronizing ${email} across platforms...`);
  
  try {
    // 1. Synchronize with Supabase Auth (Main Editorial Board login)
    const { data: listData } = await supabase.auth.admin.listUsers();
    const users = listData?.users || [];
    const existingAuthUser = (users as any[]).find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingAuthUser) {
       console.log(`[STAFF_SYNC] Updating existing Auth user: ${existingAuthUser.id}`);
       const { error: updateError } = await supabase.auth.admin.updateUserById(existingAuthUser.id, { 
          password: password,
          user_metadata: { name, role: 'editor' }
       });
       if (updateError) throw new Error(`Auth Update: ${updateError.message}`);
    } else {
       console.log(`[STAFF_SYNC] Creating new Auth user...`);
       const { error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role: 'editor' }
       });
       if (createError) throw new Error(`Auth Creation: ${createError.message}`);
    }

    // 2. Synchronize with Staff Table (AI Dashboard registry)
    const { data, error } = await supabase
      .from("staff")
      .upsert([
        { 
          name, 
          email, 
          password, 
          role: 'editor' // Set default role to ensure access to main board features
        }
      ], { onConflict: 'email' })
      .select();

    if (error) throw new Error(`DB Table: ${error.message}`);

    return { success: true, msg: "Staff account synchronized successfully.", staff: data?.[0] };
  } catch (error: any) {
    console.error("[STAFF_SYNC_EXCEPTION]", error);
    return { success: false, error: error.message };
  }
}

export async function deleteStaffAccount(id: string) {
  if (!supabaseUrl) return { success: false, error: "Supabase not configured." };
  try {
    // 1. Get email to delete from auth
    const { data: member } = await supabase.from("staff").select("email").eq("id", id).single();
    
    if (member?.email) {
       // Note: Deleting from auth by email is tricky without ID, but we can list users
       const { data: listData } = await supabase.auth.admin.listUsers();
       const users = listData?.users || [];
       const authUser = (users as any[]).find(u => u.email === member.email);
       if (authUser) {
          await supabase.auth.admin.deleteUser(authUser.id);
       }
    }

    // 2. Delete from staff table
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) throw error;
    
    return { success: true, msg: "Access revoked from all boards." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * AI Command Processing
 * Allows staff to chat with the AI to perform actions.
 */
export async function processAICommand(prompt: string, context: { articles: any[], sources: any[] }) {
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  if (!MISTRAL_API_KEY) return { success: false, error: "AI key missing." };

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { 
            role: "system", 
            content: `You are MedSA, the friendly and elite Medical AI assistant for the MedSense News Editorial Board. Your persona is professional yet warm, helpful, and deeply knowledgeable about medical science.

            YOUR ROLE:
            1. BE A PARTNER: Treat the staff as your valued colleagues. Use friendly, encouraging language.
            2. EXPLAIN THE NEWS: When asked about articles or trends, don't just list them—explain their medical significance or why they matter to the public.
            3. ACTION COMMANDER: You have direct authority to manage the newsroom. If a staff member asks you to delete an article, publish a draft, or search for fresh intelligence, execute the command immediately and confirm it with a friendly message.
            4. INTELLIGENCE ANALYST: You can see all recently discovered articles. Use this vision to help staff decide what's worth publishing or what should be purged.

            AVAILABLE ACTIONS:
            - SEARCH_NEWS: Use this for "find news on X", "what's the latest about Y".
            - DELETE_ARTICLE: Use this when a staff member asks to remove, delete, or "get rid of" an article.
            - PUBLISH_ARTICLE: Use this to push a draft to the live site.
            - EDIT_ARTICLE: Use this to refine headlines or content.
            - RUN_DISCOVERY: Use this to trigger a fresh scan of all intelligence hubs.
            - GENERATE_SOCIAL_KIT: Use this when a staff member asks for a social kit, twitter thread, or linkedin post.
            - CHAT: Use this for general medical questions, explaining news, or friendly conversation.

            CURRENT CONTEXT:
            - Discovered Articles: ${context.articles.map(a => `ID: ${a.id}, Title: ${a.title}`).join(' | ')}
            - Intelligence Hubs: ${context.sources.map(s => `ID: ${s.id}, Name: ${s.name}`).join(' | ')}

            RESPONSE FORMAT (JSON):
            {
              "message": "A friendly, conversational response. IMPORTANT: If the user asks to delete more than 2 articles, or says 'delete all', your message MUST be a warning asking for confirmation, and you MUST set action to 'CHAT' instead of 'DELETE_ARTICLE' until they confirm.",
              "action": "SEARCH_NEWS" | "DELETE_ARTICLE" | "PUBLISH_ARTICLE" | "EDIT_ARTICLE" | "RUN_DISCOVERY" | "GENERATE_SOCIAL_KIT" | "CHAT",
              "query": "search terms if applicable",
              "targetId": "ID of primary item",
              "targetIds": ["ID1", "ID2"],
              "editInstructions": "Instructions for editing",
              "confidence": 0.0 to 1.0
            }` 
          },
          { 
            role: "user", 
            content: prompt + (prompt.toLowerCase().includes('social') ? "\n\nIf generating a social kit, provide a Twitter Thread (3-5 tweets), a LinkedIn Post, and an Instagram Caption. Use high-authority medical tone." : "") 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return { success: true, result: JSON.parse(data.choices[0].message.content) };
    }
    throw new Error("Invalid AI response");
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Category Image Assets ---
const CATEGORY_IMAGES: Record<string, string> = {
  'Health': "https://images.unsplash.com/photo-1505751172107-167425f38e0a?auto=format&fit=crop&q=80&w=1200",
  'Medicine': "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
  'Research': "https://images.unsplash.com/photo-1579154273821-396417646a7d?auto=format&fit=crop&q=80&w=1200",
  'Vaccine': "https://images.unsplash.com/photo-1618961734760-466979ce35b0?auto=format&fit=crop&q=80&w=1200",
  'AI / Robotics': "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1200",
  'Public Health': "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200",
  'Technology': "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1200",
  'Breaking': "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=1200"
};

/**
 * Duplicate Check Helper
 * Checks if an article with the same source URL already exists.
 */
export async function isDuplicateArticle(sourceUrl: string) {
  if (!pubClient || !sourceUrl || sourceUrl === "#") return false;
  try {
    const normalizeUrl = (url: string) => {
      try {
        const u = new URL(url);
        return u.origin + u.pathname;
      } catch (e) {
        return url;
      }
    };
    
    const targetUrl = normalizeUrl(sourceUrl);
    const { data } = await pubClient
      .from('articles')
      .select('id')
      .eq('source_url', targetUrl)
      .maybeSingle();
    return !!data;
  } catch (e) {
    return false;
  }
}

/**
 * Publication Service
 * Pushes the final report to the MedSense News database.
 */
export async function publishToNewsSite(payload: {
  headline: string,
  category: string,
  author: string,
  summary: string,
  fullReport: string,
  visualKeyword?: string,
  originalImage?: string | null,
  sourceUrl?: string,
  targetUrl?: string,
  token?: string
}) {
  if (!pubClient) {
    return { success: false, error: "Publication Target not configured." };
  }

  try {
    // 1. DUPLICATE CHECK — by source URL first (most reliable), then by title
    const normalizeUrl = (url: string) => {
      try {
        const u = new URL(url);
        return u.origin + u.pathname;
      } catch (e) {
        return url;
      }
    };

    if (payload.sourceUrl && payload.sourceUrl !== "#") {
      const targetUrl = normalizeUrl(payload.sourceUrl);
      const { data: urlDup } = await pubClient
        .from('articles')
        .select('id, title')
        .eq('source_url', targetUrl)
        .maybeSingle();
      if (urlDup) {
        return { success: false, error: `Article already exists (Source Link Match): "${urlDup.title}"` };
      }
    }

    const normalizedHeadline = payload.headline.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const { data: existing, error: checkError } = await pubClient
      .from('articles')
      .select('id, title')
      .ilike('title', payload.headline.trim())
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return { success: false, error: `Article already exists (Title Match): "${existing.title}"` };
    }

    const exactPublishTime = new Date().toISOString();
    
    // 2. IMAGE SELECTION PRIORITY:
    // Try to use the original photo from the news site first.
    // If it doesn't exist OR looks like a generic logo/placeholder, fallback to AI search.
    let heroImage = payload.originalImage;
    
    const isGenericImage = heroImage && (
      heroImage.toLowerCase().includes('logo') || 
      heroImage.toLowerCase().includes('placeholder') || 
      heroImage.toLowerCase().includes('default') ||
      heroImage.toLowerCase().includes('favicon') ||
      heroImage.toLowerCase().includes('avatar')
    );

    if (!heroImage || isGenericImage || heroImage.length < 10) {
      // Use curated internal category image first
      heroImage = CATEGORY_IMAGES[payload.category || 'Medicine'];
      
      if (!heroImage) {
        const searchTerms = payload.visualKeyword || payload.category || 'medical research';
        // Search for high-quality, clinical images
        const randomSeed = Math.floor(Math.random() * 1000000);
        // Use Source Unsplash or LoremFlickr with high-quality clinical keywords
        heroImage = `https://loremflickr.com/1200/800/${encodeURIComponent(searchTerms)},clinical,professional/all?lock=${randomSeed}`;
      }
    }

    const createSlug = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const { data, error } = await pubClient
      .from('articles')
      .insert([{
        title: payload.headline,
        slug: createSlug(payload.headline),
        category: payload.category || 'Medicine',
        author: payload.author || 'Damilare',
        excerpt: payload.summary,
        content: payload.fullReport,
        image: heroImage,
        status: 'published',
        date: exactPublishTime,
        source_url: payload.sourceUrl ? normalizeUrl(payload.sourceUrl) : null,
        views: 0,
        trending: false
      }]);

    if (error) throw error;

    return { 
      success: true, 
      msg: `UPLINK SUCCESS: "${payload.headline.substring(0, 30)}..." is now LIVE on MedSense News.` 
    };
  } catch (error: any) {
    console.error("Publication Error:", error);
    return { success: false, error: String(error.message || error) };
  }
}

/**
 * Cloud Sync for Intelligence Hubs
 * Stores sources configuration in the articles table to persist across devices.
 */
export async function getSourcesFromCloud() {
  if (!supabaseUrl) return { success: false, error: "Supabase not configured." };
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("content")
      .eq("title", "SYSTEM_HUBS_CONFIG")
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error; // ignore no rows found
    if (data && data.content) {
       return { success: true, sources: JSON.parse(data.content) };
    }
    return { success: true, sources: [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveSourcesToCloud(sources: any[]) {
  if (!supabaseUrl) return { success: false, error: "Supabase not configured." };
  try {
    // Delete existing
    await supabase
      .from("articles")
      .delete()
      .eq("title", "SYSTEM_HUBS_CONFIG");
      
    // Insert new config
    const { error: insError } = await supabase
      .from("articles")
      .insert([{
         title: "SYSTEM_HUBS_CONFIG",
         content: JSON.stringify(sources),
         category: "SYSTEM",
         status: "draft",
         slug: "system-hubs-config",
         author: "system",
         date: new Date().toISOString(),
         excerpt: "System configuration for Intelligence Hubs",
         views: 0,
         trending: false
      }]);
      
    if (insError) throw insError;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Gets count and list of legacy articles needing upgrade.
 */
export async function getLegacyArticlesCountAndList() {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('content', 'ilike', '%Executive Summary%');

    if (countError) throw countError;

    // Get first 100 articles
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, category, created_at, content')
      .not('content', 'ilike', '%Executive Summary%')
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) throw fetchError;

    return {
      success: true,
      count: count || 0,
      articles: articles || []
    };
  } catch (error: any) {
    return { success: false, count: 0, articles: [], error: error.message };
  }
}

/**
 * Upgrades a single legacy article using Mistral API and saves it to the DB.
 */
export async function upgradeSingleLegacyArticle(id: string) {
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  if (!MISTRAL_API_KEY) {
    return { success: false, error: "Mistral API Key is missing." };
  }

  try {
    // 1. Fetch the article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !article) {
      return { success: false, error: fetchError?.message || "Article not found" };
    }

    if (article.content.includes("Executive Summary")) {
      return { success: true, alreadyUpgraded: true, headline: article.title };
    }

    const PROMPT = `You are a senior medical journalist and public health editor writing for MedSense News, a professional global health and medical intelligence platform.

Your task is to rewrite and significantly upgrade an existing medical news article into a high-value, human-quality editorial health report suitable for Google News, SEO, and AdSense approval.

STRICT RULES:
1. NEVER copy the original wording.
2. NEVER sound robotic or AI-generated.
3. NEVER use repetitive transitions or generic filler (e.g. "This highlights the importance of", "Serves as a reminder", "In an era where", "Underscores the need for", "Could become a cornerstone"). Use direct journalistic writing instead.
4. NEVER fabricate medical facts, experts, quotes, institutions, statistics, studies, commentary, or government statements. Only include verifiable public information.
5. Add source attribution naturally when available (e.g., "According to the CDC...", "Researchers writing in Science reported..."). Only link to organization/researcher platforms, not competitor news sites.
6. Write with natural newsroom pacing: use tighter paragraphs, vary sentence structure, and avoid overly polished or philosophical transitions.
7. REDUCE REPETITION: Do not restate the same idea in multiple sections or repeatedly explain concepts already introduced.
8. CONCISE & DENSE: Prioritize clarity over excessive expansion. Keep articles concise and information-dense. Do not artificially lengthen articles to increase word count. Keep article length proportional to the importance of the story.
9. Avoid fear-based, sensational language, clickbait, or exaggerated risks.
10. The tone should resemble Reuters Health, AP Health, Health Policy Watch, or WHO-style reporting.
11. STRICT WRITING RULE: NEVER use hyphens (-), en-dashes (–), or em-dashes (—) anywhere in your output, neither in the headline nor the body text. Use commas, colons, parentheses, or other punctuation instead. Any use of a hyphen or dash is a complete failure.
12. Focus on factual reporting: what happened, why it matters, who is affected, what officials are doing, what readers should know.
13. BRADING & AUTHOR CREDENTIALS: Add "Medical Review: MedSense Editorial Board" at the very end of the article text.
14. GENETIC / STATISTICAL CLAIM RULE: Never include precise genetic percentages, epidemiological figures, or study-specific statistics unless they are explicitly provided from verified sources in the input article. If uncertain, generalize the claim or remove numerical specificity.

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
  "quality_score": 0,
  "metadata": {
    "reviewed_by": "MedSense Editorial Board",
    "reviewed_date": "",
    "sources": [],
    "fact_checked": true,
    "update_status": "Major Rewrite"
  }
}

ARTICLE REQUIREMENTS:
The upgraded article must include:
1. Strong Professional Headline
2. Natural journalistic opening (lede paragraphs formatted as HTML <p> tags — NO heading, NO label)
3. Structured Article Sections (Use standard HTML <h3>, <p>, <ul> tags. Do NOT use markdown ## for headers, use proper <h3> HTML tags. DO NOT output \`\`\`html markdown blocks inside the JSON string. DO NOT repeat content from the opening field.)
4. Add Public Health Context or Clinical Significance
5. Add Human Value
6. SEO Optimization
7. FAQ Section
8. Key Takeaways
9. Quality Score
10. Metadata (populate reviewed_date with today's date in YYYY-MM-DD format)

STRUCTURAL REQUIREMENTS:
* For Public Health Topics (outbreaks, epidemics, disease surveillance, healthcare policy, environmental health, vaccination, food safety, or population health):
  1. Focus on community impact, healthcare preparedness, prevention guidance, surveillance, and practical reader awareness.
  2. Inside the JSON "article" field, structure the HTML content using these headers (using <h3> HTML tags):
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

IMPORTANT: The final article must feel like it was edited by a real newsroom editor. Prefer high-value journalism over mass production.`;

    let attempts = 0;
    const maxAttempts = 3;
    let retryDelayMs = 20000; // 20s initial wait for free tier
    let response: Response | null = null;

    while (attempts < maxAttempts) {
      response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${MISTRAL_API_KEY}`
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
          return { success: false, error: `Rate limit exceeded after ${maxAttempts} retries. Try again in a minute.` };
        }
        console.warn(`[UPGRADE] 429 Rate limit hit. Retrying in ${retryDelayMs / 1000}s... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        retryDelayMs *= 2; // exponential backoff: 20s → 40s → 80s
        continue;
      }

      break; // success or non-429 error
    }

    if (!response || !response.ok) {
      return { success: false, error: `Mistral HTTP error: ${response?.status || 'unknown'}` };
    }

    const data = await response.json();
    const rawJson = data.choices[0].message.content;
    let result = JSON.parse(rawJson.replace(/```json/gi, '').replace(/```/g, '').trim());
    result = sanitizeObjectStrings(result);

    let articleBody = result.article || "";
    articleBody = articleBody.replace(/```html/g, '').replace(/```/g, '').trim();

    const faqHtml = (result.faq || []).map((f: { question: string, answer: string }) => `<h4>${f.question}</h4><p>${f.answer}</p>`).join('\n');
    const takeawaysHtml = (result.key_takeaways || []).map((t: string) => `<li>${t}</li>`).join('\n');

    const formattedContent = [
      result.opening || "",
      articleBody,
      `<h3>Key Takeaways</h3><ul>${takeawaysHtml}</ul>`,
      `<h3>Frequently Asked Questions</h3>`,
      faqHtml,
      `<hr style="border:0;border-top:1px solid #eaeaea;margin-top:30px;" />`,
      `<p style="font-size:12px;color:#888;"><em>Medical Review: MedSense Editorial Board</em></p>`
    ].join('\n\n');

    const finalStatus = (result.quality_score && result.quality_score < 75) ? "draft" : (article.status || "published");

    const { error: updateError } = await supabase
      .from('articles')
      .update({
        title: result.headline,
        content: formattedContent,
        status: finalStatus
      })
      .eq('id', article.id);

    if (updateError) throw updateError;

    return {
      success: true,
      headline: result.headline,
      qualityScore: result.quality_score
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
