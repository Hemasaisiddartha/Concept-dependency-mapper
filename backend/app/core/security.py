import hashlib
import os
import secrets

def get_password_hash(password: str) -> str:
    """Hash password using PBKDF2 with SHA-256 and a random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored salt$hash."""
    if not hashed_password or '$' not in hashed_password:
        return False
    try:
        salt, stored_hash = hashed_password.split('$', 1)
        key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return secrets.compare_digest(key.hex(), stored_hash)
    except Exception:
        return False

def generate_auth_token(user_id: int, username: str) -> str:
    """Generate a simple persistent token for session authentication."""
    token_seed = f"{user_id}:{username}:{secrets.token_hex(24)}"
    return f"token_{token_seed}"
