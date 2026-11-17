from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/citas", tags=["Citas"])


@router.get("/", response_model=List[schemas.CitaOut])
def listar_citas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Cita).order_by(models.Cita.fecha_cita.desc(), models.Cita.id.desc()).offset(skip).limit(limit).all()


@router.get("/cliente/{cliente_id}", response_model=List[schemas.CitaOut])
def citas_por_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cli = db.query(models.Cliente).filter(
        (models.Cliente.id == cliente_id) | (models.Cliente.usuario_id == cliente_id)
    ).first()
    if cli:
        return db.query(models.Cita).filter(
            (models.Cita.cliente_id == cli.id) | (models.Cita.cliente_id == cliente_id)
        ).order_by(models.Cita.fecha_cita.desc(), models.Cita.id.desc()).all()
    return db.query(models.Cita).filter(models.Cita.cliente_id == cliente_id).order_by(models.Cita.fecha_cita.desc(), models.Cita.id.desc()).all()


@router.post("/", response_model=schemas.CitaOut, status_code=status.HTTP_201_CREATED)
def crear_cita(data: schemas.CitaCreate, db: Session = Depends(get_db)):
    datos = data.model_dump()
    
    # 1. Resolver cliente_id
    cli = db.query(models.Cliente).filter(models.Cliente.id == data.cliente_id).first()
    if not cli:
        cli = db.query(models.Cliente).filter(models.Cliente.usuario_id == data.cliente_id).first()
    if not cli:
        u = db.query(models.Usuario).filter(models.Usuario.id == data.cliente_id).first()
        if u:
            cli = models.Cliente(usuario_id=u.id)
            db.add(cli)
            db.commit()
            db.refresh(cli)
        else:
            cli = db.query(models.Cliente).first()
    if cli:
        datos["cliente_id"] = cli.id

    # 2. Resolver vehiculo_id
    veh = db.query(models.Vehiculo).filter(models.Vehiculo.id == data.vehiculo_id).first()
    if not veh and cli:
        veh = db.query(models.Vehiculo).filter(models.Vehiculo.cliente_id == cli.id).first()
    if not veh:
        veh = db.query(models.Vehiculo).first()
    if not veh:
        veh = models.Vehiculo(
            cliente_id=cli.id if cli else 1,
            placa="ABC-001",
            tipo="carro",
            marca="Vehículo",
            modelo="Principal",
            anio=2024,
            kilometraje_actual=10000
        )
        db.add(veh)
        db.commit()
        db.refresh(veh)
    if veh:
        datos["vehiculo_id"] = veh.id

    if not datos.get("taller_id"):
        datos["taller_id"] = 1

    cita = models.Cita(**datos)
    db.add(cita)
    db.commit()
    db.refresh(cita)
    return cita


@router.put("/{cita_id}", response_model=schemas.CitaOut)
def actualizar_cita(cita_id: int, data: schemas.CitaUpdate, db: Session = Depends(get_db)):
    cita = db.query(models.Cita).filter(models.Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(cita, key, value)
    db.commit()
    db.refresh(cita)
    return cita


@router.delete("/{cita_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cita(cita_id: int, db: Session = Depends(get_db)):
    cita = db.query(models.Cita).filter(models.Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    db.delete(cita)
    db.commit()
