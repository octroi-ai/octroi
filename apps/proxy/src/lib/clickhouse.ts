import { createClient } from "@clickhouse/client";
import { config } from "../config";

// ClickHouse is OPTIONAL (analytics read from Postgres). Enabled only when
// CLICKHOUSE_URL points at a real, non-localhost-default server.
export const CLICKHOUSE_ENABLED =
  !!config.CLICKHOUSE_URL &&
  config.CLICKHOUSE_URL !== "http://localhost:8123" &&
  !/\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(config.CLICKHOUSE_URL);

let _client: ReturnType<typeof createClient> | null = null;

export function getClickHouse() {
  if (!_client) {
    _client = createClient({
      url: config.CLICKHOUSE_URL,
      database: config.CLICKHOUSE_DB,
      username: config.CLICKHOUSE_USER,
      password: config.CLICKHOUSE_PASSWORD,
    });
  }
  return _client;
}
