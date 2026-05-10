// ============================================
// MedSense News - Supabase Configuration
// ============================================

const supabaseUrl = 'https://ufiirgbphacmlcgszqdx.supabase.co';
const supabaseKey = 'sb_publishable_WIV1ljzHzArF-MoA-YEb-A_X_jP_Dx_';

// Create the client and attach it to the window object for global access
let supabaseClient = null;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase script not loaded. Supabase features will be disabled.');
}
window.supabaseClient = supabaseClient;
