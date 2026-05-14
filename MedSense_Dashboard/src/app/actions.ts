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
        
        // 48-Hour Rolling Window (Ensures we catch fresh news across timezones)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        let filtered = feed.items.filter(item => {
          if (!item.isoDate && !item.pubDate) return false;
          const itemDate = new Date(item.isoDate || item.pubDate!);
          return itemDate >= twoDaysAgo;
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
            content: `You are a professional medical journalist. Rewrite the provided medical news into a high-fidelity, journalistic article.
            
            STRICT FORMATTING RULES:
            1. Use exactly ONE main heading (the title). NEVER repeat this title inside the "content" field.
            2. NEVER include <h1> or <h2> tags in the "content" field. The "content" must start directly with the article body.
            3. DO NOT include placeholders like "By [Your Name]" or other website names in the body.
            4. Use <h3> for sub-sections like "Why This Is Escalating" or "Understanding the Condition".
            4. Use bullet points (<ul> and <li>) for clarity in technical lists.
            5. Always end with a "MedSense Insight" section and a "Key Takeaway" section.
            6. CRITICAL: COMPLETELY IGNORE and EXCLUDE any legal disclaimers, copyright notices, "All rights reserved" statements, or permission warnings from the source text. NEVER include them in your output.
            
            JSON structure:
            {
              "title": "A compelling, journalistic headline (e.g., Rising Concern: ...)",
              "summary": "A 2-sentence professional summary.",
              "content": "Full HTML content following the rules above.",
              "category": "One of: [Health, Medicine, Research, Public Health, Technology, Weather]",
              "visual_keyword": "A single specific medical keyword for image searching (e.g., stethoscope, lab-technician, surgery, dna)"
            }
            
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
      const result = JSON.parse(data.choices[0].message.content);
      
      // Extract domain for attribution
      let domain = "external source";
      try { domain = new URL(sourceArticle.sourceUrl).hostname.replace('www.', ''); } catch (e) {}
      
      // Inject user's custom ethical source attribution
      result.content += `\n<hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />\n<p style="font-size: 12px; color: #888;"><em><strong>Editorial Note:</strong> This report was prepared by MedSense News using verified public reporting, official statements, and editorial analysis. Initial reporting credit: <a href="${sourceArticle.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #555; text-decoration: underline;">${domain}</a>.</em></p>`;

      return { 
        success: true, 
        transformed: {
          ...result,
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
  targetUrl?: string,
  token?: string
}) {
  if (!pubClient) {
    return { success: false, error: "Publication Target not configured." };
  }

  try {
    // 1. DUPLICATE CHECK
    const { data: existing, error: checkError } = await pubClient
      .from('articles')
      .select('id')
      .eq('title', payload.headline)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return { success: false, error: "Article already exists on MedSense News (Duplicate Prevented)." };
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 2. IMAGE SELECTION PRIORITY:
    // Try to use the original photo from the news site first.
    // If it doesn't exist, fallback to searching a global photo database (Flickr) using the AI's keyword.
    let heroImage = payload.originalImage;
    if (!heroImage) {
      const searchTerms = payload.visualKeyword || payload.category || 'medicine';
      // Search Flickr for real, authentic photos matching the medical keyword
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
        date: today,
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
