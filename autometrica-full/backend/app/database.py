import os
from typing import List

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Entorno ──────────────────────────────────────────────────────────
    # "development" (local) o "production" (Render).
    ENVIRONMENT: str = "development"
    # En producción mantén DEBUG=false. Con DEBUG=true se habilitan /docs y /redoc.
    DEBUG: bool = False

    # ── Base de datos ────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:1234@localhost:5432/autometrica_db"

    # ── URLs públicas ────────────────────────────────────────────────────
    # URL del frontend (se usa en enlaces de correos/SMS y como origen CORS).
    FRONTEND_URL: str = "http://localhost:5173"
    # Orígenes CORS adicionales separados por coma (opcional).
    CORS_ORIGINS: str = ""

    # ── SMTP (Gmail / otros). OJO: Render free bloquea los puertos 25/465/587 ──
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "AutoMétrica"
    SMTP_FROM_EMAIL: str = ""

    # ── SMS (Twilio) ─────────────────────────────────────────────────────
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # ── Resend (correo por HTTPS: funciona en Render free) ───────────────
    RESEND_API_KEY: str = ""
    RESEND_FROM: str = "AutoMétrica <onboarding@resend.dev>"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    @property
    def frontend_url(self) -> str:
        return self.FRONTEND_URL.strip().rstrip("/")

    @property
    def cors_origins(self) -> List[str]:
        """Orígenes permitidos por CORS."""
        extra = [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]
        if extra or self.is_production:
            # En producción nunca "*": solo el frontend + los extra declarados.
            return list(dict.fromkeys([self.frontend_url, *extra]))
        return ["*"]  # desarrollo local


settings = Settings()


def _normalizar_url(url: str) -> str:
    """
    Normaliza la URL de PostgreSQL:
    - Render/Heroku a veces entregan 'postgres://' y SQLAlchemy exige 'postgresql://'.
    - Se fija el driver psycopg2 de forma explícita: SQLAlchemy 2.1+ usa por defecto
      'psycopg' (v3) para 'postgresql://', y el proyecto instala psycopg2-binary.
    """
    url = (url or "").strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalizar_url(settings.DATABASE_URL)

if settings.is_production:
    # Producción: PostgreSQL obligatorio. Sin fallback a SQLite (el disco de
    # Render free es efímero y los datos se perderían en cada reinicio).
    if not DATABASE_URL.startswith("postgresql"):  # incluye postgresql+psycopg2://
        raise RuntimeError(
            "En producción DATABASE_URL debe ser una URL de PostgreSQL "
            "(la 'Internal Database URL' de Render)."
        )
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,   # detecta conexiones cortadas (la BD gratuita las cierra)
        pool_recycle=300,     # recicla conexiones cada 5 min
        pool_size=5,
        max_overflow=2,       # la BD gratuita tiene pocas conexiones disponibles
    )
    try:
        with engine.connect():
            pass
        print("[Base de Datos] Conectado exitosamente a PostgreSQL (producción).")
    except Exception as e:
        raise RuntimeError(f"[Base de Datos] No se pudo conectar a PostgreSQL: {e}") from e
else:
    # Desarrollo: se conserva el comportamiento original (fallback a SQLite local).
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with engine.connect():
            pass
        print("[Base de Datos] Conectado exitosamente a PostgreSQL.")
    except Exception as e:
        print(f"[Base de Datos] No se pudo conectar a PostgreSQL: {e}")
        print("[Base de Datos] Activando fallback a base de datos SQLite local (autometrica_db.db)...")
        sqlite_url = "sqlite:///./autometrica_db.db"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
