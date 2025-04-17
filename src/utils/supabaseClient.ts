import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uewmgptnkldmchbkfumh.supabase.co';
const supabaseAnonKey = 'SUPABASE_ANON_KEY_REMOVED';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 