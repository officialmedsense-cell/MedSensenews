const router = {
    currentRoute: 'home',
    
    navigate(route, params = {}) {
        this.currentRoute = route;
        window.scrollTo(0, 0);
        
        const basePath = window.location.pathname;

        if (route === 'home') {
            window.history.pushState({route: 'home'}, '', basePath);
        } else if (route === 'article') {
            window.history.pushState({route: 'article', id: params.id}, '', `${basePath}?article=${params.id}`);
        } else if (route === 'category') {
            window.history.pushState({route: 'category', category: params.category}, '', `${basePath}?category=${encodeURIComponent(params.category)}`);
        } else if (route === 'about') {
            window.history.pushState({route: 'about'}, '', `${basePath}?page=about`);
        } else if (route === 'privacy') {
            window.history.pushState({route: 'privacy'}, '', `${basePath}?page=privacy`);
        } else if (route === 'terms') {
            window.history.pushState({route: 'terms'}, '', `${basePath}?page=terms`);
        } else if (route === 'careers') {
            window.history.pushState({route: 'careers'}, '', `${basePath}?page=careers`);
        } else if (route === 'contact') {
            window.history.pushState({route: 'contact'}, '', `${basePath}?page=contact`);
        }
        renderRoute(route, params);
        updateNavbar();
    }
};

function buildRouteHref(route, params = {}) {
    const basePath = window.location.pathname;

    if (route === 'home') {
        return basePath;
    }
    if (route === 'article') {
        return `${basePath}?article=${params.id}`;
    }
    if (route === 'category') {
        return `${basePath}?category=${encodeURIComponent(params.category)}`;
    }
    if (route === 'about' || route === 'privacy' || route === 'terms' || route === 'careers' || route === 'contact') {
        return `${basePath}?page=${route}`;
    }

    return basePath;
}

function getRouteFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    const category = urlParams.get('category');
    const page = urlParams.get('page');

    if (articleId) {
        return { route: 'article', params: { id: parseInt(articleId, 10) } };
    }
    if (category) {
        return { route: 'category', params: { category } };
    }
    if (page === 'about' || page === 'privacy' || page === 'terms' || page === 'careers' || page === 'contact') {
        return { route: page, params: {} };
    }

    return { route: 'home', params: {} };
}

function renderRoute(route, params = {}) {
    if (route === 'article') {
        return renderArticle(params.id);
    }
    if (route === 'category') {
        return renderCategory(params.category);
    }
    if (route === 'about') {
        return renderAbout();
    }
    if (route === 'privacy') {
        return renderPrivacy();
    }
    if (route === 'terms') {
        return renderTerms();
    }
    if (route === 'careers') {
        return renderCareers();
    }
    if (route === 'contact') {
        return renderContact();
    }

    return renderHome();
}

function renderCurrentURLRoute() {
    const { route, params } = getRouteFromURL();
    renderRoute(route, params);
}

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.route) {
        renderRoute(e.state.route, e.state);
    } else {
        renderCurrentURLRoute();
    }
});

function applyBranding(imageUrl, altText = "MedSense Article") {
    return `
        <div class="image-branding-wrapper">
            <img src="${imageUrl}" alt="${altText}" loading="lazy" oncontextmenu="return false;" draggable="false">
            <div class="download-protection-overlay"></div>
        </div>
    `;
}

function toggleSearch() {
    document.getElementById('searchOverlay').classList.add('active');
    document.getElementById('searchInputLarge').focus();
}

function closeSearch(e) {
    if (e.target === document.getElementById('searchOverlay')) {
        document.getElementById('searchOverlay').classList.remove('active');
    }
}

function handleSearch(e) {
    if (e.key === 'Enter') {
        toggleSearch();
        document.getElementById('searchInputLarge').value = e.target.value;
        performSearch(e.target.value);
    }
}

function performSearch(query) {
    if (!query) return;
    const results = store.articles.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        article.category.toLowerCase().includes(query.toLowerCase())
    );
    
    const resultsContainer = document.getElementById('searchResults');
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>No articles found</p></div>';
    } else {
        resultsContainer.innerHTML = results.map(article => `
            <div class="search-result-item" onclick="router.navigate('article', {id: ${article.id}}); document.getElementById('searchOverlay').classList.remove('active');">
                <h4>${article.title}</h4>
                <p>${article.category} • ${formatDate(article.date)}${article.created_at ? ` • ${formatTime(article.created_at)}` : ''}</p>
            </div>
        `).join('');
    }
}

