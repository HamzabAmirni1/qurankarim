import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydugkhqbrpdatedsyphk.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // اطلب من المستخدم وضع المفتاح هنا

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
