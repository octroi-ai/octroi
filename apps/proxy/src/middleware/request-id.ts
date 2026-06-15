import type { Context, Next } from "hono";
import { nanoid } from "nanoid";

export async function requestIdMiddleware(c: Context, next: Next) {
  const id = c.req.header("X-Request-ID") || `req_${nanoid(16)}`;
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await next();
}
