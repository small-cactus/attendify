import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uewmgptnkldmchbkfumh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVld21ncHRua2xkbWNoYmtmdW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODQ2MTYsImV4cCI6MjA2MDM2MDYxNn0.a5Z96Ji2I3svhVDRVGDCO7JwwDxkZq2lfW2wC4am96s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 