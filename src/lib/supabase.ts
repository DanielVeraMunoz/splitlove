import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill it in.'
  );
}

export const supabase = createClient(url, publishableKey, {
  auth: {
    // expo-sqlite installs a localStorage polyfill that persists the session
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // there is no URL to read a session from in a native app
    detectSessionInUrl: false,
  },
});
