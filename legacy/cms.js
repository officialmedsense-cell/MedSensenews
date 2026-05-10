let currentAdminView = 'articles';
let articleSearchQuery = '';
let articleCategoryFilter = 'All';
let quill;

const router = {
    currentRoute: 'login',
    
    navigate(route, params = {}) {
        this.currentRoute = route;
        window.scrollTo(0, 0);
        
        if (route === 'login') {
            renderLogin();
        } else if (route === 'admin') {
            if (!store.isLoggedIn) return this.navigate('login');
            renderAdmin(params.view || currentAdminView);
        }
    }
};

function switchAdminView(view) {
    currentAdminView = view;
    renderAdmin();
}

function handleLogin(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    
    const user = store.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        store.isLoggedIn = true;
        store.currentUser = user;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        showToast(`Welcome back, ${user.name}!`);
        router.navigate('admin');
    } else {
        showToast('Invalid credentials. Please try again.', 'error');
    }
}

function handleLogout() {
    store.isLoggedIn = false;
    store.currentUser = null;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully');
    router.navigate('login');
}

function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="login-page">
            <div class="login-card">
                <div class="login-header">
                    <img src="logo.png" alt="MedSense News" class="login-logo">
                    <h2>Staff Portal</h2>
                    <p>Enter your credentials to access the editorial dashboard</p>
                </div>
                <form onsubmit="handleLogin(event)" class="login-form">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary login-btn">Sign In</button>
                    <div style="margin-top: 1rem; text-align: center;">
                        <a href="index.html" style="color: var(--text-light); text-decoration: none; font-size: 0.875rem;">← Return to Main Site</a>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderAdmin() {
    const userRole = store.currentUser.role;
    const isSuperAdmin = userRole === 'superadmin';
    
    document.getElementById('app').innerHTML = `
        <div class="admin-container">
            <header class="admin-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <h2 style="font-weight: 800; color: var(--primary);">${store.currentUser.name}</h2>
                        <span style="background: var(--primary); color: white; padding: 0.15rem 0.5rem; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">${userRole}</span>
                    </div>
                    <p style="color: var(--text-light); font-size: 0.8125rem;">MedSens Editorial Control Center • ${new Date().toLocaleDateString()}</p>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.8125rem;" onclick="saveStore(); showToast('State Synchronized')"><i class="fas fa-sync"></i> Sync State</button>
                    ${currentAdminView === 'articles' ? '<button class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.8125rem;" onclick="showAddArticleModal()"><i class="fas fa-plus"></i> New Article</button>' : ''}
                </div>
            </header>
            
            <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2.5rem;">
                <div class="stat-card">
                    <div class="stat-value" style="display: flex; align-items: baseline; gap: 0.5rem;">
                        ${store.articles.filter(a => a.status === 'published').length}
                        <span style="font-size: 0.875rem; color: var(--text-light); font-weight: 400;">/ ${store.articles.length}</span>
                    </div>
                    <div class="stat-label">Published / Total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${store.articles.reduce((acc, a) => acc + a.views, 0).toLocaleString()}</div>
                    <div class="stat-label">Total Reach</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${store.users.length}</div>
                    <div class="stat-label">Total Staff</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #10b981;">Online</div>
                    <div class="stat-label">System Status</div>
                </div>
            </div>

            <div class="admin-grid" style="display: grid; grid-template-columns: 240px 1fr; gap: 2rem;">
                <aside class="admin-sidebar">
                    <ul class="admin-nav" style="border-right: 1px solid var(--border); padding-right: 1.5rem;">
                        <li style="margin-bottom: 0.5rem;">
                            <a href="#" class="${currentAdminView === 'articles' ? 'active' : ''}" onclick="switchAdminView('articles')">
                                <i class="fas fa-newspaper"></i> Articles
                            </a>
                        </li>
                        ${isSuperAdmin ? `
                            <li style="margin-bottom: 0.5rem;">
                                <a href="#" class="${currentAdminView === 'staff' ? 'active' : ''}" onclick="switchAdminView('staff')">
                                    <i class="fas fa-users-cog"></i> Staff Management
                                </a>
                            </li>
                        ` : ''}
                        <li style="margin-bottom: 0.5rem;"><a href="#" onclick="showToast('Comments moderation coming soon')"><i class="fas fa-comments"></i> Comments</a></li>
                        <li style="margin-bottom: 1.5rem;"><a href="#" onclick="showToast('System settings restricted')"><i class="fas fa-cog"></i> Settings</a></li>
                        <li style="border-top: 1px solid var(--border); padding-top: 1rem;"><a href="#" onclick="confirmLogout()" style="color: #ef4444;"><i class="fas fa-sign-out-alt"></i> Sign Out</a></li>
                    </ul>
                </aside>
                
                <section class="admin-content">
                    ${currentAdminView === 'articles' ? renderArticleManagement() : renderStaffManagement()}
                </section>
            </div>
        </div>
    `;
}

