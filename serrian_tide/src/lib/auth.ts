import crypto from "crypto";

// PBKDF2 settings
const ITERATIONS = 310_000;
const KEY_LEN = 32; // 256-bit
const DIGEST = "sha256";

/**
 * Hash a password with a random salt.
 * Stored format: pbkdf2$<iterations>$<saltHex>$<hashHex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `pbkdf2$${ITERATIONS}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Verify a password against a stored hash string.
 * Returns false on malformed input.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4) return false;

    const [scheme, iterStr, saltHex, hashHex] = parts as [
      string,
      string,
      string,
      string
    ];

    if (scheme !== "pbkdf2") return false;

    const iterations = Number(iterStr);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    if (salt.length === 0 || expected.length === 0) return false;

    const derived = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      expected.length,
      DIGEST
    );

    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Helper for opaque session ids (~40 chars url-safe). */
export function newSessionId(): string {
  return crypto.randomBytes(30).toString("base64url");
}
