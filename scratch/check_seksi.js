const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Connecting to:', supabaseUrl);
  const { data: seksi, error: seksiErr } = await supabase.from('seksi').select('*');
  console.log('Seksi Table Rows:', seksi);
  if (seksiErr) console.error('Seksi error:', seksiErr);

  const { data: panitia, error: panitiaErr } = await supabase.from('panitia').select('*');
  console.log('Panitia Table Rows:', panitia);
  if (panitiaErr) console.error('Panitia error:', panitiaErr);
}

check();
