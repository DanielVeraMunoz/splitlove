import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type SessionContextValue = {
  session: Session | null;
  // true until the stored session has been read, so we don't flash the login screen
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextValue>({ session: null, isLoading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If an auth event arrives before getSession() resolves, it is newer: keep it.
    let gotAuthEvent = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!gotAuthEvent) setSession(data.session);
      })
      .catch(() => {
        // unreadable stored session: behave as logged out instead of hanging
      })
      .finally(() => setIsLoading(false));

    // Fires on sign in, sign out and token refresh. Keep it synchronous:
    // awaiting other Supabase calls inside this callback can deadlock the client.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      gotAuthEvent = true;
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return <SessionContext.Provider value={{ session, isLoading }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
