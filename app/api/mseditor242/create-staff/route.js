import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { name, email, role, password, requestingUserToken } = await request.json();

    // ── 1. Verify the requesting user is authenticated ───────
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${requestingUserToken}` } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Basic validation ──────────────────────────────────
    if (!name || !email || !role || !password) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // ── 3. Create the Supabase Auth account (via ANON key) ───
    const ephemeralClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { data: newUser, error: createError } = await ephemeralClient.auth.signUp({
      email,
      password,
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        return Response.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
      return Response.json({ error: createError.message }, { status: 500 });
    }

    // ── 4. Insert into the staff table via Secure RPC ────────
    const { error: staffError } = await authClient.rpc('create_staff_record', {
      p_name: name,
      p_email: email,
      p_role: role
    });

    if (staffError) {
      return Response.json({ error: 'Failed to save staff record: ' + staffError.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('[create-staff] Unexpected error:', err);
    return Response.json({ error: 'Server error. Check logs.' }, { status: 500 });
  }
}