function confirmLogout() {
    if (confirm('Are you sure you want to end your editorial session?')) {
        handleLogout();
    }
}

function renderArticleManagement() {
    let filteredArticles = store.articles;
    
    if (articleSearchQuery) {
        filteredArticles = filteredArticles.filter(a => 
            a.title.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
            a.author.toLowerCase().includes(articleSearchQuery.toLowerCase())
        );
    }
    
    if (articleCategoryFilter !== 'All') {
        filteredArticles = filteredArticles.filter(a => a.category === articleCategoryFilter);
    }

    return `
        <div style="background: white; border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden;">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); background: #fafafa; display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 0.875rem; font-weight: 700; color: var(--text);">Document Inventory</h3>
                    <span style="font-size: 0.75rem; color: var(--text-light);">${filteredArticles.length} matching records</span>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <div style="position: relative; flex: 1;">
                        <i class="fas fa-search" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-light); font-size: 0.8125rem;"></i>
                        <input type="text" placeholder="Search by headline or author..." 
                            value="${articleSearchQuery}"
                            oninput="articleSearchQuery = this.value; renderAdmin();"
                            style="width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.25rem; border: 1px solid var(--border); border-radius: 0.5rem; font-size: 0.8125rem;">
                    </div>
                    <select onchange="articleCategoryFilter = this.value; renderAdmin();" 
                        style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem; font-size: 0.8125rem; background: white; color: var(--text);">
                        <option value="All" ${articleCategoryFilter === 'All' ? 'selected' : ''}>All Categories</option>
                        <option value="Health" ${articleCategoryFilter === 'Health' ? 'selected' : ''}>Health News</option>
                        <option value="Medicine" ${articleCategoryFilter === 'Medicine' ? 'selected' : ''}>Medicine News</option>
                        <option value="Research" ${articleCategoryFilter === 'Research' ? 'selected' : ''}>Research News</option>
                        <option value="Technology" ${articleCategoryFilter === 'Technology' ? 'selected' : ''}>Technology News</option>
                        <option value="Public Health" ${articleCategoryFilter === 'Public Health' ? 'selected' : ''}>Public Health News</option>
                    </select>
                </div>
            </div>
            <table class="articles-table">
                <thead>
                    <tr>
                        <th style="width: 40%;">News Headline</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Author</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredArticles.length === 0 ? `
                        <tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-light);">No articles match your criteria</td></tr>
                    ` : filteredArticles.map(art => `
                        <tr>
                            <td style="font-weight: 600; color: var(--primary);">${art.title.substring(0, 60)}${art.title.length > 60 ? '...' : ''}</td>
                            <td><span class="category-tag" style="font-size: 0.625rem; background: var(--bg-secondary);">${art.category}</span></td>
                            <td><span class="status-badge" style="background: ${art.status === 'published' ? '#dcfce7' : '#fef3c7'}; color: ${art.status === 'published' ? '#166534' : '#92400e'}">${art.status ? art.status.toUpperCase() : 'PUBLISHED'}</span></td>
                            <td style="color: var(--text-light); font-size: 0.8125rem;">${art.author}</td>
                            <td style="text-align: right;">
                                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                                    <button class="action-btn" title="Copy Live Link" style="background: #f3f4f6; color: #4b5563; border: none; padding: 0.4rem; border-radius: 0.4rem; cursor: pointer;" onclick="copyArticleLink(${art.id})"><i class="fas fa-link"></i></button>
                                    <button class="action-btn" title="Edit" style="background: #eff6ff; color: #2563eb; border: none; padding: 0.4rem; border-radius: 0.4rem; cursor: pointer;" onclick="showToast('Editor loading...')"><i class="fas fa-edit"></i></button>
                                    <button class="action-btn" title="Delete" style="background: #fef2f2; color: #dc2626; border: none; padding: 0.4rem; border-radius: 0.4rem; cursor: pointer;" onclick="deleteArticle(${art.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderStaffManagement() {
    return `
        <div style="background: white; border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden;">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); background: #fafafa; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 0.875rem; font-weight: 700; color: var(--text);">Editorial Staff Registry</h3>
                    <p style="font-size: 0.75rem; color: var(--text-light);">Management portal for all authenticated medical staff</p>
                </div>
                <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8125rem;" onclick="showAddStaffModal()"><i class="fas fa-user-plus"></i> Register New Staff</button>
            </div>
            <table class="articles-table">
                <thead>
                    <tr>
                        <th>Full Name</th>
                        <th>Identifier</th>
                        <th>Role / Clearance</th>
                        <th style="text-align: right;">Authorization Controls</th>
                    </tr>
                </thead>
                <tbody>
                    ${store.users.map(user => `
                        <tr>
                            <td style="font-weight: 600; color: var(--primary);">${user.name} ${user.username === store.currentUser.username ? '<span style="font-weight: 400; color: var(--text-light); font-style: italic;">(Active Session)</span>' : ''}</td>
                            <td><code style="background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem;">@${user.username}</code></td>
                            <td>
                                <span class="status-badge" style="
                                    background: ${user.role === 'superadmin' ? '#fef3c7' : user.role === 'admin' ? '#dcfce7' : '#f1f5f9'};
                                    color: ${user.role === 'superadmin' ? '#92400e' : user.role === 'admin' ? '#166534' : '#64748b'};
                                ">${user.role.toUpperCase()}</span>
                            </td>
                            <td style="text-align: right;">
                                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                                    <button class="action-btn" title="Modify Credentials" style="background: #eff6ff; color: #2563eb; border: none; padding: 0.4rem; border-radius: 0.4rem; cursor: pointer;" onclick="showEditStaffModal('${user.username}')"><i class="fas fa-user-edit"></i></button>
                                    ${user.username !== store.currentUser.username ? `
                                        <button class="action-btn" title="Revoke Access" style="background: #fef2f2; color: #dc2626; border: none; padding: 0.4rem; border-radius: 0.4rem; cursor: pointer;" onclick="deleteStaff('${user.username}')"><i class="fas fa-user-times"></i></button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddStaffModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1003; display: flex; align-items: center; justify-content: center; padding: 2rem;';
    modal.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 1rem; width: 100%; max-width: 400px; padding: 2.5rem; position: relative;">
            <button onclick="this.closest('.modal').remove()" style="position: absolute; right: 1.5rem; top: 1.5rem; background: none; border: none; font-size: 1.25rem; color: var(--text-light); cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-light)'">
                <i class="fas fa-times"></i>
            </button>
            <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Register New Staff</h2>
            <p style="color: var(--text-light); font-size: 0.8125rem; margin-bottom: 1.5rem;">Grant administrative access to a new user</p>
            <form onsubmit="handleCreateStaff(event)">
                <div class="form-group">
                    <label style="font-size: 0.75rem;">Full Name</label>
                    <input type="text" name="name" placeholder="e.g. Dr. Jane Foster" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label style="font-size: 0.75rem;">Username</label>
                    <input type="text" name="username" placeholder="Unique identifier" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label style="font-size: 0.75rem;">Initial Password</label>
                    <input type="text" name="password" placeholder="Minimum 8 characters" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label style="font-size: 0.75rem;">Clearance Level</label>
                    <select name="role" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border); background: white;">
                        <option value="editor">Editor (Post Only)</option>
                        <option value="admin">Admin (Full Editing)</option>
                        <option value="superadmin">SuperAdmin (Full Control)</option>
                    </select>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                    <button type="button" class="btn btn-outline" style="font-size: 0.8125rem;" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-size: 0.8125rem;">Grant Access</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleCreateStaff(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username').toLowerCase();
    
    if (store.users.some(u => u.username === username)) {
        showToast('Username already exists', 'error');
        return;
    }

    const newUser = {
        name: formData.get('name'),
        username: username,
        password: formData.get('password'),
        role: formData.get('role')
    };

    store.users.push(newUser);
    saveStore();
    document.querySelector('.modal').remove();
    showToast(`Registered ${newUser.name} successfully`);
    renderAdmin();
}

function showAddArticleModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1003; display: flex; align-items: center; justify-content: center; padding: 1rem;';
    modal.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 1rem; width: 100%; max-width: 900px; max-height: 95vh; overflow-y: auto; padding: 2rem; position: relative;">
            <button onclick="this.closest('.modal').remove()" style="position: absolute; right: 1.5rem; top: 1.5rem; background: none; border: none; font-size: 1.5rem; color: var(--text-light); cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-light)'">
                <i class="fas fa-times"></i>
            </button>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Draft Healthcare Insight</h2>
            <p style="color: var(--text-light); font-size: 0.8125rem; margin-bottom: 1.5rem;">Publish high-quality medical reports to MedSens News readers</p>
            
            <form onsubmit="handleNewArticle(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div class="form-group" style="grid-column: span 2;">
                    <label style="font-size: 0.75rem;">Main Headline</label>
                    <input type="text" name="title" placeholder="Enter article title" style="padding: 0.75rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required>
                </div>
                
                <div class="form-group">
                    <label style="font-size: 0.75rem;">Medical Category</label>
                    <select name="category" style="padding: 0.75rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border); background: white;">
                        <option>Health</option><option>Medicine</option><option>Research</option><option>Public Health</option><option>Technology</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label style="font-size: 0.75rem;">Lead Author</label>
                    <input type="text" name="author" value="${store.currentUser.name}" style="padding: 0.75rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required>
                </div>
                
                <div class="form-group" style="grid-column: span 2;">
                    <label style="font-size: 0.75rem;">Hero Image (Upload File)</label>
                    <input type="file" id="imageUpload" accept="image/*" style="padding: 0.75rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border); background: white;" required>
                </div>
                
                <div class="form-group" style="grid-column: span 2;">
                    <label style="font-size: 0.75rem;">Summary Excerpt</label>
                    <textarea name="excerpt" placeholder="A brief summary for the homepage grid..." style="padding: 0.75rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border); min-height: 80px;" required></textarea>
                </div>
                
                <div class="form-group" style="grid-column: span 2;">
                    <label style="font-size: 0.75rem;">Full Medical Report (Visual Editor)</label>
                    <div id="editor-container" style="height: 300px; border-radius: 0.5rem; border: 1px solid var(--border); background: white;"></div>
                </div>
                
                <div style="grid-column: span 2; display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                    <button type="submit" name="status" value="draft" class="btn btn-outline">Save as Draft</button>
                    <button type="submit" name="status" value="published" class="btn btn-primary">Publish to Global Feed</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    let clickedButtonValue = 'published';
    modal.querySelectorAll('button[type="submit"]').forEach(btn => {
        btn.addEventListener('click', () => { clickedButtonValue = btn.value; });
    });

    const form = modal.querySelector('form');
    form.onsubmit = (e) => handleNewArticle(e, clickedButtonValue);

    quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Write your professional report here...',
        modules: {
            toolbar: [
                [{ 'header': [2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    if (window.innerWidth < 768) {
        const form = modal.querySelector('form');
        form.style.gridTemplateColumns = '1fr';
    }
}

async function handleNewArticle(e, status = 'published') {
    e.preventDefault();
    const formData = new FormData(e.target);
    const articleContent = quill.root.innerHTML;
    const imageFile = document.getElementById('imageUpload').files[0];

    if (quill.getText().trim().length < 10) {
        showToast('Report content is too short', 'error');
        return;
    }

    if (!imageFile && status === 'published') {
        showToast('Please upload a hero image', 'error');
        return;
    }

    try {
        let imageUrl = '';
        
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('article-images')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error("Storage Error:", uploadError);
                showToast('Image upload failed: ' + uploadError.message, 'error');
                return;
            }

            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('article-images')
                .getPublicUrl(filePath);
            
            imageUrl = publicUrl;
        }

        const newArticle = {
            title: formData.get('title'),
            category: formData.get('category'),
            author: formData.get('author'),
            image: imageUrl,
            excerpt: formData.get('excerpt'),
            content: articleContent,
            date: getLocalDateString(),
            created_at: getLocalDateTimeISO(),
            trending: false,
            views: 0,
            status: status
        };

        const { data, error: dbError } = await supabaseClient
            .from('articles')
            .insert([newArticle])
            .select();

        if (dbError) {
            console.error("Database Error:", dbError);
            showToast('Database save failed: ' + dbError.message, 'error');
            return;
        }

        if (data && data[0]) {
            store.articles.unshift(data[0]);
            saveStore();
            document.querySelector('.modal').remove();
            showToast(status === 'published' ? 'Medical report published successfully!' : 'Article saved to drafts');
            renderAdmin();
        }
    } catch (err) {
        console.error("General Error:", err);
        showToast('System error. Check console.', 'error');
    }
}

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function deleteArticle(id) {
    if (confirm('Permanently delete this medical report?')) {
        try {
            const { error } = await supabaseClient
                .from('articles')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
        } catch (e) {
            console.warn("Cloud delete failed, removing local reference only.");
        }
        store.articles = store.articles.filter(a => a.id !== id);
        saveStore();
        showToast('Deleted');
        renderAdmin();
    }
}

function deleteStaff(username) {
    if (username === store.currentUser.username) {
        showToast('You cannot revoke your own access', 'error');
        return;
    }
    if (confirm(`Are you sure you want to permanently revoke access for @${username}?`)) {
        store.users = store.users.filter(u => u.username !== username);
        saveStore();
        showToast(`Access revoked for @${username}`);
        renderAdmin();
    }
}

function showEditStaffModal(username) {
    const user = store.users.find(u => u.username === username);
    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1003; display: flex; align-items: center; justify-content: center; padding: 2rem;';
    modal.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 1rem; width: 100%; max-width: 400px; padding: 2.5rem; position: relative;">
            <button onclick="this.closest('.modal').remove()" style="position: absolute; right: 1.5rem; top: 1.5rem; background: none; border: none; font-size: 1.25rem; color: var(--text-light); cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-light)'">
                <i class="fas fa-times"></i>
            </button>
            <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Modify Credentials</h2>
            <p style="color: var(--text-light); font-size: 0.8125rem; margin-bottom: 1.5rem;">Managing account for <strong>@${username}</strong></p>
            <form onsubmit="handleUpdateStaff(event, '${username}')">
                <div class="form-group">
                    <label style="font-size: 0.75rem;">Full Name</label>
                    <input type="text" name="name" value="${user.name}" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label style="font-size: 0.75rem;">Username</label>
                    <input type="text" name="newUsername" value="${user.username}" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required ${username === 'superadmin' ? 'disabled' : ''}>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label style="font-size: 0.75rem;">Password</label>
                    <input type="text" name="password" value="${user.password}" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border);" required>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label style="font-size: 0.75rem;">Access Role</label>
                    <select name="role" style="padding: 0.625rem; width: 100%; border-radius: 0.5rem; border: 1px solid var(--border); background: white;" ${username === 'superadmin' ? 'disabled' : ''}>
                        <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>SuperAdmin</option>
                    </select>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                    <button type="button" class="btn btn-outline" style="font-size: 0.8125rem;" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-size: 0.8125rem;">Execute Changes</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleUpdateStaff(e, oldUsername) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userIndex = store.users.findIndex(u => u.username === oldUsername);
    const newUsername = (formData.get('newUsername') || oldUsername).toLowerCase();
    
    if (newUsername !== oldUsername && store.users.some(u => u.username === newUsername)) {
        showToast('That username is already taken', 'error');
        return;
    }

    if (userIndex !== -1) {
        store.users[userIndex].name = formData.get('name');
        store.users[userIndex].username = newUsername;
        store.users[userIndex].password = formData.get('password');
        
        if (formData.get('role')) {
            store.users[userIndex].role = formData.get('role');
        }
        
        if (oldUsername === store.currentUser.username) {
            store.currentUser = store.users[userIndex];
            localStorage.setItem('currentUser', JSON.stringify(store.currentUser));
            localStorage.setItem('isLoggedIn', 'true');
        }
        
        saveStore();
        document.querySelector('.modal').remove();
        showToast('Staff credentials updated');
        renderAdmin();
    }
}

function copyArticleLink(id) {
    const mainSiteUrl = window.location.href.replace('editor_medsense.html', 'index.html').split('?')[0];
    const link = `${mainSiteUrl}?article=${id}`;
    navigator.clipboard.writeText(link).then(() => {
        showToast('Live article link copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (store.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    try {
        const { data, error } = await supabaseClient
            .from('articles')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            store.articles = data;
        }
    } catch (e) {
        console.warn("Cloud sync pending config.");
    }

    router.navigate(store.isLoggedIn ? 'admin' : 'login');
});
