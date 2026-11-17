"""
Crea el superusuario (rol 'admin') a partir de variables de entorno.
Se ejecuta desde build.sh. Es idempotente: si el correo ya existe no lo duplica.

Variables:
  ADMIN_EMAIL           correo del administrador            (obligatoria)
  ADMIN_PASSWORD        contraseña segura                   (obligatoria)
  ADMIN_NAME            nombre completo (def. "Administrador")
  ADMIN_PHONE           teléfono (opcional)
  ADMIN_RESET_PASSWORD  "true" para sobrescribir la contraseña de un admin ya existente

Reglas de contraseña del sistema: mínimo 8 caracteres, mayúscula, minúscula
y un carácter especial.
"""
import os
import sys

from app.database import SessionLocal
from app import models, security


def main() -> int:
    correo = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")
    nombre = os.getenv("ADMIN_NAME", "").strip() or "Administrador"
    telefono = os.getenv("ADMIN_PHONE", "").strip() or None
    reset = os.getenv("ADMIN_RESET_PASSWORD", "false").strip().lower() in ("1", "true", "yes", "si", "sí")

    if not correo or not password:
        print("[create_admin] ADMIN_EMAIL / ADMIN_PASSWORD no definidas: se omite la creación del superusuario.")
        return 0

    ok, msg = security.validar_complejidad_password(password)
    if not ok:
        print(f"[create_admin] ERROR: ADMIN_PASSWORD no es segura: {msg}")
        return 1

    db = SessionLocal()
    try:
        existente = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
        if existente:
            if existente.rol != "admin":
                print(f"[create_admin] AVISO: {correo} ya existe con rol '{existente.rol}'. No se modifica.")
                return 0
            if reset:
                existente.contrasena_hash = security.hash_password(password)
                existente.activo = True
                db.commit()
                print(f"[create_admin] Contraseña del administrador {correo} actualizada.")
            else:
                print(f"[create_admin] El administrador {correo} ya existe. Sin cambios.")
            return 0

        admin = models.Usuario(
            nombre_completo=nombre,
            correo=correo,
            contrasena_hash=security.hash_password(password),
            rol="admin",
            telefono=telefono,
            activo=True,
        )
        db.add(admin)
        db.commit()
        print(f"[create_admin] Superusuario creado: {correo}")
        return 0
    except Exception as e:
        db.rollback()
        print(f"[create_admin] ERROR creando el superusuario: {e}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
