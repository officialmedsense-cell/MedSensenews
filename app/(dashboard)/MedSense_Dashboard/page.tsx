"use client";

import React, { useState, useEffect } from "react";
import { 
  fetchLiveMedicalNews, 
  processArticleWithAI, 
  saveArticleToSupabase, 
  publishToNewsSite,
  processAICommand,
  deleteArticleFromSupabase,
  searchExternalNews,
  getStaffAccounts, 
  addStaffAccount, 
  deleteStaffAccount, 
  getArticlesFromSupabase,
  getSourcesFromCloud, 
  saveSourcesToCloud,
  isDuplicateArticle
} from "./actions";
import ReactMarkdown from 'react-markdown';

// --- Types ---
interface Article {
  id: string;
  title: string;
  summary: string;
  fullText: string;
  source: string;
  sourceUrl: string;
  date: string;
  time: string;
  category: string;
  relevance: number;
  severity: string;
  read: boolean;
  publishedToNews?: boolean;
  visualKeyword?: string;
  originalImage?: string;
}

interface Source {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  type: string;
}

interface LogEntry {
  time: string;
  tag: string;
  msg: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface User {
  email: string;
  role: 'admin' | 'staff';
}

interface StaffAccount {
  id: string;
  name?: string;
  email: string;
  password: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function MedSenseDashboard() {
  // --- State ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([
    { id: "1", name: "Nigeria Health Watch", url: "https://nigeriahealthwatch.com/feed/", status: "online", type: "rss" },
    { id: "2", name: "The Punch (Healthwise)", url: "https://rss.punchng.com/v1/category/healthwise", status: "online", type: "rss" },
    { id: "3", name: "Nature Medicine", url: "https://www.nature.com/nm.rss", status: "online", type: "rss" }
  ]);

  const [isInitialSourcesLoaded, setIsInitialSourcesLoaded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string>("Never");
  const [activeNav, setActiveNav] = useState("dashboard");
  
  const [pipelineState, setPipelineState] = useState<Record<string, { progress: number, count: number, status: 'idle' | 'running' | 'complete' }>>({
    collect: { progress: 0, count: 0, status: 'idle' },
    extract: { progress: 0, count: 0, status: 'idle' },
    filter: { progress: 0, count: 0, status: 'idle' },
    process: { progress: 0, count: 0, status: 'idle' },
    output: { progress: 0, count: 0, status: 'idle' }
  });

  const [settings, setSettings] = useState({
    aiModel: "mistral-small-latest",
    tone: "professional",
    publishUrl: "",
    publishToken: "",
    autoPublish: false,
    authorName: "Damilare",
    freshnessWindow: 24
  });

  const [showAddSource, setShowAddSource] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", url: "", type: "rss" });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [toasts, setToasts] = useState<{ id: number, msg: string, type: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'fullFeed'>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: "Neural Interface established. I am MedSA, your AOJ Group intelligence assistant. How can I assist your editorial operations today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [draftArticle, setDraftArticle] = useState<any>(null);
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);

  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", email: "", password: "" });
  const [staffError, setStaffError] = useState("");


  // --- Persistence & Initialization ---
  const fetchStaff = async () => {
     setStaffError("");
     const res = await getStaffAccounts();
     if (res.success && res.staff) {
        setStaffAccounts(res.staff);
     } else if (!res.success) {
        setStaffError(res.error || "Failed to load staff");
     }
  };

  const fetchPublished = async () => {
     const res = await getArticlesFromSupabase();
     if (res.success && res.articles) {
        setPublishedArticles(res.articles.slice(0, 30)); // Top 30 for AI context
     }
  };

