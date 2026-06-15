import { config } from "../config";
import { createDb } from "@tokenforge/db";

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb(config.DATABASE_URL, { max: 10 });
  }
  return _db;
}
