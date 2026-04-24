const INITIAL_STORE = {
    articles: [
        {
            id: 1,
            title: "Breakthrough in mRNA Cancer Vaccine Shows 78% Efficacy in Phase 2 Trials",
            excerpt: "Researchers at Johns Hopkins have developed a personalized mRNA vaccine that trains the immune system to attack tumor cells, showing unprecedented success rates in late-stage trials.",
            content: `<p>In a landmark development for oncology, researchers at Johns Hopkins University have announced Phase 2 trial results for a personalized mRNA cancer vaccine that has demonstrated a 78% efficacy rate in preventing recurrence of melanoma.</p>
            <p>The vaccine, named ImmunoSense-TX, works by analyzing the unique genetic mutations in a patient's tumor and creating a customized mRNA sequence that teaches the immune system to recognize and attack cancer cells bearing those specific mutations.</p>
            <h2>Revolutionary Approach</h2>
            <p>Unlike traditional chemotherapy, which attacks all rapidly dividing cells, this targeted approach leverages the body's natural defenses. "This represents a paradigm shift in how we approach cancer treatment," said Dr. Sarah Chen, lead researcher at the Johns Hopkins Sidney Kimmel Comprehensive Cancer Center.</p>
            <p>The Phase 2 trial involved 157 patients with stage III and IV melanoma who had undergone surgical removal of their tumors. Participants received either the vaccine plus standard immunotherapy or standard immunotherapy alone.</p>
            <h2>Global Implications</h2>
            <p>The success has sparked interest from pharmaceutical companies worldwide. Moderna and BioNTech have already announced partnerships to accelerate Phase 3 trials, which could begin as early as Q3 2026.</p>
            <p>Health economists estimate that if approved, the treatment could reduce melanoma-related healthcare costs by up to 40% over five years, given its potential to prevent costly late-stage interventions.</p>`,
            category: "Research",
            author: "Dr. Sarah Mitchell",
            date: "2026-04-20",
            image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=500&fit=crop",
            trending: true,
            views: 12500,
            status: 'published'
        },
        {
            id: 2,
            title: "WHO Declares End to Global Health Emergency for Mpox",
            excerpt: "The World Health Organization officially ends the mpox global health emergency status as case numbers decline significantly worldwide following successful vaccination campaigns.",
            content: `<p>The World Health Organization (WHO) has officially declared the end of the mpox global health emergency, marking a significant milestone in international public health coordination.</p>
            <p>The decision comes as global case numbers have declined by 92% from peak levels in 2024, thanks to unprecedented cooperation between governments, health agencies, and pharmaceutical manufacturers.</p>
            <h2>Vaccination Success</h2>
            <p>The Bavarian Nordic's Modified Vaccinia Ankara-Bavarian Nordic (MVA-BN) vaccine, administered to over 45 million people in endemic and at-risk regions, has proven 85% effective in preventing infection.</p>
            <p>"This demonstrates what we can achieve when the global community mobilizes quickly," said WHO Director-General Dr. Tedros Adhanom Gheaveyesus during the announcement in Geneva.</p>`,
            category: "Public Health",
            author: "James Wilson",
            date: "2026-04-19",
            image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&h=500&fit=crop",
            trending: true,
            views: 9800,
            status: 'published'
        },
        {
            id: 3,
            title: "AI Diagnostic Tool Detects Diabetic Retinopathy with 99% Accuracy",
            excerpt: "Google Health and DeepMind unveil a new AI system that can detect early signs of diabetic retinopathy from retinal scans faster and more accurately than human specialists.",
            content: `<p>Google Health, in collaboration with DeepMind, has released a groundbreaking AI diagnostic tool capable of detecting diabetic retinopathy with 99.2% accuracy, surpassing human ophthalmologists in clinical trials.</p>
            <p>The system, named DeepSight-DR, analyzes high-resolution retinal scans and can identify microaneurysms, hemorrhages, and other early indicators of the condition that often lead to blindness if untreated.</p>
            <h2>Accessibility Revolution</h2>
            <p>Perhaps most significantly, the tool has been optimized to run on standard smartphones, making advanced screening accessible in remote areas without specialized equipment.</p>
            <p>Trials conducted in rural India and sub-Saharan Africa demonstrated that community health workers with minimal training could achieve diagnostic results comparable to specialists in urban medical centers.</p>`,
            category: "Technology",
            author: "Aisha Patel",
            date: "2026-04-18",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop",
            trending: true,
            views: 15400,
            status: 'published'
        },
        {
            id: 4,
            title: "New Alzheimer's Drug Slows Cognitive Decline by 60% in Early Trials",
            excerpt: "Pharmaceutical giant Eli Lilly reports extraordinary results for its latest monoclonal antibody treatment targeting amyloid plaques in Alzheimer's patients.",
            content: `<p>Eli Lilly has reported extraordinary Phase 3 results for its experimental Alzheimer's treatment, donanemab, showing a 60% reduction in cognitive decline compared to placebo in patients with early symptomatic disease.</p>
            <p>The drug, a monoclonal antibody that targets modified forms of amyloid beta, represents the most promising development in Alzheimer's therapeutics since the disease was first described by Alois Alzheimer in 1906.</p>`,
            category: "Medicine",
            author: "Robert Chang",
            date: "2026-04-17",
            image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=500&fit=crop",
            trending: false,
            views: 8200,
            status: 'published'
        },
        {
            id: 5,
            title: "Global Life Expectancy Reaches New High of 74.8 Years",
            excerpt: "The latest World Health Statistics report reveals that global life expectancy has increased by 2.3 years over the past decade, driven by improvements in maternal and child health.",
            content: `<p>The World Health Organization's latest World Health Statistics report reveals that global life expectancy has reached a new high of 74.8 years, representing a 2.3-year increase over the past decade.</p>
            <p>The improvement is largely attributed to advances in maternal and child health, reduced mortality from infectious diseases, and better management of noncommunicable conditions in developing nations.</p>`,
            category: "Health",
            author: "Maria Santos",
            date: "2026-04-16",
            image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=500&fit=crop",
            trending: false,
            views: 6700,
            status: 'published'
        },
        {
            id: 6,
            title: "CRISPR Gene Editing Cures Sickle Cell Disease in First US Patient",
            excerpt: "University of Pennsylvania Hospital reports complete cure of sickle cell disease using CRISPR-Cas9 gene editing in a landmark FDA-approved clinical trial.",
            content: `<p>Medical history was made at the University of Pennsylvania Hospital as doctors announced the complete cure of sickle cell disease in a 32-year-old patient using CRISPR-Cas9 gene editing technology.</p>
            <p>The patient, who had suffered debilitating pain crises since childhood, received the one-time treatment six months ago and has shown zero symptoms since, with blood tests confirming the production of healthy red blood cells.</p>`,
            category: "Research",
            author: "Dr. Emily Rodriguez",
            date: "2026-04-15",
            image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=500&fit=crop",
            trending: true,
            views: 18900,
            status: 'published'
        }
    ],
    comments: [],
    currentCategory: null,
    darkMode: localStorage.getItem('darkMode') === 'true',
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    users: [
        { username: 'superadmin', password: 'password123', name: 'Global Director', role: 'superadmin' },
        { username: 'admin', password: 'password123', name: 'Chief Editor', role: 'admin' },
        { username: 'editor', password: 'password123', name: 'Medical Reporter', role: 'editor' },
        { username: 'superstaff', password: 'password123', name: 'Senior Staff 1', role: 'editor' },
        { username: 'superstaff2', password: 'password123', name: 'Senior Staff 2', role: 'editor' }
    ]
};

const store = { ...INITIAL_STORE };

const cachedStore = JSON.parse(localStorage.getItem('medsense_store'));
if (cachedStore) {
    Object.assign(store, cachedStore);
}

async function saveStore() {
    localStorage.setItem('medsense_store', JSON.stringify(store));
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (!dateString) return '';

    // Treat stored `YYYY-MM-DD` values as local calendar dates so they do not
    // shift a day earlier in timezones west of UTC.
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('en-US', options);
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    };
    if (!dateString) return '';

    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleString('en-US', options);
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString('en-US', options);
}

function formatTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function getLocalDateTimeISO(date = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    const offsetMinutes = -date.getTimezoneOffset();
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
    const offsetRemainder = pad(Math.abs(offsetMinutes) % 60);

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetSign}${offsetHours}:${offsetRemainder}`;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleDarkMode() {
    store.darkMode = !store.darkMode;
    document.documentElement.setAttribute('data-theme', store.darkMode ? 'dark' : 'light');
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = `<i class="fas fa-${store.darkMode ? 'sun' : 'moon'}"></i>`;
    }
    localStorage.setItem('darkMode', store.darkMode);
    saveStore();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}
