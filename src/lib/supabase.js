import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigError = !supabaseUrl || !supabasePublishableKey
  ? 'Supabase 环境变量缺失：请配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。'
  : ''

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
