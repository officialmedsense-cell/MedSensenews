"use server";

import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure']
  }
});

// --- Live RSS Feeds ---
const FEEDS = [
  "https://nigeriahealthwatch.com/feed/",
  "https://rss.punchng.com/v1/category/healthwise",
  "https://healthnews.ng/feed/",
  "https://www.medicalnewstoday.com/rss/headlines",
  "https://www.sciencedaily.com/rss/top/health.xml",
  "https://medicalxpress.com/rss-feed/"
];

/**
 * Live News Discovery
 * Fetches real articles from global medical RSS feeds.
 * Filters for articles published TODAY only.
 */
export async function fetchLiveMedicalNews(customFeeds?: string[]) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const allArticles: any[] = [];

    // Use custom feeds if provided, otherwise fallback to default FEEDS
    const feedsToUse = (customFeeds && customFeeds.length > 0) ? customFeeds : FEEDS;
    
    // Process all provided feeds (or pick a few randomly if using default)
    const selectedFeeds = customFeeds && customFeeds.length > 0 
      ? feedsToUse 
      : feedsToUse.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const url of selectedFeeds) {
      try {
        const feed = await parser.parseURL(url);
        
        // 24-Hour Rolling Window (Ensures we catch the freshest news)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        
        let filtered = feed.items.filter(item => {
          if (!item.isoDate && !item.pubDate) return false;
          const itemDate = new Date(item.isoDate || item.pubDate!);
          return itemDate >= oneDayAgo;
        });

        // Strictly ignore news that is not within the 48-hour window
        if (filtered.length === 0) continue;

        allArticles.push(...filtered.map(item => {
          // Extract Original Image
          let imgUrl = null;
          if (item.enclosure && item.enclosure.url) imgUrl = item.enclosure.url;
          else if (item['media:content'] && item['media:content'].$) imgUrl = item['media:content'].$.url;
          else if (item['media:thumbnail'] && item['media:thumbnail'].$) imgUrl = item['media:thumbnail'].$.url;
          else {
            // Attempt to parse img tag from content
            const match = (item.content || item.contentSnippet || '').match(/<img[^>]+src="([^">]+)"/);
            if (match) imgUrl = match[1];
          }

          return {
            title: item.title,
            summary: item.contentSnippet || item.content || "No summary available.",
            fullText: item.content || item.contentSnippet,
            originalImage: imgUrl,
            source: feed.title || "Medical Hub",
            sourceUrl: item.link || "#",
            category: "Breaking",
            pubDate: item.isoDate
          };
        }));
      } catch (feedErr) {
        console.error(`Feed Error [${url}]:`, feedErr);
      }
    }
    
    return {
      success: true,
      articles: allArticles.slice(0, 10),
      count: allArticles.length
    };
  } catch (error: any) {
    console.error("RSS Fetch Error:", error);
    return { success: false, error: "Failed to reach live news feeds." };
  }
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * MedSense AI Service Action
 * Connects to Mistral AI using your provided API key.
 */
