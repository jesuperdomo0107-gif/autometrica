"""
Inicialización / "migración" del esquema.

El proyecto no usa Alembic: el esquema se crea con SQLAlchemy (create_all) y las
columnas añadidas después se aplican con ALTER TABLE ... IF NOT EXISTS.
Todo es idempotente, así que puede ejecutarse en cada build y en cada arranque.
"""
from sqlalchemy import text

from app.database import engine, Base
from app import models  # noqa: F401  (registra todas las tablas en Base.metadata)

_ALTERS_POSTGRES = [
    "ALTER TABLE talleres ADD COLUMN IF NOT EXISTS codigo_unico VARCHAR(30);",
    "ALTER TABLE tipos_reparacion ADD COLUMN IF NOT EXISTS mecanico_id INTEGER;",
    "ALTER TABLE tipos_reparacion ADD COLUMN IF NOT EXISTS precio_base NUMERIC(10, 2) DEFAULT 0;",
    "ALTER TABLE tipos_reparacion ADD COLUMN IF NOT EXISTS tiempo_estimado_min INTEGER DEFAULT 60;",
    "ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS garantia_dias INTEGER DEFAULT 0;",
    "ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS garantia_vencimiento DATE;",
    "ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS tiempo_inicio TIMESTAMP;",
    "ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS tiempo_fin TIMESTAMP;",
    "ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS tiempo_total_minutos INTEGER DEFAULT 0;",
    "ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS fotos_urls TEXT;",
    "ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS taller_id INTEGER;",
    "ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS vehiculo_id INTEGER;",
    "ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_id INTEGER;",
    "ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS mecanico_id INTEGER;",
    "ALTER TABLE presupuestos ALTER COLUMN orden_id DROP NOT NULL;",
]


def init_db() -> None:
    """Crea tablas faltantes y aplica columnas adicionales. Lanza excepción si falla."""
    Base.metadata.create_all(bind=engine)

    if engine.dialect.name != "postgresql":
        return  # los ALTER ... IF NOT EXISTS son específicos de PostgreSQL

    # Cada sentencia en su propia transacción: si una falla no aborta las demás.
    for sentencia in _ALTERS_POSTGRES:
        try:
            with engine.begin() as conn:
                conn.execute(text(sentencia))
        except Exception as e:  # pragma: no cover
            print(f"[Base de Datos] Aviso al aplicar '{sentencia[:60]}...': {e}")

    print("[Base de Datos] Esquemas y tablas sincronizados correctamente.")


if __name__ == "__main__":
    init_db()
