import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

export function createDb(connectionString: string, options?: { max?: number }) {
  const client = postgres(connectionString, { max: options?.max ?? 10 });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
