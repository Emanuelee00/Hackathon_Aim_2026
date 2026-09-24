"""Password hashing with the standard library's scrypt, no extra dependency."""

import hashlib
import hmac
import secrets

# Interactive-login parameters recommended for scrypt (about 16 MB, ~50 ms).
N, R, P = 2**14, 8, 1


def _scrypt(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P, dklen=32)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    return f"scrypt${salt.hex()}${_scrypt(password, salt).hex()}"


def verify_password(password: str, stored: str) -> bool:
    _, salt, expected = stored.split("$")
    return hmac.compare_digest(_scrypt(password, bytes.fromhex(salt)).hex(), expected)


# Checked against when the email is unknown, so both cases take the same time.
DUMMY_HASH = hash_password(secrets.token_hex(16))
