import { createClient } from "@clickhouse/client";
import { config } from "../config";

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
