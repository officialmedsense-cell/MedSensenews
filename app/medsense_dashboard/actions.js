"use server";

import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure']
  }
});

const FEEDS = [
  "https://nigeriahealthwatch.com/feed/",
  "https://rss.punchng.com/v1/category/healthwise",
  "https://healthnews.ng/feed/",
  "https://www.medicalnewstoday.com/rss/headlines",
  "https://www.sciencedaily.com/rss/top/health.xml",
  "https://medicalxpress.com/rss-feed/"
];

export async function fetchLiveMedicalNews(customFeeds) {
  try {
    const allArticles = [];
    const feedsToUse = (customFeeds && customFeeds.length > 0) ? customFeeds : FEEDS;
    const selectedFeeds = customFeeds && customFeeds.length > 0 
      ? feedsToUse 
      : feedsToUse.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const url of selectedFeeds) {
      try {
        const feed = await parser.parseURL(url);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        let filtered = feed.items.filter(item => {
          if (!item.isoDate && !item.pubDate) return false;
          const itemDate = new Date(item.isoDate || item.pubDate);
          return itemDate >= twoDaysAgo;
        });

        if (filtered.length === 0 && feed.items.length > 0) {
           filtered = [feed.items[0]];
        }

        allArticles.push(...filtered.map(item => {
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
      } catch (feedErr) {
        console.error(`Feed Error [${url}]:`, feedErr);
      }
    }
    
    return {
      success: true,
      articles: allArticles.slice(0, 10),
      count: allArticles.length
    };
  } catch (error) {
    console.error("RSS Fetch Error:", error);
    return { success: false, error: "Failed to reach live news feeds." };
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function processArticleWithAI(sourceArticle, model, tone) {
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

  if (!MISTRAL_API_KEY) {
    return { success: false, error: "Mistral API Key is missing in .env.local" };
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
        model: model === "mistral-7b" ? "open-mistral-7b" : "mistral-small-latest",
        messages: [
          { 
            role: "system", 
            content: `You are a professional medical journalist. Rewrite the provided medical news into a high-fidelity, journalistic article.
            
            STRICT FORMATTING RULES:
            1. Use exactly ONE main heading (the title).
            2. DO NOT include placeholders like "By [Your Name]" in the body.
            3. Use <h3> for sub-sections.
            4. Use bullet points (<ul> and <li>) for clarity.
            5. Always end with a "MedSense Insight" section and a "Key Takeaway" section.
            
            JSON structure:
            {
              "title": "Headline",
              "summary": "2-sentence summary",
              "content": "Full HTML content",
              "category": "Health",
              "visual_keyword": "keyword"
            }
            
            The tone should be ${tone}.` 
          },
          { 
            role: "user", 
            content: `Title: ${sourceArticle.title}\nSummary: ${sourceArticle.summary}\nFull Text: ${sourceArticle.fullText}` 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const result = JSON.parse(data.choices[0].message.content);
      let domain = "external source";
      try { domain = new URL(sourceArticle.sourceUrl).hostname.replace('www.', ''); } catch (e) {}
      
      result.content += `\n<hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />\n<p style="font-size: 12px; color: #888;"><em><strong>Editorial Note:</strong> This report was prepared by MedSense News using verified public reporting and editorial analysis. Initial reporting credit: <a href="${sourceArticle.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #555; text-decoration: underline;">${domain}</a>.</em></p>`;

      return { 
        success: true, 
        transformed: {
          ...result,
          originalImage: sourceArticle.originalImage
        }
      };
    } else {
      throw new Error("Invalid response from Mistral AI");
    }
  } catch (error) {
    return { success: false, error: String(error.message || error) };
  }
}

export async function publishToNewsSite(payload) {
  try {
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('title', payload.headline)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Article already exists (Duplicate Prevented)." };
    }

    const today = new Date().toISOString().split('T')[0];
    let heroImage = payload.originalImage;
    if (!heroImage) {
      const searchTerms = payload.visualKeyword || payload.category || 'medicine';
      heroImage = `https://loremflickr.com/1200/800/${encodeURIComponent(searchTerms)},medical/all`;
    }

    const { error } = await supabase
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
        views: 0
      }]);

    if (error) throw error;

    return { 
      success: true, 
      msg: `UPLINK SUCCESS: "${payload.headline.substring(0, 30)}..." is now LIVE.` 
    };
  } catch (error) {
    return { success: false, error: String(error.message || error) };
  }
}
