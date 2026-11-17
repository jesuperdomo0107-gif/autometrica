from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/audit-logs", tags=["Auditoría"])


@router.get("/", response_model=List[schemas.AuditLogOut])
def listar_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.AuditLogOut, status_code=status.HTTP_201_CREATED)
def registrar_log(data: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    log = models.AuditLog(**data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
