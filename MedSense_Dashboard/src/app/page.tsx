"use client";

import React, { useState, useEffect } from "react";
import { 
  fetchLiveMedicalNews, 
  processArticleWithAI, 
  saveArticleToSupabase, 
  publishToNewsSite,
  getArticlesFromSupabase,
  isDuplicateArticle
} from "./actions";

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
  email: string;
  password: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function EditorialStaffPortal() {
  // --- State ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([
    { id: "1", name: "Nigeria Health Watch", url: "https://nigeriahealthwatch.com/feed/", status: "online", type: "rss" },
    { id: "2", name: "The Punch (Healthwise)", url: "https://rss.punchng.com/v1/category/healthwise", status: "online", type: "rss" },
    { id: "3", name: "Nature Medicine", url: "https://www.nature.com/nm.rss", status: "online", type: "rss" }
  ]);

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
    authorName: "Damilare"
  });

  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", url: "", type: "rss" });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [toasts, setToasts] = useState<{ id: number, msg: string, type: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'fullFeed'>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ email: "", password: "" });

  // --- Persistence & Initialization ---
  useEffect(() => {
    // Load persisted state on client mount
    const savedSources = localStorage.getItem('medsense_sources');
    const savedSettings = localStorage.getItem('medsense_settings');
    const savedTheme = localStorage.getItem('medsense_theme') as 'dark' | 'light';
    const savedUser = localStorage.getItem('medsense_user');
    const savedStaff = localStorage.getItem('medsense_staff');
    
    if (savedSources) {
      try { setSources(JSON.parse(savedSources)); } catch (e) {}
    }
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch(e){}
    }
    if (savedStaff) {
      try { setStaffAccounts(JSON.parse(savedStaff)); } catch(e){}
    }
    setAuthChecked(true);

    // Synchronize with Supabase articles
    const syncArticles = async () => {
      const { success, articles: fetched } = await getArticlesFromSupabase();
      if (success && fetched) {
        // Map database fields to the Article interface used in the UI
        const mapped = fetched.map((a: any) => ({
          id: a.id,
          title: a.title,
          summary: a.summary || a.excerpt,
          fullText: a.content || a.fullText,
          source: a.source || 'Archive',
          sourceUrl: a.source_url || a.sourceUrl || '#',
          date: a.date,
          time: a.created_at ? new Date(a.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }) : '00:00',
          category: a.category,
          relevance: a.relevance || 99,
          severity: a.severity || 'Normal',
          read: true,
          publishedToNews: true,
          originalImage: a.image
        }));
        setArticles(mapped);
      }
    };
    syncArticles();
  }, []);

  useEffect(() => {
    localStorage.setItem('medsense_sources', JSON.stringify(sources));
  }, [sources]);

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

  useEffect(() => {
    localStorage.setItem('medsense_staff', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (loginEmail === "officialmedsense@gmail.com" && loginPassword === "Damilare242") {
      setCurrentUser({ email: loginEmail, role: 'admin' });
      return;
    }
    
    const staff = staffAccounts.find(s => s.email === loginEmail && s.password === loginPassword);
    if (staff) {
      setCurrentUser({ email: staff.email, role: 'staff' });
      return;
    }
    
    setLoginError("Unauthorized access. Invalid credentials.");
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
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, publishedToNews: true } : a));
      if (selectedArticle?.id === article.id) setSelectedArticle({ ...article, publishedToNews: true });
    } else {
      showToast(result.error || "Publication failed", "error");
      addLog(`Publication Error: ${result.error}`, "error");
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
    try {
      addLog("Establishing Neural Uplink to Global News Feeds...", "info");
      const stages = ["collect", "extract", "filter", "process", "output"] as const;
      
      const sourceUrls = sources.map(s => s.url);
      const discoveryResult = await fetchLiveMedicalNews(sourceUrls);
      let discovered: any[] = [];

      if (discoveryResult.success && discoveryResult.articles) {
        discovered = discoveryResult.articles;
        addLog(`Discovered ${discovered.length} live medical signals today.`, "success");
      }

      for (const stage of stages) {
        setPipelineState(prev => ({ ...prev, [stage]: { ...prev[stage], status: 'running' } }));
        
        if (stage === 'process') {
          for (const item of discovered) {
            // Pre-Check: Skip if already published
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
              setArticles(prev => [newArticle, ...prev]);
            }
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ padding: '8px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-ghost" onClick={() => setSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
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

        {/* Settings Overlay */}
        <section className="glass-card" id="settings" style={{ marginBottom: '24px' }}>
           <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>System Configuration</h2>
           <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>AI INTELLIGENCE CORE</label>
                 <select value={settings.aiModel} onChange={e => setSettings({...settings, aiModel: e.target.value})} style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)' }}>
                    <option value="mistral-small-latest">Mistral Small (Optimized)</option>
                    <option value="mistral-large-latest">Mistral Large (High Fidelity)</option>
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

        {/* Staff Management (Admin Only) */}
        {currentUser.role === 'admin' && (
           <section className="glass-card" id="staff" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Staff Registry & Access Control</h2>
                 <button className="btn btn-ghost" onClick={() => setShowAddStaff(!showAddStaff)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                   {showAddStaff ? "Cancel" : "+ Add Staff Account"}
                 </button>
              </div>
              
              {showAddStaff && (
                <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>STAFF EMAIL</label>
                     <input type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>TEMPORARY PASSWORD</label>
                     <input type="text" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                   </div>
                   <button className="btn btn-primary" onClick={() => {
                      if (newStaff.email && newStaff.password) {
                         setStaffAccounts([...staffAccounts, { id: Date.now().toString(), email: newStaff.email, password: newStaff.password }]);
                         setNewStaff({ email: "", password: "" });
                         setShowAddStaff(false);
                         showToast("Staff account provisioned", "success");
                      }
                   }} style={{ padding: '10px 16px' }}>Provision Account</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ fontWeight: '700', fontSize: '14px' }}>officialmedsense@gmail.com</div>
                       <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px', fontWeight: '800' }}>SYSTEM ADMINISTRATOR</div>
                    </div>
                    <div style={{ fontSize: '20px', opacity: 0.5 }}>🛡️</div>
                 </div>
                 
                 {staffAccounts.map(staff => (
                   <div key={staff.id} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                         <div style={{ fontWeight: '700', fontSize: '14px' }}>{staff.email}</div>
                         <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '800' }}>EDITORIAL STAFF</div>
                      </div>
                      <button className="btn btn-ghost" onClick={() => {
                         if (confirm(`Revoke access for ${staff.email}?`)) {
                            setStaffAccounts(staffAccounts.filter(s => s.id !== staff.id));
                            showToast("Access revoked", "error");
                         }
                      }} style={{ color: 'var(--danger)', padding: '6px 12px', fontSize: '11px' }}>Revoke Access</button>
                   </div>
                 ))}
                 {staffAccounts.length === 0 && (
                   <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-dim)' }}>
                      No staff accounts provisioned. You are the sole operator.
                   </div>
                 )}
              </div>
           </section>
         )}

        <header className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="page-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }}>Editorial Staff Portal</h1>
              <div style={{ 
                background: 'rgba(30, 58, 138, 0.1)', 
                padding: '4px 12px', 
                borderRadius: '100px', 
                fontSize: '12px', 
                fontWeight: 700, 
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(30, 58, 138, 0.2)'
              }}>
                <i className="fas fa-clock"></i>
                <span id="dashboard-live-clock">Syncing...</span>
              </div>
            </div>
            <p>High-fidelity medical intelligence discovery and news uplink.</p>
          </div>
          <script dangerouslySetInnerHTML={{ __html: `
            setInterval(() => {
              const el = document.getElementById('dashboard-live-clock');
              if (el) {
                const now = new Date();
                el.innerText = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Africa/Lagos' }) + ' | ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Lagos' });
              }
            }, 1000);
          `}} />
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

        <div className="dashboard-grid" style={viewMode === 'fullFeed' ? { gridTemplateColumns: '1fr' } : {}}>
          {/* Article Feed */}
          <section className="glass-card" id="dashboard" style={{ gridRow: 'span 2' }}>
            <div className="feed-header" style={{ marginBottom: viewMode === 'fullFeed' ? '12px' : '24px' }}>
               <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
                 {viewMode === 'fullFeed' ? 'Intelligence Feed' : 'Active Intelligence Feed'}
               </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['all', 'Medicine', 'Health', 'Research', 'Public Health', 'Technology', 'Weather'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setActiveCategory(cat)}
                      className={`badge ${activeCategory === cat ? 'badge-tech' : 'badge-health'}`}
                      style={{ cursor: 'pointer', border: 'none', fontSize: '10px' }}
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
                style={{ padding: '6px 12px', fontSize: '12px', marginBottom: '20px', border: '1px solid var(--border-active)' }}
              >
                ← Return to Command Center
              </button>
            )}

            <div className="feed-list">
              {filteredArticles.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <svg style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  <p>No active signals detected. Run Discovery to begin.</p>
                </div>
              ) : (
                (viewMode === 'dashboard' ? filteredArticles.slice(0, 3) : filteredArticles).map(article => (
                  <div key={article.id} className="intel-card" onClick={() => setSelectedArticle(article)}>
                    <div className="intel-thumb">
                        {article.category === 'Medicine' && '🔬'}
                        {article.category === 'Technology' && '🤖'}
                        {article.category === 'Research' && '📊'}
                        {article.category === 'Health' && '🏥'}
                        {article.category === 'Weather' && '☁️'}
                        {!['Medicine', 'Technology', 'Research', 'Health', 'Weather'].includes(article.category) && '📢'}
                    </div>
                    <div className="intel-body">
                      <div className="intel-meta">
                        <span className={`badge ${article.category === 'Medicine' ? 'badge-health' : 'badge-tech'}`}>{article.category}</span>
                        <span style={{ color: 'var(--text-muted)' }}>By {settings.authorName}</span>
                        <span>•</span>
                        <span>{article.time}</span>
                      </div>
                      <h3>{article.title}</h3>
                      <p className="intel-summary">{article.summary}</p>
                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 16px', fontSize: '11px' }}
                              onClick={(e) => { e.stopPropagation(); handlePublishArticle(article); }}
                              disabled={article.publishedToNews}
                            >
                              {article.publishedToNews ? "✅ Published" : "🚀 Publish Uplink"}
                            </button>
                            {article.sourceUrl && (
                               <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--accent-primary)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                                  Source Origin ↗
                               </a>
                            )}
                         </div>
                         <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-secondary)' }}>{article.relevance}% RELEVANCE</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {viewMode === 'dashboard' && filteredArticles.length > 3 && (
              <button 
                onClick={() => setViewMode('fullFeed')} 
                className="btn btn-ghost" 
                style={{ width: '100%', marginTop: '20px', padding: '12px', border: '1px dashed var(--border-active)', justifyContent: 'center' }}
              >
                View All {filteredArticles.length} Intelligence Signals →
              </button>
            )}
          </section>

          {/* Right Sidebar: Pipeline & Telemetry */}
          {viewMode === 'dashboard' && (
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
             <section className="glass-card" id="pipeline">
                <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Neural Pipeline Status</h2>
                <div className="pipeline-track">
                   {Object.entries(pipelineState).map(([stage, state]) => (
                     <div key={stage} className={`stage-row ${state.status === 'running' ? 'scanning' : ''}`}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: state.status === 'complete' ? 'var(--success)' : state.status === 'running' ? 'var(--accent-primary)' : 'var(--border-dim)' }}></div>
                        <div style={{ flex: 1 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', fontWeight: '700' }}>
                              <span>{stage.toUpperCase()}</span>
                              <span>{state.progress}%</span>
                           </div>
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
                    {sources.map(source => (
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
              <div style={{ padding: '40px', borderBottom: '1px solid var(--border-dim)' }}>
                 <div className="intel-meta">
                    <span className="badge badge-health">{selectedArticle.category}</span>
                    <span style={{ fontWeight: '700' }}>By {settings.authorName}</span>
                    <span>•</span>
                    <span>{selectedArticle.date}</span>
                 </div>
                 <h2 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.2', marginTop: '16px' }}>{selectedArticle.title}</h2>
              </div>
              <div style={{ padding: '40px', fontSize: '18px', lineHeight: '1.8', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: selectedArticle.fullText }} />
              <div style={{ padding: '32px 40px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
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
