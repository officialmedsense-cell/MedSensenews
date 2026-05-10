import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufiirgbphacmlcgszqdx.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_WIV1ljzHzArF-MoA-YEb-A_X_jP_Dx_'

export const supabase = createClient(supabaseUrl, supabaseKey)
