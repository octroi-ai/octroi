import { config } from "../config";

type LogMeta = Record<string, unknown>;

function format(level: string, msg: string, meta?: LogMeta) {
  if (config.isProd) {
    return JSON.stringify({ level, msg, ...meta, ts: Date.now() });
  }
  const prefix = `[${level.toUpperCase()}]`;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `${prefix} ${msg}${metaStr}`;
}

export const logger = {
  debug: (msg: string, meta?: LogMeta) => {
    if (config.LOG_LEVEL === "debug") console.log(format("debug", msg, meta));
  },
  info: (msg: string, meta?: LogMeta) => {
    if (["debug", "info"].includes(config.LOG_LEVEL)) console.log(format("info", msg, meta));
  },
  warn: (msg: string, meta?: LogMeta) => {
    if (["debug", "info", "warn"].includes(config.LOG_LEVEL)) console.warn(format("warn", msg, meta));
  },
  error: (msg: string, meta?: LogMeta) => {
    console.error(format("error", msg, meta));
  },
};
