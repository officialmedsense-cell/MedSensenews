'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import ArticleModal from './ArticleModal';
import StaffModal from './StaffModal';
import styles from './editor.module.css';

const CATEGORIES = ['Health', 'Medicine', 'Research', 'Public Health', 'Technology'];

export default function EditorDashboard() {
  // ── Auth ─────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Dashboard state ───────────────────────────────────
  const [view, setView] = useState('articles'); // 'articles' | 'staff' | 'comments'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [articles, setArticles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  // ── Filters ───────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expandedComments, setExpandedComments] = useState({});

  // ── Modals ────────────────────────────────────────────
  const [articleModal, setArticleModal] = useState({ open: false, article: null }); // null = new
  const [staffModal, setStaffModal] = useState({ open: false, member: null });
  const [toast, setToast] = useState(null);

  // ── Bootstrap: listen for auth changes ───────────────
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) setSession(session);
        setIsCheckingAuth(false);
      })
      .catch(err => {
        console.warn('[Auth] Session retrieval failed:', err);
        setIsCheckingAuth(false);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('Auth Event:', event, s ? 'Session Exists' : 'No Session');
      
      // Removed the forced setSession(null) on SIGNED_OUT because it might be 
      // falsely triggering on network errors. We will only log out manually.
      if (s) {
        setSession(s);
      }
      setIsCheckingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch data once logged in ─────────────────────────
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, status, author, date, created_at, image, excerpt')
        .order('date', { ascending: false });
        
      if (error) {
        setDataError('Failed to load articles: ' + error.message);
      }
      setArticles(data || []);
    } catch (err) {
      setDataError('Network exception: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Fetch staff error:', error);
        return;
      }
      setStaff(data || []);
    } catch (err) {
      console.error('Staff fetch exception:', err);
    }
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Fetch comments error:', error);
        // We don't block the whole dashboard if comments fail, 
        // but we show the error in console
      }
      setComments(data || []);
    } catch (err) {
      console.error('Comment fetch exception:', err);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setDataError(null);
      
      // Run sequentially to prevent Supabase 'Lock broken' abort errors
      try {
        await fetchStaff();
        if (isMounted) await fetchArticles();
        if (isMounted) await fetchComments();
      } catch (err) {
        if (isMounted) setDataError('Data sync error: ' + err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    
    return () => { isMounted = false; };
  }, [session?.user?.id, fetchArticles, fetchStaff, fetchComments]);

  // ── Toast helper ──────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Auth handlers ─────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    if (error) setLoginError(error.message);
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    if (!confirm('End your editorial session?')) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  // ── Article actions ───────────────────────────────────
  const handleEditClick = async (article) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('content')
      .eq('id', article.id)
      .single();
    setLoading(false);
    
    if (error) {
      showToast('Failed to load article content: ' + error.message, 'error');
      return;
    }
    
    setArticleModal({ open: true, article: { ...article, content: data.content } });
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Permanently delete this article?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
    showToast('Article deleted.');
    fetchArticles();
  };

  const handleToggleStatus = async (article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('articles')
      .update({ status: newStatus })
      .eq('id', article.id);
    if (error) { showToast('Update failed.', 'error'); return; }
    showToast(`Article ${newStatus === 'published' ? 'published' : 'set to draft'}.`);
    fetchArticles();
  };

  // ── Comment actions ───────────────────────────────────
  const handleDeleteComment = async (id) => {
    if (!confirm('Delete this comment/reply?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
    showToast('Comment removed.');
    fetchComments();
  };

  // ── Staff actions ─────────────────────────────────────
  const handleDeleteStaff = async (member) => {
    if (member.email === 'officialmedsense@gmail.com') return alert('The Global Director account cannot be deleted.');
    if (member.email === session.user.email) return alert('You cannot delete your own account. Ask another administrator.');
    
    if (!confirm(`Permanently delete staff member ${member.name}? They will no longer be able to log in.`)) return;
    
    // We need an API route for this because auth deletion requires service role
    try {
      const response = await fetch('/api/mseditor242/delete-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staffId: member.id,
          requestingUserToken: session.access_token 
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Delete failed');
      
      showToast('Staff member removed.');
      fetchStaff();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/article/${id}`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copied!'));
  };

  // ── Filtered items ─────────────────────────────────
  const filteredArticles = articles.filter(a => {
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.author || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const filteredComments = comments.filter(c => {
    const matchSearch = !search ||
      c.author.toLowerCase().includes(search.toLowerCase()) ||
      c.text.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    staff: staff.length,
    comments: comments.length,
  };

  // ================================================================
  //  RENDER: LOGIN
  // ================================================================
  if (isCheckingAuth) {
    return (
      <div className={styles.loginPage}>
        <div style={{ color: 'white', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <i className="fas fa-spinner fa-spin fa-2x" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <img src="/logo.png" alt="MedSense News" className={styles.loginLogo} />
            <h2>Editorial Staff Portal</h2>
            <p>Sign in with your staff credentials to access the dashboard</p>
          </div>

          {loginError && (
            <div className={styles.errorBanner}>
              <i className="fas fa-exclamation-circle" /> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="staff@medsensenews.com"
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loginLoading}>
              {loginLoading ? <><i className="fas fa-spinner fa-spin" /> Signing in…</> : 'Sign In'}
            </button>
            <a href="/" className={styles.backLink}>← Return to Main Site</a>
          </form>
        </div>
      </div>
    );
  }

  // ================================================================
  //  RENDER: DASHBOARD
  // ================================================================
  const userStaffRecord = staff.find(s => s.email === session.user.email);
  const isOwner = session.user.email === 'officialmedsense@gmail.com';
  const displayRole = isOwner 
    ? 'Owner' 
    : (userStaffRecord?.role === 'superadmin' ? 'Super Admin' : userStaffRecord?.role || 'Staff');
  const canManageStaff = isOwner || ['admin', 'superadmin'].includes(userStaffRecord?.role);

  return (
    <div className={styles.dashboardWrap}>

      {/* ── Toast ── */}
      {toast && (
        <div className={`${styles.toast} ${styles['toast_' + toast.type]}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          {toast.message}
        </div>
      )}

      {/* ── Mobile Header ── */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileLogo}>
          <img src="/logo.png" alt="MedSense News" />
          <span>Control Center</span>
        </div>
        <button 
          className={styles.menuToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>
      </header>

      {/* ── Sidebar Overlay ── */}
      {mobileMenuOpen && <div className={styles.sidebarOverlay} onClick={() => setMobileMenuOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarLogo}>
          <img src="/logo.png" alt="MedSense News" />
          <span>Control Center</span>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${view === 'articles' ? styles.navItemActive : ''}`}
            onClick={() => { setView('articles'); setSearch(''); setMobileMenuOpen(false); }}
          >
            <i className="fas fa-newspaper" /> Articles
          </button>
          <button
            className={`${styles.navItem} ${view === 'comments' ? styles.navItemActive : ''}`}
            onClick={() => { setView('comments'); setSearch(''); setMobileMenuOpen(false); }}
          >
            <i className="fas fa-comments" /> Comments
          </button>
          {canManageStaff && (
            <button
              className={`${styles.navItem} ${view === 'staff' ? styles.navItemActive : ''}`}
              onClick={() => { setView('staff'); setSearch(''); setMobileMenuOpen(false); }}
            >
              <i className="fas fa-users-cog" /> Staff
            </button>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            className={styles.userBadgeBtn}
            onClick={() => {
              const myRecord = staff.find(s => s.email === session.user.email);
              if (myRecord) setStaffModal({ open: true, member: myRecord });
              else showToast('Profile record not found.', 'error');
            }}
            title="Edit My Profile / Change Password"
          >
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>
                {(session.user.email || 'S').charAt(0).toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userEmail}>{session.user.email}</span>
                <span className={styles.userRole} style={{ textTransform: 'capitalize' }}>{displayRole}</span>
              </div>
            </div>
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={styles.mainContent}>

        {/* ── Stats ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.published}<span>/{stats.total}</span></div>
            <div className={styles.statLabel}>Published / Total</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.comments}</div>
            <div className={styles.statLabel}>User Comments</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.staff}</div>
            <div className={styles.statLabel}>Staff Members</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statOnline}`}>Live</div>
            <div className={styles.statLabel}>System Status</div>
          </div>
        </div>

        {/* ── Articles View ── */}
        {view === 'articles' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Article Management</h2>
                <p className={styles.panelSub}>{filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found</p>
              </div>
              <button
                className={styles.btnPrimary}
                onClick={() => setArticleModal({ open: true, article: null })}
              >
                <i className="fas fa-plus" /> New Article
              </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.searchWrap}>
                <i className="fas fa-search" />
                <input
                  type="text"
                  placeholder="Search by headline or author…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className={styles.selectBox}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <div className={styles.loadingState}><i className="fas fa-spinner fa-spin" /> Loading articles…</div>
            ) : dataError ? (
              <div className={styles.emptyState} style={{ color: '#dc2626' }}>
                <i className="fas fa-exclamation-triangle" />
                <p>{dataError}</p>
                <button className={styles.btnOutline} onClick={fetchArticles} style={{ marginTop: '1rem' }}>Retry</button>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className={styles.emptyState}><i className="fas fa-search" /><p>No articles match your criteria.</p></div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Headline</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Author</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.map(article => (
                      <tr key={article.id}>
                        <td className={styles.tdTitle}>{article.title.length > 65 ? article.title.slice(0, 65) + '…' : article.title}</td>
                        <td><span className={styles.catTag}>{article.category}</span></td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${article.status === 'published' ? styles.statusPublished : styles.statusDraft}`}
                          >
                            {(article.status || 'published').toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.tdMuted}>{article.author}</td>
                        <td className={styles.tdMuted}>
                          {article.created_at ? new Date(article.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                          : article.date ? new Date(article.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button title="Copy live link" className={styles.actionBtn} onClick={() => copyLink(article.id)}>
                              <i className="fas fa-link" />
                            </button>
                            <button title="Edit article" className={`${styles.actionBtn} ${styles.actionEdit}`}
                              onClick={() => handleEditClick(article)}>
                              <i className="fas fa-edit" />
                            </button>
                            <button
                              title={article.status === 'published' ? 'Set to draft' : 'Publish'}
                              className={`${styles.actionBtn} ${article.status === 'published' ? styles.actionDraft : styles.actionPublish}`}
                              onClick={() => handleToggleStatus(article)}
                            >
                              <i className={`fas ${article.status === 'published' ? 'fa-eye-slash' : 'fa-eye'}`} />
                            </button>
                            <button title="Delete" className={`${styles.actionBtn} ${styles.actionDelete}`}
                              onClick={() => handleDeleteArticle(article.id)}>
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Comments View ── */}
        {view === 'comments' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Comment Moderation</h2>
                <p className={styles.panelSub}>{comments.length} active discussion record{comments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className={styles.filters}>
              <div className={styles.searchWrap}>
                <i className="fas fa-search" />
                <input
                  type="text"
                  placeholder="Search comments by author or content…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Content</th>
                    <th>Article Reference</th>
                    <th>Engagement</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No comments found.</td></tr>
                  ) : comments.filter(c => !c.parent_id).map(parent => {
                    const children = comments.filter(r => r.parent_id === parent.id);
                    const isExpanded = expandedComments[parent.id];
                    
                    return (
                      <Fragment key={parent.id}>
                        <tr style={{ borderLeft: '3px solid var(--primary)' }}>
                          <td className={styles.tdTitle}>{parent.author}</td>
                          <td style={{ maxWidth: '350px' }} className={styles.tdMuted}>{parent.text}</td>
                          <td className={styles.tdMuted}>
                            {articles.find(a => a.id == parent.article_id)?.title?.slice(0, 30) || 'Unknown Article'}...
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                <i className="far fa-thumbs-up"></i> {parent.likes || 0} Likes
                              </span>
                              {children.length > 0 && (
                                <button 
                                  onClick={() => setExpandedComments(p => ({...p, [parent.id]: !isExpanded}))}
                                  className={styles.btnOutline}
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                >
                                  {isExpanded ? 'Hide' : `Show ${children.length}`} Replies
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button title="Delete" className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleDeleteComment(parent.id)}>
                                <i className="fas fa-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && children.map(child => (
                          <tr key={child.id} style={{ background: '#f9fafb' }}>
                            <td className={styles.tdTitle} style={{ paddingLeft: '2rem' }}>
                              <i className="fas fa-reply fa-rotate-180" style={{ marginRight: '0.5rem', color: '#d1d5db' }} />
                              {child.author}
                            </td>
                            <td style={{ maxWidth: '350px' }} className={styles.tdMuted}>{child.text}</td>
                            <td className={styles.tdMuted}>—</td>
                            <td className={styles.tdMuted}>
                              <div style={{ fontSize: '0.75rem' }}>
                                <i className="far fa-thumbs-up"></i> {child.likes || 0} Likes
                              </div>
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button title="Delete" className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleDeleteComment(child.id)}>
                                  <i className="fas fa-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Staff View ── */}
        {view === 'staff' && canManageStaff && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Staff Registry</h2>
                <p className={styles.panelSub}>All authenticated editorial staff accounts</p>
              </div>
              <button
                className={styles.btnPrimary}
                onClick={() => setStaffModal({ open: true, member: null })}
              >
                <i className="fas fa-user-plus" /> Add Staff
              </button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No staff records found.</td></tr>
                  ) : staff.map(member => (
                    <tr key={member.id}>
                      <td className={styles.tdTitle}>{member.name || '—'}</td>
                      <td className={styles.tdMuted}>{member.email}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          member.role === 'superadmin' ? styles.roleSuperAdmin :
                          member.role === 'admin' ? styles.roleAdmin : styles.roleEditor
                        }`}>
                          {(member.role || 'editor').toUpperCase()}
                        </span>
                      </td>
                      <td className={styles.tdMuted}>
                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {member.email !== 'officialmedsense@gmail.com' && (
                            <button
                              title="Edit staff"
                              className={`${styles.actionBtn} ${styles.actionEdit}`}
                              onClick={() => setStaffModal({ open: true, member })}
                            >
                              <i className="fas fa-user-edit" />
                            </button>
                          )}
                          {member.email !== 'officialmedsense@gmail.com' && member.email !== session.user.email && (
                            <button
                              title="Delete staff"
                              className={`${styles.actionBtn} ${styles.actionDelete}`}
                              onClick={() => handleDeleteStaff(member)}
                            >
                              <i className="fas fa-user-slash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ── Modals ── */}
      {articleModal.open && (
        <ArticleModal
          article={articleModal.article}
          session={session}
          userName={userStaffRecord?.name}
          onClose={() => setArticleModal({ open: false, article: null })}
          onSaved={() => { fetchArticles(); showToast('Article saved successfully!'); }}
          onError={(msg) => showToast(msg, 'error')}
          categories={CATEGORIES}
        />
      )}

      {staffModal.open && (
        <StaffModal
          member={staffModal.member}
          session={session}
          onClose={() => setStaffModal({ open: false, member: null })}
          onSaved={() => { fetchStaff(); showToast('Staff record updated.'); }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
    </div>
  );
}
