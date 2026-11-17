import bcrypt
import hashlib
import re


def validar_complejidad_password(password: str) -> tuple[bool, str]:
    if not password or len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres"
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe contener al menos una letra mayúscula"
    if not re.search(r'[a-z]', password):
        return False, "La contraseña debe contener al menos una letra minúscula"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]', password):
        return False, "La contraseña debe contener al menos un carácter especial (ej: !@#$%&*)"
    return True, ""


def hash_password(password: str) -> str:
    if not password:
        password = "Password123!"
    if password.startswith("$2b$") or password.startswith("$2a$"):
        return password
    salt = bcrypt.gensalt(rounds=12)
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
        except Exception:
            return False
    if plain_password == hashed_password:
        return True
    try:
        sha = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
        if sha == hashed_password:
            return True
    except Exception:
        pass
    return False

