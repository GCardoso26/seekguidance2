"""Criptografia — passwords (bcrypt), API keys (SHA-256+salt), campos em repouso (AES-256-GCM)."""

from __future__ import annotations

import base64
import hashlib
import os
import secrets

_BCRYPT_PREFIX = "$2b$"


def hash_password(plain: str) -> str:
    import bcrypt

    salt = bcrypt.gensalt(rounds=12)
    digest = bcrypt.hashpw(plain.encode("utf-8"), salt)
    return digest.decode("ascii")


def verify_password(plain: str, stored: str) -> bool:
    if stored.startswith(_BCRYPT_PREFIX):
        import bcrypt

        try:
            return bcrypt.checkpw(plain.encode("utf-8"), stored.encode("ascii"))
        except ValueError:
            return False
    # Legado PBKDF2: salt$hex
    salt, _, digest = stored.partition("$")
    if not digest:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 120_000).hex()
    return secrets.compare_digest(candidate, digest)


def hash_api_key(plain: str, *, salt: str | None = None) -> str:
    s = salt or secrets.token_hex(16)
    digest = hashlib.sha256(f"{s}:{plain}".encode()).hexdigest()
    return f"{s}${digest}"


def verify_api_key(plain: str, stored: str) -> bool:
    salt, _, digest = stored.partition("$")
    if not digest:
        return hashlib.sha256(plain.encode()).hexdigest() == stored
    candidate = hashlib.sha256(f"{salt}:{plain}".encode()).hexdigest()
    return secrets.compare_digest(candidate, digest)


def encrypt_at_rest(plaintext: str, *, master_key_b64: str | None) -> str:
    """AES-256-GCM; devolve envelope base64 ou plaintext se sem chave."""
    if not master_key_b64 or not plaintext:
        return plaintext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    key = base64.urlsafe_b64decode(master_key_b64 + "==")
    if len(key) not in (16, 24, 32):
        key = hashlib.sha256(key).digest()
    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
    return "enc1:" + base64.urlsafe_b64encode(nonce + ciphertext).decode("ascii")


def decrypt_at_rest(blob: str, *, master_key_b64: str | None) -> str:
    if not blob or not blob.startswith("enc1:") or not master_key_b64:
        return blob
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    raw = base64.urlsafe_b64decode(blob[5:] + "==")
    nonce, ciphertext = raw[:12], raw[12:]
    key = base64.urlsafe_b64decode(master_key_b64 + "==")
    if len(key) not in (16, 24, 32):
        key = hashlib.sha256(key).digest()
    return AESGCM(key).decrypt(nonce, ciphertext, None).decode("utf-8")
