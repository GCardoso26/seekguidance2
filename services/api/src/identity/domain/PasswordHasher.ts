/**
 * Password hashing port. Domain never sees plaintext beyond hashing/verify.
 * A concrete adapter (scrypt) lives in persistence; JWT/refresh are Sprint 4.3.
 */
export interface PasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, hash: string): Promise<boolean>;
}