  useEffect(() => {
    // Load persisted state on client mount
    const savedSources = localStorage.getItem('medsense_sources');
    const savedSettings = localStorage.getItem('medsense_settings');
    const savedTheme = localStorage.getItem('medsense_theme') as 'dark' | 'light';
    const savedUser = localStorage.getItem('medsense_user');
    const savedArticles = localStorage.getItem('medsense_discovery_articles');
    
    if (savedArticles) {
      try { setArticles(JSON.parse(savedArticles)); } catch (e) {}
    }
    
    // Cloud sync for sources
    getSourcesFromCloud().then(res => {
      if (res.success && res.sources && res.sources.length > 0) {
         setSources(res.sources);
         localStorage.setItem('medsense_sources', JSON.stringify(res.sources));
      } else if (savedSources) {
         try { setSources(JSON.parse(savedSources)); } catch (e) {}
      }
      setIsInitialSourcesLoaded(true);
    }).catch(() => {
      setIsInitialSourcesLoaded(true);
    });

    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch(e){}
    }
    
    fetchStaff();
    fetchPublished();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!isInitialSourcesLoaded) return;
    localStorage.setItem('medsense_sources', JSON.stringify(sources));
    if (authChecked) {
      saveSourcesToCloud(sources).catch(console.error);
    }
  }, [sources, authChecked, isInitialSourcesLoaded]);

  useEffect(() => {
    localStorage.setItem('medsense_discovery_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('medsense_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medsense_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('medsense_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('medsense_user');
    }
  }, [currentUser]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (loginEmail === "officialmedsense@gmail.com" && loginPassword === "Damilare242") {
      setCurrentUser({ email: loginEmail, role: 'admin' });
      return;
    }
    
    const staff = staffAccounts.find(s => {
      const emailMatch = s.email && loginEmail && s.email.trim().toLowerCase() === loginEmail.trim().toLowerCase();
      const passwordMatch = s.password && loginPassword && s.password.trim() === loginPassword.trim();
      return emailMatch && passwordMatch;
    });
    
    if (staff) {
      setCurrentUser({ email: staff.email, role: 'staff' });
      return;
    }
    
    setLoginError(`Unauthorized access. Invalid credentials. (${staffAccounts.length} accounts sync'd)`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail("");
    setLoginPassword("");
  };

  const addLog = (msg: any, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const safeMsg = typeof msg === 'string' ? msg : JSON.stringify(msg).substring(0, 100);
    setLogs(prev => [{ time, tag: type.toUpperCase(), msg: safeMsg, type }, ...prev].slice(0, 50));
  };

  const showToast = (msg: string, type: string = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handlePublishArticle = async (article: Article) => {
    addLog(`Initiating Uplink for: ${article.title.substring(0, 20)}...`, "info");
    const result = await publishToNewsSite({
      headline: article.title,
      category: article.category,
      author: settings.authorName,
      summary: article.summary,
      fullReport: article.fullText,
      visualKeyword: article.visualKeyword,
      originalImage: article.originalImage,
      sourceUrl: article.sourceUrl,
      targetUrl: settings.publishUrl
    });

    if (result.success) {
      showToast(result.msg || "Published successfully", "success");
      addLog(result.msg, "success");
      // Store the Supabase ID if returned (we'd need to update actions.ts to return it)
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, publishedToNews: true } : a));
      if (selectedArticle?.id === article.id) setSelectedArticle({ ...article, publishedToNews: true });
    } else {
      showToast(result.error || "Publication failed", "error");
      addLog(`Publication Error: ${result.error}`, "error");
    }
  };

  const handleDeleteArticle = async (article: Article) => {
    if (!confirm(`Permanently purge "${article.title}"? This cannot be undone.`)) return;
    
    // Remove from local state
    setArticles(prev => prev.filter(a => a.id !== article.id));
    if (selectedArticle?.id === article.id) setSelectedArticle(null);
    
    // Remove from Supabase
    const res = await deleteArticleFromSupabase(article.id);
    if (res.success) {
      showToast("Purged from live site", "success");
      addLog(`Purged article: ${article.title}`, "warning");
    } else {
      addLog(`Local purge only: ${res.error}`, "info");
    }
  };

  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) return showToast("Please fill all fields", "warning");
    const id = Math.random().toString(36).substr(2, 9);
    setSources(prev => [...prev, { ...newSource, id, status: 'online' } as Source]);
    setNewSource({ name: "", url: "", type: "rss" });
    setShowAddSource(false);
    showToast("New source linked successfully", "success");
    addLog(`Linked new intelligence hub: ${newSource.name}`, "success");
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    showToast("Source disconnected", "warning");
    addLog("Intelligence hub disconnected from neural uplink.", "warning");
  };

  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  const runScraper = async () => {
    if (isRunning) return;
    setIsRunning(true);
    
    // Clear old articles to make them disappear and start completely fresh
    setArticles([]);
    localStorage.removeItem('medsense_discovery_articles');
    
    try {
      addLog("Establishing Neural Uplink to Global News Feeds...", "info");
      const stages = ["collect", "extract", "filter", "process", "output"] as const;
      
      const sourceUrls = sources.map(s => s.url);
      const discoveryResult = await fetchLiveMedicalNews(sourceUrls, Number(settings.freshnessWindow || 24));
      let discovered: any[] = [];

      if (discoveryResult.success && discoveryResult.articles) {
        discovered = discoveryResult.articles;
        addLog(`Discovered ${discovered.length} live medical signals today.`, "success");
      }

      const processedUrls = new Set<string>();
      const processedTitles = new Set<string>();

      for (const stage of stages) {
        setPipelineState(prev => ({ ...prev, [stage]: { ...prev[stage], status: 'running' } }));
        
        if (stage === 'process') {
          for (const item of discovered) {
            const normalizedUrl = item.sourceUrl ? item.sourceUrl.toLowerCase().trim() : '';
            const normalizedTitle = item.title ? item.title.toLowerCase().trim() : '';
            
            if ((normalizedUrl && processedUrls.has(normalizedUrl)) || (normalizedTitle && processedTitles.has(normalizedTitle))) {
              continue;
            }

            // Pre-Check: Skip if already published in Supabase
            if (item.sourceUrl) {
               const isDuplicate = await isDuplicateArticle(item.sourceUrl);
               if (isDuplicate) {
                 addLog(`Skipping existing signal: ${item.title.substring(0, 30)}...`, "info");
                 continue;
               }
            }

            const res = await processArticleWithAI(item, settings.aiModel, settings.tone);
            if (res.success && res.transformed) {
              const newArticle: Article = {
                id: Math.random().toString(36).substr(2, 9),
                title: res.transformed.title,
                summary: res.transformed.summary,
                fullText: res.transformed.content,
                source: item.source,
                sourceUrl: item.sourceUrl,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                category: res.transformed.category,
                visualKeyword: res.transformed.visual_keyword,
                originalImage: res.transformed.originalImage,
                relevance: 95 + Math.floor(Math.random() * 5),
                severity: "High",
                read: false
              };
              
              if (normalizedUrl) processedUrls.add(normalizedUrl);
              if (normalizedTitle) processedTitles.add(normalizedTitle);
              
              setArticles(prev => [newArticle, ...prev]);
            } else {
              addLog(`AI Processing failed for "${item.title.substring(0, 20)}...": ${res.error || "Unknown error"}`, "error");
            }
            
            // Small delay to prevent hitting Mistral API rate limits (4.0 seconds)
            await sleep(4000);
          }
        }

        let prog = 0;
        while (prog < 100) {
          prog += 20;
          setPipelineState(prev => ({ ...prev, [stage]: { ...prev[stage], progress: prog } }));
          await sleep(200);
        }
        setPipelineState(prev => ({ ...prev, [stage]: { ...prev[stage], status: 'complete' } }));
      }
      setLastRun(new Date().toLocaleTimeString());
      showToast("Intelligence update complete", "success");
    } catch (err) {
      addLog("Scraper engine encountered a fault.", "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent, overrideMsg?: string) => {
    if (e) e.preventDefault();
    const userMsg = overrideMsg || chatInput.trim();
    if (!userMsg || isChatting) return;
    if (!overrideMsg) setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const res = await processAICommand(userMsg, { 
        articles: [
          ...(draftArticle ? [draftArticle] : []),
          ...articles,
          ...publishedArticles
        ], 
        sources 
      });

      if (res.success && res.result) {
        const { message, action, targetId, targetIds, query, editInstructions } = res.result;
        
        // --- 1. SEARCH NEWS ---
        if (action === 'SEARCH_NEWS' && query) {
          setChatMessages(prev => [...prev, { role: 'ai', content: `🔍 Searching neural network for: "${query}"...` }]);
          const searchRes = await searchExternalNews(query);
          if (searchRes.success && searchRes.articles.length > 0) {
            // Pick the first one and process it automatically to create a draft
            const first = searchRes.articles[0];
            const processed = await processArticleWithAI(
              { title: first.title, summary: "", fullText: "", sourceUrl: first.sourceUrl }, 
              settings.aiModel, 
              settings.tone
            );
            if (processed.success && processed.transformed) {
              const newDraft = {
                ...processed.transformed,
                id: 'draft-' + Date.now(),
                source: first.source,
                sourceUrl: first.sourceUrl,
                originalImage: processed.transformed.originalImage
              };
              setDraftArticle(newDraft);
              setChatMessages(prev => [...prev, { role: 'ai', content: `✨ **DRAFT GENERATED**\n\n**Headline:** ${newDraft.title}\n\n${newDraft.summary}\n\n*Type "post" to publish or "edit" to refine this.*` }]);
            }
          } else {
            setChatMessages(prev => [...prev, { role: 'ai', content: "I couldn't find any recent signals on that topic." }]);
          }
          setIsChatting(false);
          return;
        }

        setChatMessages(prev => [...prev, { role: 'ai', content: message }]);
        
        // --- 2. EDIT ARTICLE ---
        if (action === 'EDIT_ARTICLE' && editInstructions && draftArticle) {
          setChatMessages(prev => [...prev, { role: 'ai', content: "🔄 Synchronizing edits..." }]);
          // Use AI to refine the draft based on instructions
          const refinement = await processArticleWithAI(
            { title: draftArticle.title, summary: draftArticle.summary, fullText: draftArticle.fullText, sourceUrl: draftArticle.sourceUrl },
            settings.aiModel,
            `Refine the following article based on these instructions: ${editInstructions}`
          );
          if (refinement.success && refinement.transformed) {
            setDraftArticle({ ...draftArticle, ...refinement.transformed });
            setChatMessages(prev => [...prev, { role: 'ai', content: `✅ **DRAFT UPDATED**\n\n**Headline:** ${refinement.transformed.title}\n\n${refinement.transformed.summary}` }]);
          }
        }

        // --- 3. DELETE ARTICLE ---
        if (action === 'DELETE_ARTICLE') {
          const idsToPurge = targetIds || (targetId ? [targetId] : []);
          if (idsToPurge.length > 0) {
            // Remove from local state
            setArticles(prev => prev.filter(a => !idsToPurge.includes(a.id)));
            if (draftArticle && idsToPurge.includes(draftArticle.id)) setDraftArticle(null);
            
            // Attempt to remove from Supabase (if it's a published article)
            idsToPurge.forEach(async (id) => {
               // Note: This assumes the ID matches the Supabase ID, which we should ensure during publishing
               await deleteArticleFromSupabase(id);
            });

            showToast(idsToPurge.length > 1 ? `Purged ${idsToPurge.length} signals.` : "Signal purged.", "warning");
            addLog(`AI Action: Purged ${idsToPurge.length} articles from local and live feeds.`, "warning");
          }
        } 
        
        // --- 4. PUBLISH ARTICLE ---
        else if (action === 'PUBLISH_ARTICLE') {
          // Check if user is asking to publish the draft
          const articleToPub = draftArticle || articles.find(a => a.id === targetId);
          if (articleToPub) {
            const pubRes = await publishToNewsSite({
              headline: articleToPub.title || articleToPub.headline,
              category: articleToPub.category,
              author: settings.authorName,
              summary: articleToPub.summary,
              fullReport: articleToPub.fullText || articleToPub.content,
              originalImage: articleToPub.originalImage,
              sourceUrl: articleToPub.sourceUrl
            });
            if (pubRes.success) {
              showToast("Report Live!", "success");
              setDraftArticle(null);
            } else {
              showToast(pubRes.error || "Publication failed", "error");
            }
          }
        } 
        
        else if (action === 'GENERATE_SOCIAL_KIT' && targetId) {
          const article = articles.find(a => a.id === targetId);
          if (article) {
             setChatMessages(prev => [...prev, { role: 'ai', content: `📣 Generating promotional assets for "${article.title}"...` }]);
             const res = await processArticleWithAI(
                { title: article.title, summary: article.summary, fullText: article.fullText || "", sourceUrl: article.sourceUrl },
                settings.aiModel,
                "Generate a social media promotion kit: Twitter Thread (3-5 tweets), a LinkedIn Post, and an Instagram Caption. Use high-authority medical tone."
             );
             if (res.success && res.transformed) {
                setChatMessages(prev => [...prev, { role: 'ai', content: `✨ **SOCIAL ASSETS GENERATED**\n\n${res.transformed.content || res.transformed.summary}` }]);
             }
          }
        }
        
        else if (action === 'RUN_DISCOVERY') {
          runScraper();
        }
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', content: "Neural sync error. Please retry." }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: "Neural link severed." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const filteredArticles = articles.filter(a => 
    (activeCategory === "all" || a.category === activeCategory) &&
    (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- Render ---
  if (!authChecked) return null;

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
             <img src="/logo.png" alt="MedSense Logo" style={{ height: '40px', objectFit: 'contain', marginBottom: '16px', filter: 'drop-shadow(0 0 12px var(--accent-glow))' }} />
             <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Sign in to access the Intelligence Command</p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {loginError && <div style={{ padding: '12px', background: 'hsla(0, 100%, 50%, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', textAlign: 'center', border: '1px solid hsla(0, 100%, 50%, 0.2)' }}>{loginError}</div>}

             <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>PASSWORD</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
             </div>
             <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>Authorize Access</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="medsense-app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <img src="/logo.png" alt="MedSense" style={{ height: '24px', filter: 'drop-shadow(0 0 8px var(--accent-glow))' }} />
        <button className="btn btn-ghost" onClick={() => setSidebarOpen(true)} style={{ padding: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="MedSense Logo" style={{ height: '36px' }} />
          </div>
          <button className="btn btn-ghost" onClick={() => setSidebarOpen(false)} style={{ padding: '4px', minWidth: 'auto', display: 'none' }} id="close-sidebar-btn">
             &times;
          </button>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', label: 'Command Center', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
            { id: 'aichat', label: 'AI Command Hub', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
            { id: 'sources', label: 'Intelligence Sources', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3' },
            { id: 'pipeline', label: 'Neural Pipeline', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
            { id: 'settings', label: 'System Config', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
            ...(currentUser.role === 'admin' ? [{ id: 'staff', label: 'Staff Registry', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' }] : [])
          ].map(item => (
            <a 
              key={item.id}
              href={`#${item.id}`}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={(e) => { 
                e.preventDefault(); 
                setActiveNav(item.id); 
                setSidebarOpen(false);
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); 
              }}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} />
              </svg>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '20px 12px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
               <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                 {currentUser.email.charAt(0).toUpperCase()}
               </div>
               <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: '800', textTransform: 'uppercase' }}>{currentUser.role}</div>
               </div>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '6px', color: 'var(--danger)' }} title="Sign Out">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
         </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        {/* Metrics Row (Horizontal Ribbon) */}
        {activeNav !== 'aichat' && (
        <div className="metrics-grid">
           <div className="metric-box">
              <div className="metric-label">System</div>
              <div className="metric-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                <span className="status-dot status-active" style={{ width: '6px', height: '6px' }}></span>
                ONLINE
              </div>
           </div>
           <div className="metric-box">
              <div className="metric-label">Sync</div>
              <div className="metric-value" style={{ fontSize: '14px' }}>{lastRun === "Never" ? "Never" : lastRun.split(' ')[0]}</div>
           </div>
           <div className="metric-box">
              <div className="metric-label">Signals</div>
              <div className="metric-value" style={{ fontSize: '14px' }}>{articles.length.toString().padStart(2, '0')}</div>
           </div>
        </div>
        )}

        {/* Settings Overlay */}
        {activeNav === 'settings' && (
        <section className="glass-card" id="settings" style={{ marginBottom: '24px' }}>
           <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>System Configuration</h2>
           <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>AI INTELLIGENCE CORE</label>
                 <select value={settings.aiModel} onChange={e => setSettings({...settings, aiModel: e.target.value})} style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)' }}>
                    <option value="mistral-small-latest">Mistral Small (Optimized)</option>
                    <option value="mistral-large-latest">Mistral Large (High Fidelity)</option>
                 </select>
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>DISCOVERY FRESHNESS</label>
                 <select value={settings.freshnessWindow || 24} onChange={e => setSettings({...settings, freshnessWindow: Number(e.target.value)})} style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)' }}>
                    <option value={24}>Last 24 Hours</option>
                    <option value={48}>Last 48 Hours</option>
                    <option value={72}>Last 3 Days</option>
                    <option value={168}>Last 7 Days</option>
                    <option value={720}>Last 30 Days</option>
                 </select>
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>EDITORIAL SIGNATURE</label>
                 <input type="text" value={settings.authorName} onChange={e => setSettings({...settings, authorName: e.target.value})} style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>PUBLICATION TARGET</label>
                 <input type="text" value={settings.publishUrl} onChange={e => setSettings({...settings, publishUrl: e.target.value})} placeholder="https://..." style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)' }} />
              </div>
           </div>
         </section>
         )}
         
         {/* Staff Management (Admin Only) */}
        {currentUser.role === 'admin' && activeNav === 'staff' && (
           <section className="dashboard-panel" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', minHeight: '600px', maxHeight: '80vh', overflowY: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                 <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Staff Registry & Access Control</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Manage secure credentials for the Intelligence Hub</p>
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-ghost" onClick={fetchStaff} style={{ padding: '10px' }} title="Refresh Registry">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddStaff(!showAddStaff)}>
                       {showAddStaff ? "Close Form" : "+ Add Staff Account"}
                    </button>
                 </div>
              </div>

              {staffError && (
                 <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', color: 'var(--danger)', borderRadius: '4px', fontSize: '12px', border: '1px solid rgba(255,0,0,0.2)' }}>
                    ⚠️ {staffError}
                 </div>
              )}
              
              {showAddStaff && (
                <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>FULL NAME</label>
                     <input type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. John Doe" style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>STAFF EMAIL</label>
                     <input type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>PASSWORD</label>
                     <input type="text" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                   </div>
                   <button className="btn btn-primary" disabled={isProvisioning} onClick={async () => {
                       if (newStaff.name && newStaff.email && newStaff.password) {
                          setIsProvisioning(true);
                          const res = await addStaffAccount(newStaff.name, newStaff.email, newStaff.password);
                          if (res.success) {
                             if (res.staff) {
                                setStaffAccounts(prev => {
                                   const filtered = prev.filter(s => s.email !== res.staff.email);
                                   return [...filtered, res.staff];
                                });
                             } else {
                                await fetchStaff();
                             }
                             setNewStaff({ name: "", email: "", password: "" });
                             setShowAddStaff(false);
                             showToast("Staff account provisioned", "success");
                          } else {
                             showToast(res.error || "Provisioning failed", "error");
                          }
                          setIsProvisioning(false);
                       } else {
                          showToast("All fields are required", "warning");
                       }
                    }} style={{ padding: '10px 16px' }}>
                       {isProvisioning ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : "Provision Account"}
                   </button>
                </div>
              )}

              <div style={{ display: 'grid', gap: '16px' }}>
                 {/* Special Card for Global Director (Hardcoded Admin) */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '2px solid var(--accent-primary)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                       <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>🛡️</div>
                       <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Global Director</h3>
                          <p style={{ fontSize: '13px', color: 'var(--accent-primary)', fontWeight: '700' }}>officialmedsense@gmail.com</p>
                       </div>
                    </div>
                    <span style={{ fontSize: '11px', background: 'var(--accent-primary)', color: 'white', padding: '4px 10px', borderRadius: '100px', fontWeight: '800' }}>SYSTEM ROOT</span>
                 </div>

                 {staffAccounts.filter(s => s.email !== 'officialmedsense@gmail.com').map(staff => (
                    <div key={staff.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                             {staff.name?.charAt(0) || "S"}
                          </div>
                          <div>
                             <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{staff.name || 'Staff Member'}</h3>
                             <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{staff.email}</p>
                          </div>
                       </div>
                       
                       <div style={{ display: 'flex', gap: '8px' }}>
                          {editingStaffId === staff.id ? (
                             <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} placeholder="New Password" style={{ padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--primary)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={async () => {
                                   const res = await addStaffAccount(staff.name || "Staff", staff.email, editData.password);
                                   if (res.success) {
                                      setEditingStaffId(null);
                                      showToast("Password updated", "success");
                                   }
                                }}>Save</button>
                                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setEditingStaffId(null)}>Cancel</button>
                             </div>
                          ) : (
                             <>
                                <button className="btn btn-ghost" onClick={() => {
                                   setEditingStaffId(staff.id);
                                   setEditData({ name: staff.name || "", email: staff.email, password: "" });
                                }} style={{ color: 'var(--accent-primary)' }}>Edit</button>
                                <button className="btn btn-ghost" onClick={async () => {
                                   if (confirm(`Revoke access for ${staff.email}?`)) {
                                      const res = await deleteStaffAccount(staff.id);
                                      if (res.success) {
                                         setStaffAccounts(prev => prev.filter(s => s.id !== staff.id));
                                         showToast("Access revoked", "error");
                                      }
                                   }
                                }} style={{ color: 'var(--danger)' }}>Remove</button>
                             </>
                          )}
                       </div>
                    </div>
                 ))}

                 {staffAccounts.filter(s => s.email !== 'officialmedsense@gmail.com').length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                       No additional staff members registered.
                    </div>
                 )}
              </div>
           </section>
        )}

        {['dashboard', 'pipeline', 'sources'].includes(activeNav) && (
        <header className="header-row">
          <div className="page-title">
            <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }}>Intelligence Command</h1>
            <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>GLOBAL INTELLIGENCE & NEURAL DISCOVERY</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <input 
                  type="text" 
                  placeholder="Filter signals..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '10px 16px 10px 36px', color: 'var(--text-primary)', fontSize: '14px' }}
                />
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
             </div>
             <button className="btn btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ padding: '10px 16px' }} title="Toggle Theme">
                {theme === 'dark' ? '☀️' : '🌙'}
             </button>
             <button className="btn btn-primary" onClick={runScraper} disabled={isRunning} style={{ padding: '10px 20px' }}>
                {isRunning ? <span className="spinner"></span> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>}
                <span style={{ fontSize: '13px' }}>{isRunning ? "Processing..." : "Run Discovery"}</span>
             </button>
          </div>
        </header>
        )}

        <div className="dashboard-grid" style={viewMode === 'fullFeed' || activeNav === 'aichat' ? { gridTemplateColumns: '1fr' } : {}}>
          {/* AI Chatbox View */}
          {activeNav === 'aichat' && (
            <section id="aichat" className="aichat-interface">
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border-dim)' }}>
                     <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Neural Interface</h2>
                     <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Issue high-level directives to the MedSense autonomous network.</p>
                  </div>
                  
                  <div style={{ flex: 1, padding: '32px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {chatMessages.map((msg, i) => (
                       <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ 
                             maxWidth: '85%', 
                             padding: '14px 20px', 
                             borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                             background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                             color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                             border: msg.role === 'ai' ? '1px solid var(--border-dim)' : 'none',
                             fontSize: '15px',
                             lineHeight: '1.6',
                             boxShadow: msg.role === 'ai' ? 'var(--shadow-premium)' : 'none',
                             whiteSpace: 'pre-wrap',
                             wordBreak: 'break-word'
                          }}>
                             {msg.role === 'ai' ? (
                                <ReactMarkdown components={{
                                  p: ({node, ...props}) => <p style={{marginBottom: '1rem'}} {...props} />,
                                  ul: ({node, ...props}) => <ul style={{paddingLeft: '1.5rem', marginBottom: '1rem'}} {...props} />,
                                  li: ({node, ...props}) => <li style={{marginBottom: '0.5rem'}} {...props} />,
                                  strong: ({node, ...props}) => <strong style={{fontWeight: '800', color: 'var(--accent-primary)'}} {...props} />
                                }}>
                                  {msg.content}
                                </ReactMarkdown>
                             ) : msg.content}
                          </div>
                       </div>
                     ))}
                     {isChatting && (
                       <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <div className="badge badge-tech" style={{ padding: '8px 16px', animation: 'pulse 1.5s infinite' }}>MedSA is analyzing directive...</div>
                       </div>
                     )}
                  </div>

                  <form onSubmit={handleSendChatMessage} style={{ marginTop: '24px', position: 'relative' }}>
                     <input 
                       type="text" 
                       value={chatInput}
                       onChange={e => setChatInput(e.target.value)}
                       placeholder="Enter command (e.g. 'Delete the article about malaria')..."
                       style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', padding: '20px 70px 20px 24px', color: 'var(--text-primary)', outline: 'none', fontSize: '16px', boxShadow: '0 0 40px var(--accent-glow)' }}
                     />
                     <button type="submit" className="btn btn-primary" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', padding: '10px 16px' }}>
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                     </button>
                  </form>
               </div>

               {/* Capabilities Sidebar */}
               <div className="aichat-sidebar" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)', padding: '24px', alignSelf: 'start' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '20px', letterSpacing: '1px' }}>SYSTEM CAPABILITIES</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {[
                        { title: "Delete Articles", desc: "Permanently remove any discovered signal from the database.", cmd: "'Delete article about...'" },
                        { title: "Social Kits", desc: "Generate Twitter threads and LinkedIn posts for any news.", cmd: "'Generate social kit for...'" },
                        { title: "Uplink to Site", desc: "Publish a report directly to the MedSense News live site.", cmd: "'Publish report on...'" },
                        { title: "Run Discovery", desc: "Trigger a fresh scan of all intelligence hubs.", cmd: "'Start news scan'" },
                        { title: "Summarize Feed", desc: "Get an AI summary of current top intelligence signals.", cmd: "'What are the top stories?'" }
                     ].map((cap, i) => (
                        <div key={i}>
                           <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>{cap.title}</div>
                           <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{cap.desc}</div>
                           <code style={{ fontSize: '10px', background: 'var(--bg-base)', padding: '4px 8px', borderRadius: '4px', color: 'var(--accent-secondary)' }}>{cap.cmd}</code>
                        </div>
                     ))}
                  </div>
               </div>
            </section>
          )}

          {/* Article Feed */}
          {['dashboard', 'pipeline', 'sources'].includes(activeNav) && (
          <section className="glass-card" id="dashboard" style={{ gridRow: 'span 2' }}>
            <div className="feed-header" style={{ marginBottom: viewMode === 'fullFeed' ? '12px' : '24px' }}>
               <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
                 {viewMode === 'fullFeed' ? 'Global Intelligence Feed' : 'Active Intelligence Feed'}
               </h2>
               <div style={{ display: 'flex', gap: '8px' }}>
                  {['all', 'Medicine', 'Research', 'Health'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setActiveCategory(cat)}
                      className={`badge ${activeCategory === cat ? 'badge-tech' : 'badge-health'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
               </div>
            </div>

            {viewMode === 'fullFeed' && (
              <button 
                onClick={() => setViewMode('dashboard')} 
                className="btn btn-ghost" 
                style={{ padding: '8px 16px', marginBottom: '16px', fontSize: '12px' }}
              >
                ← Back to Dashboard
              </button>
            )}

            <div className="feed-list">
              {filteredArticles.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                   <div className="scanning" style={{ fontSize: '40px', marginBottom: '16px' }}>📡</div>
                   <p>No active signals detected. Initiate news discovery.</p>
                </div>
              ) : (
                (viewMode === 'dashboard' ? filteredArticles.slice(0, 5) : filteredArticles).map((article) => (
                  <div key={article.id} className="intel-card" onClick={() => setSelectedArticle(article)}>
                    <div className="intel-thumb">
                       {article.originalImage ? (
                         <img src={article.originalImage} alt="news" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                       ) : (
                         "🩺"
                       )}
                    </div>
                    <div className="intel-body">
                      <div className="intel-meta">
                        <span className={`badge ${article.category === 'Research' ? 'badge-tech' : 'badge-health'}`}>{article.category}</span>
                        <a href={article.sourceUrl !== "#" ? article.sourceUrl : undefined} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }} onClick={e => e.stopPropagation()}>
                           {article.source}
                        </a>
                        <span>•</span>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{article.relevance}% Match</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <h3 style={{ margin: 0, flex: 1 }}>{article.title}</h3>
                        <button 
                          className="btn btn-ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNav('aichat');
                            handleSendChatMessage(undefined, `Generate a professional social media promotion kit for this article: "${article.title}"`);
                          }}
                          style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
                        >
                          📣 SOCIAL
                        </button>
                      </div>
                      <p className="intel-summary">{article.summary}</p>
                    </div>
                  </div>
                ))
              )}
              {viewMode === 'dashboard' && filteredArticles.length > 5 && (
                <button 
                  onClick={() => setViewMode('fullFeed')}
                  className="btn btn-ghost" 
                  style={{ width: '100%', marginTop: '16px', borderStyle: 'dashed' }}
                >
                  View All Signals ({filteredArticles.length})
                </button>
              )}
            </div>
          </section>
          )}

          {/* Independent Scrolling Sidebar Content */}
          {['dashboard', 'pipeline', 'sources'].includes(activeNav) && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <section className="glass-card" id="pipeline">
                 <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Neural Pipeline Status</h2>
                 <div className="pipeline-track">
                    {Object.entries(pipelineState).map(([stage, state]) => (
                      <div key={stage} className="stage-row" style={{ opacity: state.status === 'idle' ? 0.4 : 1 }}>
                         <div style={{ minWidth: '80px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: state.status === 'running' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{stage}</div>
                         <div style={{ flex: 1 }}>
                            <div className="stage-progress-bg">
                               <div className="stage-progress-fill" style={{ width: `${state.progress}%` }}></div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="glass-card" id="sources">
                 <div className="feed-header" style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '800' }}>Intelligence Hubs</h2>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setShowAddSource(!showAddSource)}>
                       {showAddSource ? "Cancel" : "+"}
                    </button>
                 </div>

                 {showAddSource && (
                   <div style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)' }}>
                       <input 
                       type="text" 
                       placeholder="Hub Name" 
                       value={newSource.name} 
                       onChange={e => setNewSource({...newSource, name: e.target.value})}
                       style={{ width: '100%', marginBottom: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', padding: '8px', color: 'var(--text-primary)' }}
                     />
                     <input 
                       type="text" 
                       placeholder="Feed URL" 
                       value={newSource.url} 
                       onChange={e => setNewSource({...newSource, url: e.target.value})}
                       style={{ width: '100%', marginBottom: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', padding: '8px', color: 'var(--text-primary)' }}
                     />
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <select 
                         value={newSource.type} 
                         onChange={e => setNewSource({...newSource, type: e.target.value})}
                         style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', padding: '8px', color: 'var(--text-primary)' }}
                       >
                         <option value="rss">RSS Feed</option>
                         <option value="api">JSON API</option>
                       </select>
                       <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={handleAddSource}>Link</button>
                     </div>
                   </div>
                 )}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {(showAllSources ? sources : sources.slice(0, 4)).map(source => (
                       <div key={source.id} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingSourceId === source.id ? '8px' : '0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <div className={`status-dot status-${source.status}`} style={{ width: '6px', height: '6px' }}></div>
                               <span style={{ fontSize: '13px', fontWeight: '600' }}>{source.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                               <button onClick={() => setEditingSourceId(editingSourceId === source.id ? null : source.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                               </button>
                               <button onClick={() => handleDeleteSource(source.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                               </button>
                            </div>
                         </div>
                         {editingSourceId === source.id && (
                            <input 
                               type="text" 
                               defaultValue={source.url} 
                               onBlur={(e) => {
                                  setSources(prev => prev.map(s => s.id === source.id ? {...s, url: e.target.value} : s));
                                  setEditingSourceId(null);
                                  showToast("Link updated", "success");
                               }}
                               autoFocus
                               style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--accent-primary)', borderRadius: '4px', padding: '4px 8px', color: 'var(--text-primary)', fontSize: '11px' }}
                            />
                         )}
                         <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{source.type.toUpperCase()}</span>
                            <span style={{ opacity: 0.5 }}>{source.url.substring(0, 30)}...</span>
                         </div>
                       </div>
                     ))}
                     {sources.length > 4 && (
                       <button 
                         onClick={() => setShowAllSources(!showAllSources)} 
                         className="btn btn-ghost" 
                         style={{ width: '100%', padding: '8px', fontSize: '11px', color: 'var(--accent-primary)', border: '1px dashed var(--border-dim)' }}
                       >
                         {showAllSources ? "↑ Show Less" : `+ Show ${sources.length - 4} More Hubs`}
                       </button>
                     )}
                 </div>
              </section>

              <section className="glass-card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
                 <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px' }}>System Telemetry</h2>
                 <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {logs.map((log, i) => (
                      <div key={i} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-dim)' }}>
                         <span style={{ color: 'var(--accent-primary)' }}>[{log.time}]</span> {log.msg}
                      </div>
                    ))}
                 </div>
              </section>
          </aside>
          )}
        </div>
      </main>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
           <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-section" style={{ borderBottom: '1px solid var(--border-dim)' }}>
                 <div className="intel-meta">
                    <span className="badge badge-health">{selectedArticle.category}</span>
                    <span style={{ fontWeight: '700' }}>By {settings.authorName}</span>
                    <span>•</span>
                    <span>{selectedArticle.date}</span>
                    {selectedArticle.sourceUrl && selectedArticle.sourceUrl !== "#" && (
                      <>
                        <span>•</span>
                        <a href={selectedArticle.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                          Source: {selectedArticle.source}
                        </a>
                      </>
                    )}
                 </div>
                 <h2 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.2', marginTop: '16px' }}>{selectedArticle.title}</h2>
              </div>
              <div className="modal-section" style={{ fontSize: '18px', lineHeight: '1.8', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: selectedArticle.fullText }} />
              <div className="modal-section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                 <button className="btn btn-ghost" onClick={() => setSelectedArticle(null)}>Close</button>
                 <button 
                  className="btn btn-primary" 
                  onClick={() => handlePublishArticle(selectedArticle)}
                  disabled={selectedArticle.publishedToNews}
                 >
                  {selectedArticle.publishedToNews ? "✅ Already Live" : "🚀 Confirm & Uplink"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ borderLeft: `4px solid var(--${t.type === 'success' ? 'success' : 'danger'})` }}>
             {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
