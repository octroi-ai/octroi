import { scryptSync, randomBytes, timingSafeEqual, createHash } from "crypto";

// Password hashing with scrypt (Node built-in, no extra dependency).
// Stored as "salt:hash" (hex). Constant-time comparison on verify.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// Generate an API key. The key itself is shown once; only its SHA-256 hash is
// stored (the auth middleware hashes the incoming key and looks it up).
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const key = "octroi_" + randomBytes(24).toString("hex");
  const keyHash = createHash("sha256").update(key).digest("hex");
  return { key, keyHash, keyPrefix: key.slice(0, 12) };
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "org"
  );
}
