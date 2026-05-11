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
 * Live News Discovery
 * Fetches real articles from global medical RSS feeds.
 * Filters for articles published TODAY only.
 */
export async function fetchLiveMedicalNews(customFeeds?: string[]) {
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
           const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
           const text = await res.text();
           try {
              feed = await parser.parseString(text);
           } catch (xmlErr) {
              try {
                 const json = JSON.parse(text);
                 feed = {
                   title: json.name || json.title || "Intelligence Hub",
                   items: (json.articles || json.items || json.data || []).map((item: any) => ({
                     title: item.title || item.headline,
                     contentSnippet: item.description || item.summary || item.excerpt,
                     content: item.content || item.body || item.description,
                     link: item.url || item.link || item.source_url,
                     isoDate: item.publishedAt || item.date || item.created_at
                   }))
                 };
              } catch (jsonErr) {
                 continue;
              }
           }
        }

        // Freshness Window: 7 Days (Expanded to capture more sources)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        let filtered = feed.items.filter((item: any) => {
          if (!item.isoDate && !item.pubDate) return false;
          const itemDate = new Date(item.isoDate || item.pubDate!);
          return itemDate >= oneWeekAgo;
        });

        // Fallback: Freshest signal if none in window
        if (filtered.length === 0 && feed.items.length > 0) {
           filtered = [feed.items[0]];
        }

        allArticles.push(...filtered.map((item: any) => {
          let imgUrl = null;
          if (item.enclosure && item.enclosure.url) imgUrl = item.enclosure.url;
          else if (item['media:content'] && item['media:content'].$) imgUrl = item['media:content'].$.url;
          else if (item['media:thumbnail'] && item['media:thumbnail'].$) imgUrl = item['media:thumbnail'].$.url;
          else {
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
    // We check the source_url column in the articles table
    try {
      if (pubClient) {
        const urlsToCheck = deduplicated.map(a => a.sourceUrl).filter(url => url !== "#");
        const titlesToCheck = deduplicated.map(a => a.title);

        const { data: existingByUrl } = urlsToCheck.length > 0 
          ? await pubClient.from('articles').select('source_url').in('source_url', urlsToCheck)
          : { data: [] };
          
        const { data: existingByTitle } = titlesToCheck.length > 0
          ? await pubClient.from('articles').select('title').in('title', titlesToCheck)
          : { data: [] };
        
        const existingUrls = new Set((existingByUrl || []).map((a: any) => a.source_url));
        const existingTitles = new Set((existingByTitle || []).map((a: any) => a.title.toLowerCase().trim()));
        
        deduplicated = deduplicated.filter(a => 
          !existingUrls.has(a.sourceUrl) && 
          !existingTitles.has(a.title.toLowerCase().trim())
        );
      }
    } catch (dbErr) {
      console.error("Duplicate DB check error:", dbErr);
      // Continue with deduplicated list if DB check fails
    }
    
    return {
      success: true,
      articles: deduplicated.slice(0, 10),
      count: deduplicated.length
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
            1. Use exactly ONE main heading (the title). NEVER include sub-headlines or alternative titles in the body.
            2. DO NOT include placeholders like "By [Your Name]" or other website names in the body.
            3. Use <h3> for sub-sections like "Why This Is Escalating" or "Understanding the Condition".
            4. Use bullet points (<ul> and <li>) for clarity in technical lists.
            5. Always end with a "MedSense Insight" section and a "Key Takeaway" section.
            6. CRITICAL: COMPLETELY IGNORE and EXCLUDE any legal disclaimers, copyright notices, "All rights reserved" statements, or permission warnings from the source text. NEVER include them in your output.
            
            JSON structure:
            {
              "title": "A compelling, journalistic headline (e.g., Rising Concern: ...)",
              "summary": "A 2-sentence professional summary.",
              "content": "Full HTML content following the rules above.",
              "category": "One of: [Health, Medicine, Research, Public Health, Technology]",
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
      let rawContent = data.choices[0].message.content;
      // Strip markdown code blocks if Mistral returns them
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const result = JSON.parse(rawContent);
      
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
            content: `You are MedSA, the official AI assistant of AOJ Group. You help staff manage news articles and intelligence sources.
            
            AVAILABLE ACTIONS:
            1. SEARCH_NEWS: If user asks for "latest news", "news today", or news about a specific topic. Return search terms in 'query'.
            2. DELETE_ARTICLE: If user wants to delete/remove a news article.
            3. PUBLISH_ARTICLE: If user wants to publish a specific article.
            4. EDIT_ARTICLE: If user wants to change/edit content of a draft or existing article.
            5. RUN_DISCOVERY: If user wants to start a general news scan.
            6. CHAT: For general questions or analysis.

            CURRENT CONTEXT:
            - Discovered Articles: ${context.articles.map(a => `ID: ${a.id}, Title: ${a.title}`).join(' | ')}
            - Intelligence Hubs: ${context.sources.map(s => `ID: ${s.id}, Name: ${s.name}`).join(' | ')}

            RESPONSE FORMAT:
            You must return a JSON object:
            {
              "message": "Your helpful response.",
              "action": "SEARCH_NEWS" | "DELETE_ARTICLE" | "PUBLISH_ARTICLE" | "EDIT_ARTICLE" | "RUN_DISCOVERY" | "CHAT",
              "query": "search terms if searching",
              "targetId": "ID of primary item",
              "targetIds": ["ID1", "ID2"],
              "editInstructions": "Detailed instructions on what to change if editing",
              "confidence": 0.0 to 1.0
            }` 
          },
          { role: "user", content: prompt }
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
    if (payload.sourceUrl) {
      const { data: urlDup } = await pubClient
        .from('articles')
        .select('id')
        .eq('source_url', payload.sourceUrl)
        .maybeSingle();
      if (urlDup) {
        return { success: false, error: "Article already exists on MedSense News (Duplicate Prevented)." };
      }
    }

    const { data: existing, error: checkError } = await pubClient
      .from('articles')
      .select('id')
      .eq('title', payload.headline)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return { success: false, error: "Article already exists on MedSense News (Duplicate Prevented)." };
    }

    const exactPublishTime = new Date().toISOString();
    
    // 2. IMAGE SELECTION PRIORITY:
    // Try to use the original photo from the news site first.
    // If it doesn't exist, fallback to searching a global photo database (Flickr) using the AI's keyword.
    let heroImage = payload.originalImage;
    if (!heroImage) {
      const searchTerms = payload.visualKeyword || payload.category || 'medicine';
      // Search Flickr for real, authentic photos matching the medical keyword
      heroImage = `https://loremflickr.com/1200/800/${encodeURIComponent(searchTerms)},medical/all`;
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
        source_url: payload.sourceUrl || null,
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
