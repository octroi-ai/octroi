import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

export function createDb(connectionString: string, options?: { max?: number }) {
  // prepare:false is REQUIRED for Supabase's transaction pooler (port 6543),
  // which does not support prepared statements — otherwise concurrent queries
  // intermittently fail. It is also safe on the session pooler / direct host.
  const client = postgres(connectionString, { max: options?.max ?? 10, prepare: false });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
