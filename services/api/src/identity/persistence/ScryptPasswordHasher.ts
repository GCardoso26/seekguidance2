import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PasswordHasher } from "../domain/PasswordHasher.js";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

/**
 * scrypt-based password hasher (no external deps).
 * Format: scrypt$<saltHex>$<hashHex>. Plaintext never stored or logged.
 */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plaintext: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scryptAsync(plaintext, salt, KEYLEN)) as Buffer;
    return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    const parts = hash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1]!, "hex");
    const expected = Buffer.from(parts[2]!, "hex");
    const derived = (await scryptAsync(plaintext, salt, KEYLEN)) as Buffer;
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }
}
