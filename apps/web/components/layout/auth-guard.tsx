"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiKey } from "@/lib/session";

// Client-side auth gate for protected pages. If there's no session (the
// octroi_key cookie set at login / register / "view demo"), bounce to /login.
// Real data access is still enforced server-side: the proxy rejects any request
// without a valid X-Octroi-Key. This guard is the UX redirect, host-agnostic
// (Netlify does not run Next edge middleware reliably for this setup).
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getApiKey()) {
      setReady(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
