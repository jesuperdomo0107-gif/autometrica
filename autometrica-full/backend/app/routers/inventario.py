from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/inventario", tags=["Inventario"])


@router.get("/", response_model=List[schemas.InventarioItemOut])
def listar_inventario(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.InventarioItem).filter(models.InventarioItem.activo == True).offset(skip).limit(limit).all()


@router.get("/alertas", response_model=List[schemas.InventarioItemOut])
def alertas_stock_minimo(db: Session = Depends(get_db)):
    return db.query(models.InventarioItem).filter(
        models.InventarioItem.activo == True,
        models.InventarioItem.cantidad_stock <= models.InventarioItem.stock_minimo
    ).all()


@router.post("/", response_model=schemas.InventarioItemOut, status_code=status.HTTP_201_CREATED)
def crear_item(data: schemas.InventarioItemCreate, db: Session = Depends(get_db)):
    item = models.InventarioItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=schemas.InventarioItemOut)
def actualizar_item(item_id: int, data: schemas.InventarioItemUpdate, db: Session = Depends(get_db)):
    item = db.query(models.InventarioItem).filter(models.InventarioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.InventarioItem).filter(models.InventarioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    item.activo = False
    db.commit()
