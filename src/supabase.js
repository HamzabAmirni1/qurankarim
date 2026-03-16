import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydugkhqbrpdatedsyphk.supabase.co';
const supabaseAnonKey = 'sb_publishable_6aVTKpbnQ37s1eXzMqVV0w_ABwUIFJb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
