import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufiirgbphacmlcgszqdx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_WIV1ljzHzArF-MoA-YEb-A_X_jP_Dx_';

export async function POST(request) {
  try {
    const { targetEmail, newPassword, requestingUserToken } = await request.json();

    // Debug: Check if env variables are loaded
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ 
        error: 'System Configuration Error: API keys not found in environment.',
        debug: { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey }
      }, { status: 500 });
    }

    // 1. Verify the requesting user is authenticated
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${requestingUserToken}` } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check permissions
    const { data: staffMember } = await authClient
      .from('staff')
      .select('role')
      .eq('email', user.email)
      .single();

    const isOwner = user.email === 'officialmedsense@gmail.com';
    const canManageStaff = isOwner || (staffMember && ['admin', 'superadmin'].includes(staffMember.role));

    if (!canManageStaff) {
      return Response.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    // 3. Update the password via Service Role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Find the user in Supabase Auth by email (Case-Insensitive)
    const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
    
    if (listError) {
      return Response.json({ error: 'Failed to list auth users: ' + listError.message }, { status: 500 });
    }

    const targetUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

    if (!targetUser) {
      // If not found in the first batch, we might need to search deeper, but 50 is usually enough for staff.
      // We can also try a direct search if the user has many accounts.
      return Response.json({ 
        error: `User "${targetEmail}" not found in Supabase Auth. Total users checked: ${users.length}`,
        debugInfo: users.map(u => u.email).slice(0, 5) 
      }, { status: 404 });
    }

    // Reset the password using the Auth ID
    const { error: resetError } = await serviceClient.auth.admin.updateUserById(targetUser.id, {
      password: newPassword
    });

    if (resetError) {
      return Response.json({ error: 'Password reset failed: ' + resetError.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('[update-staff-password] Error:', err);
    return Response.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
