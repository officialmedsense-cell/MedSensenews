"use client";

import React, { useEffect, useState } from "react";
import { DEFAULT_AUTO_PUBLISH_CONFIG, type AutoPublishConfig } from "../automation-config";
import {
  getAutoPublishConfigFromCloud,
  getStaffAccounts,
  saveAutoPublishConfigToCloud
} from "../actions";

interface User {
  email: string;
  role: "admin" | "staff";
}

interface StaffAccount {
  id: string;
  name?: string;
  email: string;
  password: string;
}

const TIMEZONES = [
  { value: "Africa/Lagos", label: "Africa/Lagos" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "UTC", label: "UTC" }
];

const formatDateTime = (value: string | null, timeZone?: string) => {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleString("en-US", {
      timeZone: timeZone || "Africa/Lagos",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
};

const getZonedPreview = (date: Date, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

export default function AutoPublishAutomationPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"controls" | "summary" | "cron">("controls");

  const [config, setConfig] = useState<AutoPublishConfig>(DEFAULT_AUTO_PUBLISH_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedUser = localStorage.getItem("medsense_user");
    const savedTheme = localStorage.getItem("medsense_theme") as "dark" | "light";
    const savedConfig = localStorage.getItem("medsense_auto_publish_config");

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        setCurrentUser(null);
      }
    }

    if (savedConfig) {
      try {
        setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
      } catch {
        // Ignore malformed local cache.
      }
    }

    const loadStaff = async () => {
      const res = await getStaffAccounts();
      if (res.success && res.staff) {
        setStaffAccounts(res.staff);
      }
    };

    const loadConfig = async () => {
      const res = await getAutoPublishConfigFromCloud();
      if (res.success && res.config) {
        const merged = { ...DEFAULT_AUTO_PUBLISH_CONFIG, ...res.config };
        setConfig(merged);
        localStorage.setItem("medsense_auto_publish_config", JSON.stringify(merged));
      }
      setLoadingConfig(false);
    };

    loadStaff();
    loadConfig();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("medsense_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("medsense_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("medsense_user");
    }
  }, [currentUser]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");

    if (loginEmail === "officialmedsense@gmail.com" && loginPassword === "Damilare242") {
      setCurrentUser({ email: loginEmail, role: "admin" });
      return;
    }

    const staff = staffAccounts.find(item => {
      const emailMatch = item.email?.trim().toLowerCase() === loginEmail.trim().toLowerCase();
      const passwordMatch = item.password?.trim() === loginPassword.trim();
      return emailMatch && passwordMatch;
    });

    if (staff) {
      setCurrentUser({ email: staff.email, role: "staff" });
      return;
    }

    setLoginError("Unauthorized access. Invalid credentials.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail("");
    setLoginPassword("");
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice("");

    const nextConfig: AutoPublishConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };

    const res = await saveAutoPublishConfigToCloud(nextConfig);
    if (res.success) {
      localStorage.setItem("medsense_auto_publish_config", JSON.stringify(nextConfig));
      setConfig(nextConfig);
      setNotice("Automation schedule saved. The cron job will honor the next matching run time.");
    } else {
      setNotice(res.error || "Unable to save automation schedule.");
    }

    setSaving(false);
  };

  const nextRunPreview = `${config.scheduledTime} ${config.timezone}`;
  const currentPreview = getZonedPreview(new Date(), config.timezone);

  if (!authChecked) return null;

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", color: "var(--text-primary)", padding: "24px" }}>
        <div className="glass-card" style={{ width: "100%", maxWidth: "460px", padding: "40px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Auto Publish Control</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Sign in to manage the scheduled auto publish job.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {loginError && (
              <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "hsla(0, 100%, 50%, 0.1)", color: "var(--danger)", border: "1px solid hsla(0, 100%, 50%, 0.2)", fontSize: "13px" }}>
                {loginError}
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "var(--text-muted)" }}>EMAIL</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "var(--text-muted)" }}>PASSWORD</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Authorize Access</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="medsense-app" style={{ minHeight: "100vh" }}>
      <div className="mobile-header">
        <img src="/logo.png" alt="MedSense" style={{ height: "24px", filter: "drop-shadow(0 0 8px var(--accent-glow))" }} />
        <button className="btn btn-ghost" onClick={() => setSidebarOpen(true)} style={{ padding: "8px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/logo.png" alt="MedSense Logo" style={{ height: "32px", filter: "drop-shadow(0 0 8px var(--accent-glow))" }} />
          </div>
          <button className="btn btn-ghost" onClick={() => setSidebarOpen(false)} style={{ padding: "4px", minWidth: "auto", display: "none" }} id="close-sidebar-btn">
             &times;
          </button>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "controls", label: "Scheduler Controls", icon: "M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
            { id: "summary", label: "Run Summary", icon: "M4 6h16M4 12h16M4 18h10" },
            { id: "cron", label: "What the Cron Uses", icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" }
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePanel === item.id ? "active" : ""}`}
              onClick={() => {
                setActivePanel(item.id as "controls" | "summary" | "cron");
                setSidebarOpen(false);
              }}
              style={{ width: "100%", background: "transparent", border: "none", textAlign: "left" }}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: "auto", padding: "20px 12px", borderTop: "1px solid var(--border-dim)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
            <div style={{ minWidth: "32px", height: "32px", borderRadius: "50%", background: "var(--accent-glow)", border: "1px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800" }}>
              {currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.email}</div>
              <div style={{ fontSize: "10px", color: "var(--accent-primary)", fontWeight: "800", textTransform: "uppercase" }}>{currentUser.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: "6px", color: "var(--danger)" }} title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </aside>

      <main className="main-viewport" style={{ paddingTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span className="badge badge-tech">AUTOMATION CENTER</span>
            </div>
            <h1 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "6px" }}>Auto Publish Scheduler</h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "760px" }}>Control when the scheduled AI discovery job wakes up, what model it uses, and whether auto publish is currently active.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="btn btn-ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ padding: "10px 14px" }}>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        <section className="glass-card" style={{ padding: "28px" }}>
          {activePanel === "controls" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>Scheduler Controls</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>The cron route checks every minute, then runs only when the configured time matches.</p>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: "999px", border: "1px solid var(--border-dim)", background: config.enabled ? "hsla(145, 70%, 45%, 0.12)" : "hsla(0, 100%, 50%, 0.08)", color: config.enabled ? "var(--success)" : "var(--danger)", fontWeight: 800, fontSize: "12px" }}>
                  {config.enabled ? "Enabled" : "Disabled"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--bg-elevated)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)" }}>
                  <input type="checkbox" checked={config.enabled} onChange={e => setConfig(prev => ({ ...prev, enabled: e.target.checked }))} style={{ width: "18px", height: "18px", accentColor: "var(--accent-primary)" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800 }}>Auto Publish</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Turn the scheduled AI job on or off.</div>
                  </div>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Publish Time</span>
                  <input type="time" value={config.scheduledTime} onChange={e => setConfig(prev => ({ ...prev, scheduledTime: e.target.value }))} style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }} />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Time Zone</span>
                  <select value={config.timezone} onChange={e => setConfig(prev => ({ ...prev, timezone: e.target.value }))} style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}>
                    {TIMEZONES.map(zone => (
                      <option key={zone.value} value={zone.value}>{zone.label}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Freshness Window</span>
                  <select value={config.freshnessWindow} onChange={e => setConfig(prev => ({ ...prev, freshnessWindow: Number(e.target.value) }))} style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}>
                    <option value={12}>Last 12 Hours</option>
                    <option value={24}>Last 24 Hours</option>
                    <option value={48}>Last 48 Hours</option>
                    <option value={72}>Last 3 Days</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>AI Model</span>
                  <select value={config.aiModel} onChange={e => setConfig(prev => ({ ...prev, aiModel: e.target.value }))} style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}>
                    <option value="mistral-small-latest">Mistral Small</option>
                    <option value="mistral-large-latest">Mistral Large</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Editorial Tone</span>
                  <input type="text" value={config.tone} onChange={e => setConfig(prev => ({ ...prev, tone: e.target.value }))} style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }} />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Byline</span>
                  <input type="text" value={config.authorName} onChange={e => setConfig(prev => ({ ...prev, authorName: e.target.value }))} style={{ width: "100%", padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "12px 18px" }}>
                  {saving ? "Saving..." : "Save Schedule"}
                </button>
              </div>

              {notice && (
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-dim)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "13px" }}>
                  {notice}
                </div>
              )}

              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Use the sidebar to switch into the summary and cron reference rooms.</div>
            </div>
          )}

          {activePanel === "summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>Run Summary</h2>
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border-dim)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>NEXT SCHEDULED SLOT</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{nextRunPreview}</div>
                </div>
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border-dim)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>CURRENT TIME IN ZONE</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{currentPreview}</div>
                </div>
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border-dim)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>LAST RUN</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{formatDateTime(config.lastRunAt, config.timezone)}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>{config.lastResult || "No run recorded yet."}</div>
                </div>
              </div>
            </div>
          )}

          {activePanel === "cron" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>What the Cron Uses</h2>
              <div className="glass-card" style={{ padding: "24px" }}>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.7 }}>
                  <li>Linked intelligence sources from the shared automation configuration.</li>
                  <li>The time, timezone, and enable switch saved on this page.</li>
                  <li>The selected Mistral model, editorial tone, and freshness window.</li>
                </ul>
                {loadingConfig && (
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--accent-primary)" }}>Syncing saved schedule...</div>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>This room is for reference only, so the controls and summary rooms can stay uncluttered.</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
