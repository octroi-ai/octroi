CREATE DATABASE IF NOT EXISTS tokenforge;

CREATE TABLE IF NOT EXISTS tokenforge.requests (
    id UUID DEFAULT generateUUIDv4(),
    org_id String,
    project_id String,
    provider String,
    model String,
    region String,
    input_tokens UInt32,
    output_tokens UInt32,
    total_tokens UInt32,
    cost_usd Float64,
    latency_ms UInt32,
    cached UInt8 DEFAULT 0,
    status_code UInt16,
    error_message String DEFAULT '',
    request_hash String DEFAULT '',
    timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (org_id, project_id, timestamp)
PARTITION BY toYYYYMM(timestamp);

CREATE TABLE IF NOT EXISTS tokenforge.carbon_metrics (
    id UUID DEFAULT generateUUIDv4(),
    request_id UUID,
    org_id String,
    provider_region String,
    gpu_type String,
    pue Float64,
    energy_mix_gco2_kwh Float64,
    energy_wh Float64,
    co2_grams Float64,
    timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (org_id, timestamp)
PARTITION BY toYYYYMM(timestamp);

CREATE TABLE IF NOT EXISTS tokenforge.price_snapshots (
    provider String,
    model String,
    region String,
    input_price_per_1k Float64,
    output_price_per_1k Float64,
    timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (provider, model, timestamp)
PARTITION BY toYYYYMM(timestamp);