function filterByCategory(category) {
    store.currentCategory = category;
    router.navigate('category', { category });
}

function handleNewsletter(e) {
    e.preventDefault();
    showToast('Thank you for subscribing to MedSense News!');
    e.target.reset();
}

function getBreakingTickerItems() {
    const publishedArticles = store.articles
        .filter(article => article.status === 'published')
        .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
        .slice(0, 3);

    const liveItems = publishedArticles.map(article => `Breaking: ${article.title}`);

    if (liveItems.length > 0) {
        return liveItems;
    }

    return [
        'Breaking: WHO announces new global health initiative',
        'Breaking: New medical research updates are now live',
        'Breaking: Health and medicine stories are rotating automatically'
    ];
}

function startBreakingTicker() {
    const ticker = document.getElementById('breakingTicker');
    if (!ticker) return;

    const items = getBreakingTickerItems();
    if (items.length === 0) return;

    ticker.textContent = items.join('   |   ');
}

function updateNavbar() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    navLinks.innerHTML = `
        <li><a href="${buildRouteHref('home')}" onclick="router.navigate('home'); return false;">Home</a></li>
        <li><a href="${buildRouteHref('category', { category: 'Health' })}" onclick="filterByCategory('Health'); return false;">Health</a></li>
        <li><a href="${buildRouteHref('category', { category: 'Medicine' })}" onclick="filterByCategory('Medicine'); return false;">Medicine</a></li>
        <li><a href="${buildRouteHref('category', { category: 'Research' })}" onclick="filterByCategory('Research'); return false;">Research</a></li>
        <li><a href="${buildRouteHref('category', { category: 'Public Health' })}" onclick="filterByCategory('Public Health'); return false;">Public Health</a></li>
        <li><a href="${buildRouteHref('category', { category: 'Technology' })}" onclick="filterByCategory('Technology'); return false;">Technology</a></li>
    `;

    const mobileNavLinks = document.querySelector('.mobile-nav-links');
    if (mobileNavLinks) {
        mobileNavLinks.innerHTML = `
            <li><a href="${buildRouteHref('home')}" onclick="toggleMobileMenu(); router.navigate('home'); return false;">Home</a></li>
            <li><a href="${buildRouteHref('category', { category: 'Health' })}" onclick="toggleMobileMenu(); filterByCategory('Health'); return false;">Health</a></li>
            <li><a href="${buildRouteHref('category', { category: 'Medicine' })}" onclick="toggleMobileMenu(); filterByCategory('Medicine'); return false;">Medicine</a></li>
            <li><a href="${buildRouteHref('category', { category: 'Research' })}" onclick="toggleMobileMenu(); filterByCategory('Research'); return false;">Research</a></li>
            <li><a href="${buildRouteHref('category', { category: 'Public Health' })}" onclick="toggleMobileMenu(); filterByCategory('Public Health'); return false;">Public Health</a></li>
            <li><a href="${buildRouteHref('category', { category: 'Technology' })}" onclick="toggleMobileMenu(); filterByCategory('Technology'); return false;">Technology</a></li>
        `;
    }
}

function shareArticle(platform, title) {
    const url = window.location.href;
    const text = encodeURIComponent(title + ' - MedSense News');
    let shareUrl;
    switch(platform) {
        case 'whatsapp': shareUrl = `https://wa.me/?text=${text}%20${url}`; break;
        case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
        case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
    }
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

async function addComment(articleId) {
    const textInput = document.getElementById('commentText');
    const nameInput = document.getElementById('commentName');
    const text = textInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!text || !name) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    const btn = document.getElementById('postCommentBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Posting...';
    }

    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert([{ article_id: articleId, author: name, text: text, created_at: getLocalDateTimeISO() }]);
            
        if (error) throw error;
        
        showToast('Comment posted successfully!');
        textInput.value = '';
        nameInput.value = '';
        renderArticle(articleId);
    } catch (e) {
        showToast('Error posting comment', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Post Comment';
        }
    }
}

