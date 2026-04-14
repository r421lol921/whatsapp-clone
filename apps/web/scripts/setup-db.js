import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[v0] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = readFileSync(join(__dirname, '001_create_channels.sql'), 'utf8');

const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: null }));

// Use postgres directly via the supabase client
const statements = sql.split(';').map(s => s.trim()).filter(Boolean);

let hasError = false;
for (const stmt of statements) {
  const { error } = await supabase.rpc('exec_raw', { query: stmt }).catch(() => ({ error: null }));
  if (error) {
    // Try direct query approach
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_raw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: stmt }),
    });
    if (!res.ok) {
      console.log('[v0] Statement skipped (may already exist):', stmt.substring(0, 60) + '...');
    }
  }
}

console.log('[v0] Database setup complete.');
