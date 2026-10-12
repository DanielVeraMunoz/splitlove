import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env, fill it in and ' +
      'restart the dev server with `npx expo start --clear`.'
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

// The refresh timer is suspended while the app is in the background, so the
// token could be expired when the user comes back. Only refresh while active.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
