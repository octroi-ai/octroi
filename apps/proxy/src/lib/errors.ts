export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Pre-defined error factories
export const Errors = {
  authMissing: () =>
    new AppError(401, "AUTH_MISSING_KEY", "Missing API key. Include X-Octroi-Key header."),
  authInvalid: () =>
    new AppError(401, "AUTH_INVALID_KEY", "Invalid API key."),
  authExpired: () =>
    new AppError(401, "AUTH_KEY_EXPIRED", "API key expired."),
  rateLimited: () =>
    new AppError(429, "RATE_LIMIT_EXCEEDED", "Rate limit exceeded. Upgrade your plan for higher limits."),
  notFound: (resource: string) =>
    new AppError(404, "NOT_FOUND", `${resource} not found.`),
  validationFailed: (details: string) =>
    new AppError(400, "VALIDATION_ERROR", details),
  providerError: (provider: string, status: number, details: string) =>
    new AppError(502, "PROVIDER_ERROR", `Provider ${provider} returned ${status}: ${details}`),
  noApiKey: (provider: string) =>
    new AppError(422, "NO_API_KEY", `No API key configured for provider: ${provider}`),
  internal: (message = "Internal server error") =>
    new AppError(500, "INTERNAL_ERROR", message),
};
