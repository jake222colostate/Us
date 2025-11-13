import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

try {
  const { data, error } = await supabase.rpc('moderation_run_worker');
  if (error) {
    console.error('Worker RPC error:', error);
    process.exit(1);
  }
  console.log('Worker result:');
  console.log(JSON.stringify(data, null, 2));
} catch (err) {
  console.error('Unexpected error calling worker RPC:', err);
  process.exit(1);
}