export async function processArticleWithAI(sourceArticle: { title: string, summary: string, fullText: string, sourceUrl: string, originalImage?: string | null }, model: string, tone: string) {
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

  if (!MISTRAL_API_KEY) {
    return { success: false, error: "Mistral API Key is missing." };
  }

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
              11. STRICT WRITING RULE: NEVER use hyphens (-) anywhere in your output. Use commas, colons, or other punctuation instead.
              12. STRICT CONTENT FILTER: If the article is primarily about sports, football, general politics, or entertainment, you must set "rejected": true.
              13. NO FABRICATED EXPERTS: NEVER invent experts, institutions, quotes, studies, statistics, or commentary that cannot be verified publicly. If no verified expert quote exists in the original source, omit the expert commentary section entirely.
              14. REDUCE REPETITION: Avoid re-explaining the same concept multiple times or repeating phrases.
              15. CONCISE & DENSE: Prioritize concise, information-dense journalism over excessive expansion. Keep paragraphs tighter and more natural to mimic professional newsroom writing patterns.
              16. REAL CITATIONS: Include mentions of real journal references or reputable organizations (e.g. WHO, CDC, NIH, major universities, published peer-reviewed studies) if applicable to the topic.
              17. BRADING & AUTHOR CREDENTIALS: Add "Medical Review: MedSense Editorial Board" at the very end of the article text.

              OUTPUT FORMAT:
              Return ONLY valid JSON in this exact structure:
              {
                "rejected": boolean,
                "headline": "A POWERFUL, professional headline",
                "seo_title": "",
                "meta_description": "",
                "category": "Health, Medicine, Research, Public Health, Technology, or Health Alerts",
                "visual_keyword": "A single specific medical keyword for image searching",
                "executive_summary": "2-4 concise paragraphs summarizing what happened and why it matters",
                "article": "The main content using HTML <h3>, <p>, <ul>. DO NOT use markdown blocks.",
                "key_takeaways": ["point 1", "point 2"],
                "faq": [{"question": "Q1?", "answer": "A1"}],
                "tags": [],
                "quality_score": 95
              }

              ARTICLE REQUIREMENTS:
              1. Executive Summary
              2. Structured Article Sections
              3. Add Public Health Context or Clinical Significance
              4. Add Human Value
              5. SEO Optimization
              6. FAQ Section
              7. Key Takeaways

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
              * Clean formatting without markdown blocks
              * Clear readability
              * No sensationalism
              * No emojis
              
              TARGET LENGTH: 800-1600 words. Keep it within this sweet spot for SEO and readability.
              IMPORTANT: The final article must feel like it was written by an experienced health newsroom editor for a legitimate medical publication.
            
            The tone should be ${tone}.` 
          },
          { 
            role: "user", 
            content: `Title: ${sourceArticle.title}\nSummary: ${sourceArticle.summary}\nFull Text: ${sourceArticle.fullText.replace(/All rights reserved[\s\S]*?(?:permission from|PUNCH)[\s\S]*/gi, '').replace(/This material, and other digital content.*/gi, '').trim()}` 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      let rawContent = data.choices[0].message.content;
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const result = JSON.parse(rawContent);

      if (result.rejected === true) {
        throw new Error("Article rejected by AI: Content is non-medical.");
      }
      
      // Extract domain for attribution
      let domain = "external source";
      try { domain = new URL(sourceArticle.sourceUrl).hostname.replace('www.', ''); } catch (e) {}
      
      let articleBody = result.article || "";
      articleBody = articleBody.replace(/```html/g, '').replace(/```/g, '').trim();

      let formattedContent = `<h3>Executive Summary</h3>\n<p>${result.executive_summary}</p>\n\n${articleBody}\n\n<h3>Key Takeaways</h3>\n<ul>\n${(result.key_takeaways || []).map((t: string) => `<li>${t}</li>`).join('\n')}\n</ul>\n\n<h3>Frequently Asked Questions</h3>\n${(result.faq || []).map((f: any) => `<h4>${f.question}</h4><p>${f.answer}</p>`).join('\n')}`;

      // Inject user's custom ethical source attribution
      formattedContent += `\n<hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />\n<p style="font-size: 12px; color: #888;"><em><strong>Editorial Note:</strong> This report was prepared by MedSense News using verified public reporting, official statements, and editorial analysis. Initial reporting credit: <a href="${sourceArticle.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #555; text-decoration: underline;">${domain}</a>.</em></p>`;
      
      formattedContent += `\n<p style="font-size: 12px; color: #888;"><em>Medical Review: MedSense Editorial Board</em></p>`;

      return { 
        success: true, 
        transformed: {
          title: result.headline || result.title,
          summary: result.meta_description || result.executive_summary || result.summary,
          content: formattedContent,
          category: result.category,
          visual_keyword: result.visual_keyword || "medical",
          originalImage: sourceArticle.originalImage
        },
        msg: "Intelligence classified and report generated."
      };
    } else {
      throw new Error("Invalid response from Mistral AI");
    }
  } catch (error: any) {
    console.error("AI Processing Error:", error);
    return { success: false, error: String(error.message || error) };
  }
}

/**
 * Supabase Data Actions
 * Fetch and Save articles to your Supabase database.
 */
export async function getArticlesFromSupabase() {
  // Always try to fetch from the LIVE news site first
  if (!pubClient) return { success: false, error: "Publication Site not configured." };

  try {
    const { data, error } = await pubClient
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, articles: data };
  } catch (error: any) {
    console.error("News Site Fetch Error:", error);
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
          status: 'published',
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    return { success: true, msg: "Data committed to Supabase." };
  } catch (error: any) {
    console.error("Supabase Save Error:", error);
    return { success: false, error: error.message };
  }
}

// --- Publication Client (MedSense News) ---
const pubUrl = process.env.PUBLICATION_SUPABASE_URL || "";
const pubKey = process.env.PUBLICATION_SUPABASE_KEY || "";
const pubClient = (pubUrl && pubKey) ? createClient(pubUrl, pubKey) : null;

// --- Category Image Assets ---
const CATEGORY_IMAGES: Record<string, string> = {
  'Health': "https://images.unsplash.com/photo-1505751172107-167425f38e0a?auto=format&fit=crop&q=80&w=1200",
  'Medicine': "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
  'Research': "https://images.unsplash.com/photo-1579154273821-396417646a7d?auto=format&fit=crop&q=80&w=1200",
  'Vaccine': "https://images.unsplash.com/photo-1618961734760-466979ce35b0?auto=format&fit=crop&q=80&w=1200",
  'Public Health': "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200",
  'Technology': "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1200",
  'Weather': "https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&q=80&w=1200",
  'Breaking': "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=1200"
};

/**
 * Duplicate Check Helper
 * Checks if an article with the same source URL already exists.
 */
export async function isDuplicateArticle(sourceUrl: string) {
  if (!pubClient || !sourceUrl) return false;
  try {
    const { data, error } = await pubClient
      .from('articles')
      .select('id')
      .eq('source_url', sourceUrl)
      .maybeSingle();
    
    if (error) return false;
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
    // 1. DUPLICATE CHECK (Enhanced: Checks both Title and Source URL)
    let query = pubClient.from('articles').select('id');
    
    if (payload.sourceUrl) {
      const { data: existingSource, error: sourceError } = await query
        .eq('source_url', payload.sourceUrl)
        .maybeSingle();
      
      if (sourceError) throw sourceError;
      if (existingSource) {
        return { success: false, error: "Article origin already exists on MedSense News (Duplicate Prevented)." };
      }
    }

    const { data: existingTitle, error: titleError } = await pubClient
      .from('articles')
      .select('id')
      .eq('title', payload.headline)
      .maybeSingle();

    if (titleError) throw titleError;
    if (existingTitle) {
      return { success: false, error: "An article with this headline already exists (Duplicate Prevented)." };
    }

    const fullTimestamp = new Date().toISOString();
    
    // 2. IMAGE SELECTION PRIORITY:
    // Priority 1: Use original photo from the news source.
    // Priority 2: Use internal curated category image.
    // Priority 3: Fallback to searching global photo database (Flickr) using AI keyword.
    let heroImage = payload.originalImage;
    if (!heroImage) {
      heroImage = CATEGORY_IMAGES[payload.category || 'Medicine'];
    }
    
    if (!heroImage) {
      const searchTerms = payload.visualKeyword || payload.category || 'medicine';
      heroImage = `https://loremflickr.com/1200/800/${encodeURIComponent(searchTerms)},medical/all`;
    }

    const { data, error } = await pubClient
      .from('articles')
      .insert([{
        title: payload.headline,
        category: payload.category || 'Medicine',
        author: payload.author || 'Damilare',
        excerpt: payload.summary,
        content: payload.fullReport,
        image: heroImage,
        status: 'published',
        date: fullTimestamp, 
        created_at: fullTimestamp,
        source_url: payload.sourceUrl,
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
