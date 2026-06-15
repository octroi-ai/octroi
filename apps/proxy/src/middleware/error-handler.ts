import type { Context } from "hono";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { config } from "../config";

export function errorHandler(err: Error, c: Context) {
  const requestId = c.get("requestId") || "unknown";

  if (err instanceof AppError) {
    logger.warn(err.message, { code: err.code, requestId, statusCode: err.statusCode });
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
          request_id: requestId,
        },
      },
      err.statusCode as any
    );
  }

  // Unknown error — don't leak internals in production
  logger.error("Unhandled error", {
    requestId,
    message: err.message,
    stack: config.isProd ? undefined : err.stack,
  });

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: config.isProd ? "Internal server error" : err.message,
        request_id: requestId,
      },
    },
    500
  );
}
