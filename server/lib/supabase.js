// lib/supabase.js — 연결 풀 설정 확인
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: { 'Connection': 'keep-alive' },
    },
  }
);

module.exports = { supabase };