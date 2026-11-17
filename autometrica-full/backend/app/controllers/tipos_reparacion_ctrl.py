from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas, exceptions


def enriquecer_tipo_out(t: models.TipoReparacion) -> schemas.TipoReparacionOut:
    out = schemas.TipoReparacionOut.model_validate(t)
    if t.mecanico_responsable and t.mecanico_responsable.usuario:
        out.mecanico_nombre = t.mecanico_responsable.usuario.nombre_completo
        out.mecanico_especialidad = t.mecanico_responsable.especialidad
    return out


def get_all(db: Session, skip=0, limit=100, taller_id: Optional[int] = None):
    q = db.query(models.TipoReparacion)
    if taller_id is not None:
        q = q.filter(
            (models.TipoReparacion.taller_id == taller_id) |
            (models.TipoReparacion.taller_id == None)
        )
    tipos = q.offset(skip).limit(limit).all()
    return [enriquecer_tipo_out(t) for t in tipos]


def get_by_id(db: Session, tipo_id: int):
    t = db.query(models.TipoReparacion).filter(models.TipoReparacion.id == tipo_id).first()
    if t is None:
        raise exceptions.not_found("TipoReparacion", tipo_id)
    return enriquecer_tipo_out(t)


def create(db: Session, data: schemas.TipoReparacionCreate):
    t = models.TipoReparacion(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return enriquecer_tipo_out(t)


def update(db: Session, tipo_id: int, data: schemas.TipoReparacionUpdate):
    t = db.query(models.TipoReparacion).filter(models.TipoReparacion.id == tipo_id).first()
    if t is None:
        raise exceptions.not_found("TipoReparacion", tipo_id)
    cambios = data.model_dump(exclude_unset=True)
    for campo in cambios:
        setattr(t, campo, cambios[campo])
    db.commit()
    db.refresh(t)
    return enriquecer_tipo_out(t)


def delete(db: Session, tipo_id: int):
    t = get_by_id(db, tipo_id)
    db.delete(t)
    db.commit()
