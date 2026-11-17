import random
import string
from sqlalchemy.orm import Session
from app import models, schemas, exceptions


def generar_codigo_unico_taller(db: Session) -> str:
    """Genera un código único irrepetible para el taller en formato TLR-XXXX"""
    while True:
        sufijo = "".join(random.choices(string.digits, k=4))
        codigo = f"TLR-{sufijo}"
        existe = db.query(models.Taller).filter(models.Taller.codigo_unico == codigo).first()
        if not existe:
            return codigo


def get_all(db: Session, skip=0, limit=100):
    talleres = db.query(models.Taller).offset(skip).limit(limit).all()
    return talleres


def get_by_id(db: Session, taller_id: int):
    taller = db.query(models.Taller).filter(models.Taller.id == taller_id).first()
    if taller is None:
        raise exceptions.not_found("Taller", taller_id)
    return taller


def get_by_codigo(db: Session, codigo_unico: str):
    codigo_limpio = codigo_unico.strip().upper()
    taller = db.query(models.Taller).filter(models.Taller.codigo_unico == codigo_limpio).first()
    if taller is None:
        # Fallback de búsqueda por NIT
        taller = db.query(models.Taller).filter(models.Taller.nit == codigo_limpio).first()
    if taller is None:
        raise exceptions.not_found("Taller con código o NIT", codigo_unico)
    return taller


def create(db: Session, data: schemas.TallerCreate):
    datos = data.model_dump()

    # Validar correo único si viene provisto
    if datos.get("correo") and datos["correo"].strip():
        datos["correo"] = datos["correo"].strip().lower()
        existe_correo = db.query(models.Taller).filter(models.Taller.correo == datos["correo"]).first()
        if existe_correo:
            raise exceptions.already_exists("correo", datos["correo"])
    else:
        datos["correo"] = None

    # Validar NIT único si viene provisto
    if datos.get("nit") and datos["nit"].strip():
        datos["nit"] = datos["nit"].strip()
        existe_nit = db.query(models.Taller).filter(models.Taller.nit == datos["nit"]).first()
        if existe_nit:
            raise exceptions.already_exists("NIT", datos["nit"])
    else:
        datos["nit"] = None

    # Asignar o validar código único irrepetible
    if not datos.get("codigo_unico") or not datos["codigo_unico"].strip():
        datos["codigo_unico"] = generar_codigo_unico_taller(db)
    else:
        datos["codigo_unico"] = datos["codigo_unico"].strip().upper()
        existe_cod = db.query(models.Taller).filter(models.Taller.codigo_unico == datos["codigo_unico"]).first()
        if existe_cod:
            raise exceptions.already_exists("Código único de taller", datos["codigo_unico"])

    nuevo = models.Taller(**datos)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(db: Session, taller_id: int, data: schemas.TallerUpdate):
    taller = get_by_id(db, taller_id)
    cambios = data.model_dump(exclude_unset=True)

    if "codigo_unico" in cambios and cambios["codigo_unico"]:
        cambios["codigo_unico"] = cambios["codigo_unico"].strip().upper()
        existe_cod = db.query(models.Taller).filter(
            models.Taller.codigo_unico == cambios["codigo_unico"],
            models.Taller.id != taller_id
        ).first()
        if existe_cod:
            raise exceptions.already_exists("Código único de taller", cambios["codigo_unico"])

    if "nit" in cambios and cambios["nit"]:
        cambios["nit"] = cambios["nit"].strip()
        existe_nit = db.query(models.Taller).filter(
            models.Taller.nit == cambios["nit"],
            models.Taller.id != taller_id
        ).first()
        if existe_nit:
            raise exceptions.already_exists("NIT", cambios["nit"])

    for key in cambios:
        setattr(taller, key, cambios[key])
    db.commit()
    db.refresh(taller)
    return taller


def delete(db: Session, taller_id: int):
    taller = get_by_id(db, taller_id)
    db.delete(taller)
    db.commit()
