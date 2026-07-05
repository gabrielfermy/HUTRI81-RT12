import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a mock client that safe-chains all calls and returns empty results to prevent build-time crashes
const createMockClient = () => {
  const chainable = {
    select: () => chainable,
    order: () => chainable,
    insert: () => chainable,
    update: () => chainable,
    eq: () => chainable,
    then: (resolve: any) => resolve({ data: null, error: new Error('Supabase not configured') }),
  };

  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'from') {
        return () => chainable;
      }
      // Default fallback for any other method
      return () => Promise.resolve({ data: null, error: new Error('Supabase not configured') });
    },
  };

  return new Proxy({}, handler);
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. The app will run in offline/mock mode until environment variables are set in .env.local.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();
