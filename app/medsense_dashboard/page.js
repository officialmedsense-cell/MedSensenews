"use client";

import React, { useState, useEffect } from "react";
import { 
  fetchLiveMedicalNews, 
  processArticleWithAI, 
  publishToNewsSite 
} from "./actions";

export default function MedSenseDashboard() {
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([
    { id: "1", name: "Nigeria Health Watch", url: "https://nigeriahealthwatch.com/feed/", status: "online", type: "rss" },
    { id: "2", name: "The Punch (Healthwise)", url: "https://rss.punchng.com/v1/category/healthwise", status: "online", type: "rss" },
    { id: "3", name: "HealthNews NG", url: "https://healthnews.ng/feed/", status: "online", type: "rss" }
  ]);

  const [logs, setLogs] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState("Never");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [settings, setSettings] = useState({
    aiModel: "mistral-small-latest",
    tone: "professional",
    authorName: "Damilare"
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('medsense_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === "officialmedsense@gmail.com" && loginPassword === "Damilare242") {
      const user = { email: loginEmail, role: 'admin' };
      setCurrentUser(user);
      localStorage.setItem('medsense_user', JSON.stringify(user));
    } else {
      setLoginError("Unauthorized access.");
    }
  };

  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 50));
  };

  const showToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const runScraper = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog("Establishing Neural Uplink to Global News Feeds...", "info");
    
    try {
      const sourceUrls = sources.map(s => s.url);
      const res = await fetchLiveMedicalNews(sourceUrls);
      
      if (res.success && res.articles) {
        addLog(`Discovered ${res.articles.length} live medical signals.`, "success");
        
        for (const item of res.articles) {
          addLog(`Analyzing: ${item.title.substring(0, 30)}...`, "info");
          const aiRes = await processArticleWithAI(item, settings.aiModel, settings.tone);
          
          if (aiRes.success) {
            const newArticle = {
              id: Math.random().toString(36).substr(2, 9),
              ...aiRes.transformed,
              source: item.source,
              sourceUrl: item.sourceUrl,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              relevance: 95 + Math.floor(Math.random() * 5)
            };
            setArticles(prev => [newArticle, ...prev]);
          }
        }
      }
    } catch (err) {
      addLog("Scraper engine encountered a fault.", "error");
    } finally {
      setIsRunning(false);
      setLastRun(new Date().toLocaleTimeString());
    }
  };

  const handlePublish = async (article) => {
    const res = await publishToNewsSite({
      headline: article.title,
      category: article.category,
      author: settings.authorName,
      summary: article.summary,
      fullReport: article.content,
      visualKeyword: article.visual_keyword,
      originalImage: article.originalImage
    });

    if (res.success) {
      showToast(res.msg, "success");
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, published: true } : a));
    } else {
      showToast(res.error, "error");
    }
  };

  if (!currentUser) {
    return (
      <div className="dashboard-login-wrap">
        <style>{`
          .dashboard-login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #050508; color: white; font-family: sans-serif; }
          .login-card { background: #0f111a; padding: 40px; border-radius: 16px; border: 1px solid #1e2235; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .login-card input { width: 100%; padding: 12px; margin-bottom: 16px; background: #1a1d2d; border: 1px solid #2d324a; border-radius: 8px; color: white; }
          .login-card button { width: 100%; padding: 12px; background: #0070f3; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; }
        `}</style>
        <div className="login-card">
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>MedSense Intel Access</h2>
          {loginError && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>{loginError}</p>}
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Admin Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            <button type="submit">Authorize Access</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container { min-height: 100vh; background: #050508; color: #e1e1e6; font-family: 'Plus Jakarta Sans', sans-serif; display: grid; grid-template-columns: 280px 1fr; }
        .sidebar { background: #0a0c14; border-right: 1px solid #1e2235; padding: 32px 20px; }
        .main-content { padding: 40px; max-width: 1200px; margin: 0 auto; width: 100%; }
        .glass-card { background: rgba(15, 17, 26, 0.7); backdrop-filter: blur(20px); border: 1px solid #1e2235; border-radius: 20px; padding: 24px; margin-bottom: 24px; }
        .btn-primary { background: #0070f3; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .intel-card { background: #0f111a; border: 1px solid #1e2235; border-radius: 12px; padding: 20px; margin-bottom: 16px; transition: 0.3s; cursor: pointer; }
        .intel-card:hover { border-color: #0070f3; transform: translateY(-2px); }
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-right: 8px; }
        .badge-medicine { background: rgba(0, 112, 243, 0.1); color: #0070f3; }
        .log-item { font-family: monospace; font-size: 11px; color: #888; margin-bottom: 8px; border-bottom: 1px solid #1e2235; padding-bottom: 4px; }
        @media (max-width: 1024px) { .dashboard-container { grid-template-columns: 1fr; } .sidebar { display: none; } }
      `}</style>
      
      <aside className="sidebar">
        <img src="/logo.png" alt="Logo" style={{ height: '32px', marginBottom: '40px' }} />
        <nav>
          <div style={{ padding: '12px', background: 'rgba(0,112,243,0.1)', color: '#0070f3', borderRadius: '8px', fontWeight: 'bold', marginBottom: '8px' }}>Command Center</div>
          <div style={{ padding: '12px', color: '#888' }}>Intelligence Hubs</div>
          <div style={{ padding: '12px', color: '#888' }}>System Config</div>
        </nav>
        <div style={{ marginTop: 'auto', padding: '20px 0', borderTop: '1px solid #1e2235' }}>
          <p style={{ fontSize: '12px', color: '#888' }}>Logged in as:</p>
          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{currentUser.email}</p>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Intelligence Command</h1>
            <p style={{ color: '#888' }}>Autonomous News Discovery System</p>
          </div>
          <button className="btn-primary" onClick={runScraper} disabled={isRunning}>
            {isRunning ? "Scraping..." : "Run Discovery"}
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Active Signals</h2>
            {articles.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ color: '#888' }}>No active signals detected. Click "Run Discovery" to scan global feeds.</p>
              </div>
            ) : (
              articles.map(article => (
                <div key={article.id} className="intel-card" onClick={() => setSelectedArticle(article)}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <span className="badge badge-medicine">{article.category}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>{article.time} • {article.source}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{article.title}</h3>
                  <p style={{ fontSize: '14px', color: '#888', marginBottom: '16px' }}>{article.summary}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      onClick={(e) => { e.stopPropagation(); handlePublish(article); }}
                      disabled={article.published}
                    >
                      {article.published ? "✅ Live on Site" : "🚀 Publish to Web"}
                    </button>
                    <span style={{ fontSize: '11px', color: '#0070f3', fontWeight: 'bold' }}>{article.relevance}% RELEVANCE</span>
                  </div>
                </div>
              ))
            )}
          </section>

          <aside>
            <div className="glass-card">
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>System Telemetry</h3>
              <div style={{ height: '300px', overflowY: 'auto' }}>
                {logs.length === 0 && <p style={{ fontSize: '11px', color: '#555' }}>Awaiting signals...</p>}
                {logs.map((log, i) => (
                  <div key={i} className="log-item">
                    <span style={{ color: '#0070f3' }}>[{log.time}]</span> {log.msg}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card">
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Intelligence Hubs</h3>
              {sources.map(s => (
                <div key={s.id} style={{ fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff00' }}></div>
                  {s.name}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      {selectedArticle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedArticle(null)}>
          <div style={{ background: '#0f111a', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>{selectedArticle.title}</h2>
            <div style={{ lineHeight: '1.8', color: '#ccc' }} dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
            <button className="btn-primary" style={{ marginTop: '30px' }} onClick={() => setSelectedArticle(null)}>Close Preview</button>
          </div>
        </div>
      )}
    </div>
  );
}