function renderHome() {
    const publishedArticles = store.articles.filter(a => a.status === 'published');
    const featured = publishedArticles.slice(0, 3);
    const latest = publishedArticles.slice(3);
    const trending = [...publishedArticles].sort((a,b) => b.views - a.views).slice(0, 5);
    
    document.getElementById('app').innerHTML = `
        <div class="container">
            <div class="hero-section">
                <div class="featured-grid">
                    <div class="featured-main" onclick="router.navigate('article', {id: ${featured[0].id}})">
                        ${applyBranding(featured[0].image, featured[0].title)}
                        <div class="featured-overlay">
                            <span class="category-tag">${featured[0].category}</span>
                            <h2 class="featured-title">${featured[0].title}</h2>
                        </div>
                    </div>
                    <div class="featured-secondary">
                        ${featured.slice(1).map(art => `
                            <div class="featured-card" onclick="router.navigate('article', {id: ${art.id}})">
                                ${applyBranding(art.image, art.title)}
                                <div class="featured-overlay">
                                    <span class="category-tag">${art.category}</span>
                                    <h3 class="featured-title">${art.title}</h3>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="main-grid">
                <div class="main-content">
                    <div class="section-header">
                        <h3 class="section-title"><i class="fas fa-newspaper"></i> Latest News</h3>
                    </div>
                    <div class="news-grid">
                        ${latest.map(art => `
                            <article class="news-card" onclick="router.navigate('article', {id: ${art.id}})">
                                <div class="news-card-image">
                                    ${applyBranding(art.image, art.title)}
                                </div>
                                <div class="news-card-content">
                                    <div class="news-card-category">${art.category}</div>
                                    <h3 class="news-card-title">${art.title}</h3>
                                    <p class="news-card-excerpt">${art.excerpt}</p>
                                    <div class="news-card-meta">
                                        <span>${formatDate(art.date)}${art.created_at ? ` • ${formatTime(art.created_at)}` : ''}</span>
                                        <span class="read-more">Read More <i class="fas fa-arrow-right"></i></span>
                                    </div>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                </div>
                <aside class="sidebar">
                    <div class="sidebar-widget">
                        <div class="section-header">
                            <h3 class="section-title"><i class="fas fa-fire"></i> Trending</h3>
                        </div>
                        ${trending.map((art, i) => `
                            <div class="trending-item" onclick="router.navigate('article', {id: ${art.id}})">
                                <span class="trending-number">0${i+1}</span>
                                <div class="trending-content">
                                    <h4>${art.title}</h4>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </aside>
            </div>
        </div>
    `;
}

async function renderArticle(id) {
    const article = store.articles.find(a => a.id === id);
    if (!article) return router.navigate('home');
    
    let comments = [];
    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select('*')
            .eq('article_id', id)
            .order('created_at', { ascending: false });
            
        if (!error && data) {
            comments = data;
        }
    } catch (e) {
        console.warn("Could not fetch comments");
    }
    
    document.getElementById('app').innerHTML = `
        <article class="article-container">
            <header class="article-header">
                <span class="category-tag article-category">${article.category}</span>
                <h1 class="article-title">${article.title}</h1>
                <div class="article-meta">
                    <span>By ${article.author}</span> • <span>${formatDate(article.date)}${article.created_at ? ` • ${formatTime(article.created_at)}` : ''}</span>
                </div>
            </header>
            ${applyBranding(article.image, article.title)}
            <div class="article-body">${article.content}</div>
            
            <div class="share-buttons">
                <button class="share-btn share-whatsapp" onclick="shareArticle('whatsapp', '${article.title.replace(/'/g, "\\'")}')">
                    <i class="fab fa-whatsapp"></i> Share on WhatsApp
                </button>
                <button class="share-btn share-twitter" onclick="shareArticle('twitter', '${article.title.replace(/'/g, "\\'")}')">
                    <i class="fab fa-twitter"></i> Share on X
                </button>
                <button class="share-btn share-facebook" onclick="shareArticle('facebook', '${article.title.replace(/'/g, "\\'")}')">
                    <i class="fab fa-facebook-f"></i> Share on Facebook
                </button>
            </div>

            <div class="comments-section">
                <h3 class="comments-header">Comments (${comments.length})</h3>
                
                <div class="comments-list">
                    ${comments.length === 0 ? '<p class="no-comments">Be the first to comment!</p>' : ''}
                    ${comments.map(c => `
                        <div class="comment">
                            <div class="comment-author"><strong>${c.author}</strong> <small>${formatDateTime(c.created_at || new Date())}</small></div>
                            <p class="comment-text">${c.text}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="comment-form-container">
                    <h4>Leave a Comment</h4>
                    <div class="comment-form">
                        <input type="text" id="commentName" placeholder="Your name (e.g. Dr. Smith)">
                        <textarea id="commentText" placeholder="Share your thoughts on this article..."></textarea>
                        <button id="postCommentBtn" class="btn btn-primary btn-sm" onclick="addComment(${article.id})">Post Comment</button>
                    </div>
                </div>
            </div>
        </article>
    `;
    article.views++;
    saveStore();
}

function renderCategory(category) {
    const articles = store.articles.filter(a => a.category === category && a.status === 'published');
    document.getElementById('app').innerHTML = `
        <div class="container" style="margin-top: 2rem;">
            <div class="section-header">
                <h3 class="section-title">${category}</h3>
            </div>
            <div class="news-grid">
                ${articles.map(art => `
                    <article class="news-card" onclick="router.navigate('article', {id: ${art.id}})">
                        <div class="news-card-image">${applyBranding(art.image, art.title)}</div>
                        <div class="news-card-content">
                            <h3 class="news-card-title">${art.title}</h3>
                        </div>
                    </article>
                `).join('')}
            </div>
        </div>
    `;
}

function renderAbout() {
    document.getElementById('app').innerHTML = `
        <div class="about-container">
            <div class="about-hero">
                <div class="container">
                    <h1 class="about-title">About Us</h1>
                    <p class="about-subtitle">Bridging the gap between scientific research and public understanding.</p>
                </div>
            </div>
            
            <div class="container">
                <div class="about-content-grid">
                    <div class="about-main-text">
                        <section class="about-section animate-up">
                            <p class="lead-text">
                                <strong>MedSense News</strong> is a public health and medical news platform under the MedSense Foundation. 
                                It is dedicated to delivering accurate, timely, and research-informed information to the public, 
                                with a strong focus on health awareness, disease prevention, and medical education.
                            </p>
                        </section>

                        <section class="about-section animate-up" style="animation-delay: 0.1s">
                            <h3>Our Mission</h3>
                            <p>
                                Our mission is to simplify complex medical knowledge and make it accessible to everyone — from everyday readers to students and professionals. 
                                Through carefully curated articles, expert insights, and evidence-based reporting, MedSense News aims to bridge the gap between scientific research and public understanding.
                            </p>
                        </section>

                        <section class="about-section animate-up" style="animation-delay: 0.2s">
                            <h3>Our Focus</h3>
                            <p>
                                We focus on key areas including public health updates, clinical insights, emerging medical research, and global health trends. 
                                Every piece of content is guided by clarity, credibility, and relevance to real-world health challenges.
                            </p>
                        </section>

                        <section class="about-section animate-up" style="animation-delay: 0.3s">
                            <h3>MedSense Foundation</h3>
                            <p>
                                As part of the MedSense Foundation, MedSense News also supports a broader vision of advancing healthcare knowledge, 
                                promoting community health initiatives, and contributing to research-driven solutions for a healthier future.
                            </p>
                        </section>
                    </div>
                    
                    <aside class="about-sidebar">
                        <div class="about-card animate-up" style="animation-delay: 0.4s">
                            <div class="about-card-icon"><i class="fas fa-heartbeat"></i></div>
                            <h4>Health Awareness</h4>
                            <p>Promoting wellness and preventative care through education.</p>
                        </div>
                        <div class="about-card animate-up" style="animation-delay: 0.5s">
                            <div class="about-card-icon"><i class="fas fa-microscope"></i></div>
                            <h4>Research Driven</h4>
                            <p>Evidence-based reporting from top medical journals.</p>
                        </div>
                        <div class="about-card animate-up" style="animation-delay: 0.6s">
                            <div class="about-card-icon"><i class="fas fa-globe"></i></div>
                            <h4>Global Trends</h4>
                            <p>Tracking health shifts and medical breakthroughs worldwide.</p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    `;
}

function renderPrivacy() {
    document.getElementById('app').innerHTML = `
        <div class="about-container">
            <div class="about-hero">
                <div class="container">
                    <h1 class="about-title">Privacy Policy</h1>
                    <p class="about-subtitle">How we protect your data at MedSense News.</p>
                </div>
            </div>
            
            <div class="container">
                <div class="legal-content">
                    <section class="legal-section animate-up">
                        <p class="lead-text">
                            <strong>MedSense News</strong>, a platform under MedSense Foundation, is committed to protecting the privacy of its users. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website.
                        </p>
                    </section>

                    <div class="legal-grid">
                        <section class="legal-section animate-up" style="animation-delay: 0.1s">
                            <h3>1. Information We Collect</h3>
                            <p>We may collect basic information such as your name, email address, and any data you provide when contacting us, subscribing to updates, or interacting with our platform. We may also collect non-personal data such as browser type, device information, and usage patterns.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.15s">
                            <h3>2. How We Use Your Information</h3>
                            <p>We use collected information to:</p>
                            <ul>
                                <li>Provide and improve our content and services</li>
                                <li>Respond to inquiries and feedback</li>
                                <li>Send updates or newsletters (if subscribed)</li>
                                <li>Monitor and analyze website usage</li>
                            </ul>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.2s">
                            <h3>3. Data Protection</h3>
                            <p>We implement appropriate security measures to protect your data. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.25s">
                            <h3>4. Third-Party Services</h3>
                            <p>We may use third-party tools (such as analytics or hosting services) that may collect information in accordance with their own privacy policies.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.3s">
                            <h3>5. Cookies</h3>
                            <p>Our website may use cookies to enhance user experience and analyze traffic. You can choose to disable cookies through your browser settings.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.35s">
                            <h3>6. Your Rights</h3>
                            <p>You have the right to request access to, correction of, or deletion of your personal information where applicable.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.4s">
                            <h3>7. Updates to This Policy</h3>
                            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.45s">
                            <h3>8. Contact Us</h3>
                            <p>If you have any questions about this Privacy Policy, please contact us through MedSense News.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTerms() {
    document.getElementById('app').innerHTML = `
        <div class="about-container">
            <div class="about-hero">
                <div class="container">
                    <h1 class="about-title">Terms of Service</h1>
                    <p class="about-subtitle">Our guidelines for using the MedSense News platform.</p>
                </div>
            </div>
            
            <div class="container">
                <div class="legal-content">
                    <section class="legal-section animate-up">
                        <p class="lead-text">
                            By accessing and using <strong>MedSense News</strong>, you agree to comply with the following terms and conditions.
                        </p>
                    </section>

                    <div class="legal-grid">
                        <section class="legal-section animate-up" style="animation-delay: 0.1s">
                            <h3>1. Use of Content</h3>
                            <p>All content published on MedSense News is for informational and educational purposes only. It should not be considered medical advice, diagnosis, or treatment.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.15s">
                            <h3>2. User Responsibility</h3>
                            <p>Users agree to use the platform responsibly and not engage in activities that may harm the website, its services, or other users.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.2s">
                            <h3>3. Intellectual Property</h3>
                            <p>All content, including articles, graphics, and branding, is the property of MedSense News under MedSense Foundation unless otherwise stated. Unauthorized use or reproduction is prohibited.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.25s">
                            <h3>4. Accuracy of Information</h3>
                            <p>While we strive to provide accurate and up-to-date information, MedSense News does not guarantee the completeness or reliability of all content.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.3s">
                            <h3>5. Limitation of Liability</h3>
                            <p>MedSense News shall not be held liable for any damages resulting from the use or inability to use the information provided on the platform.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.35s">
                            <h3>6. External Links</h3>
                            <p>Our platform may contain links to third-party websites. We are not responsible for the content or practices of these external sites.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.4s">
                            <h3>7. Changes to Terms</h3>
                            <p>We reserve the right to update or modify these Terms at any time. Continued use of the platform constitutes acceptance of those changes.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.45s">
                            <h3>8. Governing Principle</h3>
                            <p>These Terms are governed by applicable laws and general principles of fair use and responsible access.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.5s">
                            <h3>9. Contact</h3>
                            <p>For any questions regarding these Terms, please contact MedSense News.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCareers() {
    document.getElementById('app').innerHTML = `
        <div class="about-container">
            <div class="about-hero">
                <div class="container">
                    <h1 class="about-title">Careers</h1>
                    <p class="about-subtitle">Join us in building a new standard for research-driven health journalism.</p>
                </div>
            </div>
            
            <div class="container">
                <div class="legal-content">
                    <section class="legal-section animate-up">
                        <p class="lead-text">
                            <strong>MedSense News</strong>, a platform under the MedSense Foundation, is building a new standard for accessible, research-driven health journalism. We are always looking for passionate individuals who are committed to informing the public and advancing health awareness through credible and impactful storytelling.
                        </p>
                    </section>

                    <div class="legal-grid">
                        <section class="legal-section animate-up" style="animation-delay: 0.1s">
                            <h3>Why Join Us</h3>
                            <p>At MedSense News, you will be part of a mission-driven team focused on bridging the gap between medical knowledge and public understanding. We value accuracy, innovation, and collaboration, and we provide an environment where your work can make a real difference.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.15s">
                            <h3>Who We’re Looking For</h3>
                            <p>We welcome individuals with strong interest or experience in:</p>
                            <ul>
                                <li>Health and medical writing</li>
                                <li>Journalism and reporting</li>
                                <li>Research and data analysis</li>
                                <li>Web development and digital media</li>
                                <li>Public health and science communication</li>
                            </ul>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.2s">
                            <h3>Open Opportunities</h3>
                            <p>Roles may include:</p>
                            <ul>
                                <li>Content Writers / Editors</li>
                                <li>Health Journalists</li>
                                <li>Research Assistants</li>
                                <li>Frontend / Backend Developers</li>
                                <li>Media and Communications Support</li>
                            </ul>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.25s">
                            <h3>Work Structure</h3>
                            <p>We offer flexible collaboration opportunities, including remote contributions, project-based roles, and volunteer positions as we continue to grow.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.3s">
                            <h3>How to Apply</h3>
                            <p>To express your interest, please contact us with your details, area of expertise, and any relevant work or portfolio. Selected candidates will be contacted for further steps.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.35s">
                            <h3>Our Vision</h3>
                            <p>By joining MedSense News, you become part of a broader vision under the MedSense Foundation to promote health education, support research initiatives, and build innovative solutions for global health challenges.</p>
                            <p>We look forward to working with individuals who are ready to contribute to a smarter and healthier future.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderContact() {
    document.getElementById('app').innerHTML = `
        <div class="about-container">
            <div class="about-hero">
                <div class="container">
                    <h1 class="about-title">Contact Us</h1>
                    <p class="about-subtitle">Reach the MedSense News team through the channels below.</p>
                </div>
            </div>
            
            <div class="container">
                <div class="legal-content">
                    <section class="legal-section animate-up">
                        <p class="lead-text">
                            We’re always happy to hear from readers, partners, and contributors. If you have a story tip, a question, or a partnership idea, please connect with us through one of our official channels.
                        </p>
                    </section>

                    <div class="legal-grid">
                        <section class="legal-section animate-up" style="animation-delay: 0.1s">
                            <h3>Social Channels</h3>
                            <ul>
                                <li>Facebook: MedSense News</li>
                                <li>X: @MedsenseN</li>
                                <li>Instagram: @medsensenews</li>
                                <li>WhatsApp Channel: MedSense News</li>
                            </ul>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.15s">
                            <h3>For Readers</h3>
                            <p>If you notice an issue with an article or want to suggest a topic, send us a message through social media and mention the article title so we can respond quickly.</p>
                        </section>

                        <section class="legal-section animate-up" style="animation-delay: 0.2s">
                            <h3>For Contributors</h3>
                            <p>If you would like to write for MedSense News or discuss a collaboration, please visit the Careers page and share your background and portfolio there.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const updateDateTime = () => {
            dateEl.textContent = new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    if (store.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    updateNavbar();
    startBreakingTicker();
    renderCurrentURLRoute();

    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG' || e.target.classList.contains('download-protection-overlay')) {
            e.preventDefault();
        }
    });

    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
    }

    async function syncWithSupabase() {
        try {
            const { data, error } = await supabaseClient
                .from('articles')
                .select('*')
                .eq('status', 'published')
                .order('date', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                store.articles = data;
            }
            startBreakingTicker();
            renderCurrentURLRoute();
        } catch (e) {
            console.warn("Supabase sync pending config.");
        }
    }

    syncWithSupabase();
});
