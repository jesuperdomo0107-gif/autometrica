from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/facturas", tags=["Facturas"])


@router.get("/", response_model=List[schemas.FacturaOut])
def listar_facturas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Factura).offset(skip).limit(limit).all()


@router.get("/orden/{orden_id}", response_model=List[schemas.FacturaOut])
def facturas_por_orden(orden_id: int, db: Session = Depends(get_db)):
    return db.query(models.Factura).filter(models.Factura.orden_id == orden_id).all()


@router.post("/", response_model=schemas.FacturaOut, status_code=status.HTTP_201_CREATED)
def crear_factura(data: schemas.FacturaCreate, db: Session = Depends(get_db)):
    factura = models.Factura(**data.model_dump())
    db.add(factura)
    db.commit()
    db.refresh(factura)
    return factura


@router.put("/{factura_id}", response_model=schemas.FacturaOut)
def actualizar_factura(factura_id: int, data: schemas.FacturaUpdate, db: Session = Depends(get_db)):
    factura = db.query(models.Factura).filter(models.Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(factura, key, value)
    db.commit()
    db.refresh(factura)
    return factura


# ── Registrar Pago Manual (HU17 - Opción 2) ────────────────
@router.post("/{factura_id}/pagos", response_model=schemas.PagoOut, status_code=status.HTTP_201_CREATED)
def registrar_pago_manual(factura_id: int, data: schemas.PagoCreate, db: Session = Depends(get_db)):
    factura = db.query(models.Factura).filter(models.Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    pago = models.Pago(**data.model_dump())
    db.add(pago)
    
    # Actualizar estado de la factura a Pagada
    factura.estado = "Pagada"
    db.commit()
    db.refresh(pago)
    return pago


@router.get("/{factura_id}/pagos", response_model=List[schemas.PagoOut])
def pagos_por_factura(factura_id: int, db: Session = Depends(get_db)):
    return db.query(models.Pago).filter(models.Pago.factura_id == factura_id).all()
