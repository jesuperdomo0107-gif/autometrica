from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas, exceptions

import datetime

tipos_validos = ["carro", "moto"]


def get_all(db: Session, skip=0, limit=100, cliente_id: Optional[int] = None):
    q = db.query(models.Vehiculo)
    if cliente_id is not None:
        q = q.filter(models.Vehiculo.cliente_id == cliente_id)
    return q.offset(skip).limit(limit).all()


def get_by_id(db: Session, vehiculo_id: int):
    v = db.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()
    if v is None:
        raise exceptions.not_found("Vehiculo", vehiculo_id)
    return v


def get_by_placa(db: Session, placa: str):
    v = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa.upper()).first()
    if v is None:
        raise exceptions.not_found("Vehiculo con placa", placa)
    return v


def validar_datos_vehiculo(marca: str, modelo: str, anio: int):
    if not marca or not marca.strip():
        raise exceptions.bad_request("La marca del vehículo es obligatoria.")
    if not modelo or not modelo.strip():
        raise exceptions.bad_request("El modelo del vehículo es obligatorio para registrar el carro o moto.")
    anio_actual = datetime.date.today().year
    if not anio or anio < 1950 or anio > (anio_actual + 2):
        raise exceptions.bad_request(f"El año del vehículo debe estar entre 1950 y {anio_actual + 2}.")


def create(db: Session, data: schemas.VehiculoCreate):
    if data.tipo not in tipos_validos:
        raise exceptions.valor_invalido("tipo", tipos_validos)
    
    validar_datos_vehiculo(data.marca, data.modelo, data.anio)

    placa = data.placa.upper().strip()
    existe = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa).first()
    if existe:
        raise exceptions.already_exists("placa", placa)
    
    cliente = db.query(models.Cliente).filter(models.Cliente.id == data.cliente_id).first()
    if cliente is None:
        cliente = db.query(models.Cliente).filter(models.Cliente.usuario_id == data.cliente_id).first()
    if cliente is None:
        u = db.query(models.Usuario).filter(models.Usuario.id == data.cliente_id).first()
        if u:
            cliente = models.Cliente(usuario_id=u.id)
            db.add(cliente)
            db.commit()
            db.refresh(cliente)
        else:
            raise exceptions.not_found("Cliente", data.cliente_id)

    datos = data.model_dump()
    datos["cliente_id"] = cliente.id
    datos["marca"] = datos["marca"].strip()
    datos["modelo"] = datos["modelo"].strip()
    v = models.Vehiculo(**datos)
    v.placa = placa
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


def update(db: Session, vehiculo_id: int, data: schemas.VehiculoUpdate):
    v = get_by_id(db, vehiculo_id)
    cambios = data.model_dump(exclude_unset=True)
    if "tipo" in cambios and cambios["tipo"] not in tipos_validos:
        raise exceptions.valor_invalido("tipo", tipos_validos)
    if "placa" in cambios:
        cambios["placa"] = cambios["placa"].upper()
    for campo in cambios:
        setattr(v, campo, cambios[campo])
    db.commit()
    db.refresh(v)
    return v


def delete(db: Session, vehiculo_id: int):
    v = get_by_id(db, vehiculo_id)
    db.delete(v)
    db.commit()
