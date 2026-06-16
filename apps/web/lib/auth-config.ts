// Single source of truth for whether real Supabase auth is wired.
// In the public demo no anon key is injected at build, so we must NEVER
// construct a Supabase client — doing so throws "Your project's URL and API
// key are required to create a Supabase client!" and crashes the whole app.
export const AUTH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const AUTH_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const AUTH_CONFIGURED =
  !!AUTH_URL && !!AUTH_ANON && AUTH_ANON !== "demo-anon-placeholder";
