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
                 // If all parsing fails, generate a synthetic error signal
                 feed = {
                   title: "System Diagnostics",
                   items: [{
                     title: `[UPLINK FAILED] Unreadable Source: ${new URL(url).hostname}`,
                     contentSnippet: `The AI could not extract structured data from ${url}. Please verify that this is a valid RSS Feed or JSON API endpoint, and not a standard HTML webpage.`,
                     content: `Diagnostic Failure. The system attempted RSS, XML, and JSON extraction protocols but all returned invalid formats.`,
                     link: url,
                     isoDate: new Date().toISOString()
                   }]
                 };
              }
           }
        }

        // Freshness Window: 24 Hours (As requested)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        let filtered = feed.items.filter((item: any) => {
          if (!item.isoDate && !item.pubDate) return false;
          const itemDate = new Date(item.isoDate || item.pubDate!);
          return itemDate >= twentyFourHoursAgo;
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
    // We check the source_url column in the articles table
    try {
      if (pubClient) {
        const normalizeUrl = (url: string) => {
          try {
            const u = new URL(url);
            return u.origin + u.pathname;
          } catch (e) {
            return url;
          }
        };

        const urlsToCheck = deduplicated.map(a => normalizeUrl(a.sourceUrl)).filter(url => url !== "#");
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
          !existingUrls.has(normalizeUrl(a.sourceUrl)) && 
          !existingTitles.has(a.title.toLowerCase().trim())
        );
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

    // Take top 100 (most recent but diverse) and randomize their final presentation
    const randomizedTopFeeds = interleaved.slice(0, 100).sort(() => Math.random() - 0.5);

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
            content: `You are an elite medical journalist and headline strategist for MedSense News, one of Africa's most-read health intelligence platforms. Your mission is to rewrite the provided medical news into a gripping, high-fidelity journalistic article that STOPS readers mid-scroll.

            ═══════════════════════════════════════
            ★ HEADLINE MASTERY RULES (MANDATORY) ★
            ═══════════════════════════════════════
            The title is your most powerful weapon. Every headline MUST:
            1. TRIGGER EMOTION — Use urgency, curiosity, fear, hope, or outrage. Never be neutral.
            2. USE POWER WORDS — Integrate words like: "Breakthrough", "Crisis", "Warning", "Urgent", "Revealed", "Hidden", "Shocking", "Now", "Finally", "Deadly", "Life-Saving", "Alarming", "Must-Know", "You Need to Know", "Doctors Warn", "Study Confirms", "Experts Reveal".
            3. BE SPECIFIC — Include numbers, timeframes, or a bold claim where possible. Vague headlines are FORBIDDEN.
            4. DRIVE ACTION — The reader must feel compelled to click and read immediately.
            5. MAXIMUM 12 WORDS — Sharp, punchy, impossible to ignore.

            PROVEN HEADLINE PATTERNS (use these as templates):
            - "[Power Word]: [Specific Claim or Statistic] That [Audience] Must Know Now"
            - "Doctors Issue Urgent Warning About [Topic] — Here's What You Need to Do"
            - "[Number] Silent Signs of [Condition] Millions Are Dangerously Ignoring"
            - "Breakthrough Study Reveals [Surprising Fact] — And It Changes Everything"
            - "The Hidden [Health Risk] Affecting [Specific Group] Right Now"
            - "Why [Common Belief] About [Topic] Is Putting Your Health at Risk"
            - "[Shocking Stat]: [Topic] Is Rising — What You Can Do About It"

            ═══════════════════════════════
            STRICT ARTICLE FORMATTING RULES
            ═══════════════════════════════
            1. Use exactly ONE main heading (the title). NEVER repeat this title inside the "content" field.
            2. NEVER include <h1> or <h2> tags in the "content" field. The "content" must start directly with the article body.
            3. DO NOT include placeholders like "By [Your Name]" or other website names in the body.
            4. Use <h3> for sub-sections like "Why This Is Escalating" or "What You Should Do Now" or "Understanding the Risk".
            5. Use bullet points (<ul> and <li>) for clarity in technical lists.
            6. Always end with a "MedSense Insight" section and a "Key Takeaway" section.
            7. CRITICAL: COMPLETELY IGNORE and EXCLUDE any legal disclaimers, copyright notices, "All rights reserved" statements, or permission warnings from the source text. NEVER include them in your output.
            8. STRICT CONTENT FILTER: You are exclusively a MEDICAL news AI. If the provided article is primarily about sports, football, general politics, entertainment, celebrities, or any topic that is NOT strictly related to health, medicine, medical research, or public health, you MUST reject it.
            9. GEOGRAPHICAL CATEGORIZATION: If the news is specifically about Nigeria or any African country (e.g., Nigerian doctors, NCDC, African outbreaks, local healthcare), the category MUST be 'Nigeria/Africa Health'. If the news is about international organizations (WHO, UN), global pandemics, or broad health trends outside Africa, the category MUST be 'Global Health'.

            JSON structure:
            {
              "rejected": boolean (Set to true ONLY if the article is non-medical, otherwise false),
              "title": "A POWERFUL, call-to-action headline that DEMANDS attention and drives clicks — following all Headline Mastery Rules above.",
              "summary": "A 2-sentence professional summary that amplifies the urgency of the headline and draws the reader deeper.",
              "content": "Full HTML content following the formatting rules above. (Leave empty if rejected: true)",
              "category": "One of: [Health, Medicine, Research, Public Health, Technology, Global Health, Nigeria/Africa Health, Health Alerts]",
              "visual_keyword": "A single specific medical keyword for image searching. CRITICAL: Use high-quality, professional, and clinical keywords only."
            }

            The tone should be ${tone}. 
            
            ★ WRITING STYLE GUIDELINE: Limit the usage of hyphens (-) in headlines and body text. Use professional commas or punctuation instead to maintain a clean, high-end editorial flow.
            
            REMEMBER: A mediocre headline kills a great story. Make it unforgettable.` 
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
      
      if (result.rejected === true) {
        throw new Error("Article rejected by AI: Content is non-medical (e.g., sports, politics, entertainment).");
      }

      return { 
        success: true, 
        transformed: {
          ...result,
          originalImage: sourceArticle.originalImage
        },
        msg: "Intelligence classified and report generated."
      };
    } else {
      if (data && data.error && data.error.message) {
         throw new Error(`Mistral API Error: ${data.error.message}`);
      }
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
