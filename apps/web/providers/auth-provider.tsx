"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User, Session } from "@supabase/supabase-js";
import { AUTH_CONFIGURED, AUTH_URL, AUTH_ANON } from "../lib/auth-config";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Public demo: no Supabase auth configured → never construct a client
    // (it would throw "URL and API key are required" and crash the app).
    if (!AUTH_CONFIGURED) {
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient(AUTH_URL!, AUTH_ANON!);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
