"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getEmail, logout as clearSession } from "../lib/session";

interface AuthContextValue {
  user: { email: string } | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = getEmail();
    setUser(email ? { email } : null);
    setLoading(false);
  }, []);

  function logout() {
    clearSession();
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
