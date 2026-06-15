import "hono";

// Augment Hono's context so c.get/c.set are typed across all routes & middleware.
declare module "hono" {
  interface ContextVariableMap {
    orgId: string;
    apiKeyId: string;
    permissions: string[];
    requestId: string;
  }
}
