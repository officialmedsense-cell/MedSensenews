import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufiirgbphacmlcgszqdx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_WIV1ljzHzArF-MoA-YEb-A_X_jP_Dx_';

export async function POST(request) {
  try {
    const { staffId, requestingUserToken } = await request.json();

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

    // 2. Check permissions in the staff table
    const { data: staffMember, error: staffError } = await authClient
      .from('staff')
      .select('role')
      .eq('email', user.email)
      .single();

    const isOwner = user.email === 'officialmedsense@gmail.com';
    const canManageStaff = isOwner || (staffMember && ['admin', 'superadmin'].includes(staffMember.role));

    if (!canManageStaff) {
      return Response.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    // 3. Get the email of the user to be deleted
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: targetStaff, error: targetError } = await serviceClient
      .from('staff')
      .select('email, id')
      .eq('id', staffId)
      .maybeSingle();

    if (targetError) {
       return Response.json({ error: 'Database error: ' + targetError.message }, { status: 500 });
    }

    if (!targetStaff) {
      return Response.json({ 
        error: `Staff record not found in database for ID: ${staffId}`,
        debug: { staffId, type: typeof staffId }
      }, { status: 404 });
    }

    if (targetStaff.email === 'officialmedsense@gmail.com') {
      return Response.json({ error: 'The Global Director cannot be deleted.' }, { status: 400 });
    }

    // 4. Delete from staff table first (due to FK constraints if any)
    const { error: dbDeleteError } = await serviceClient
      .from('staff')
      .delete()
      .eq('id', staffId);

    if (dbDeleteError) {
      return Response.json({ error: 'Failed to delete staff record: ' + dbDeleteError.message }, { status: 500 });
    }

    // 5. Delete from Supabase Auth (This is why we need Service Role Key)
    // We need to find the user in Auth by email
    const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
    const authUser = users.find(u => u.email === targetStaff.email);

    if (authUser) {
      const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(authUser.id);
      if (authDeleteError) {
        console.error('Auth delete error:', authDeleteError);
        // We still return success because the staff record is gone, 
        // but we log the error.
      }
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('[delete-staff] Unexpected error:', err);
    return Response.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
