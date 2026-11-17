from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/presupuestos", tags=["Presupuestos"])


def enriquecer_presupuesto_out(p: models.Presupuesto) -> schemas.PresupuestoOut:
    out = schemas.PresupuestoOut.model_validate(p)
    # Cargar ítems
    if p.items:
        out.items = [schemas.ItemPresupuestoOut.model_validate(it) for it in p.items]
    else:
        out.items = []

    # Cargar datos del vehículo
    veh = p.vehiculo or (p.orden.vehiculo if p.orden else None)
    if veh:
        out.vehiculo_placa = veh.placa
        out.vehiculo_marca = veh.marca
        out.vehiculo_modelo = veh.modelo
        out.vehiculo_anio = veh.anio

    # Cargar datos del cliente
    cli = p.cliente or (p.orden.cliente if p.orden else None)
    if cli and cli.usuario:
        out.cliente_nombre = cli.usuario.nombre_completo

    # Cargar datos del mecánico
    mec = p.mecanico or (p.orden.mecanico if p.orden else None)
    if mec and mec.usuario:
        out.mecanico_nombre = mec.usuario.nombre_completo

    # Cargar datos del taller
    tal = p.taller or (p.orden.taller if p.orden else None)
    if tal:
        out.taller_nombre = tal.nombre
        out.taller_codigo = tal.codigo_unico

    return out


@router.get("/", response_model=List[schemas.PresupuestoOut])
def listar_presupuestos(
    skip: int = 0,
    limit: int = 100,
    taller_id: Optional[int] = None,
    cliente_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Presupuesto)
    if taller_id is not None:
        query = query.filter(models.Presupuesto.taller_id == taller_id)
    if cliente_id is not None:
        query = query.filter(models.Presupuesto.cliente_id == cliente_id)
    presupuestos = query.order_by(models.Presupuesto.id.desc()).offset(skip).limit(limit).all()
    return [enriquecer_presupuesto_out(p) for p in presupuestos]


@router.get("/orden/{orden_id}", response_model=List[schemas.PresupuestoOut])
def presupuestos_por_orden(orden_id: int, db: Session = Depends(get_db)):
    presupuestos = db.query(models.Presupuesto).filter(models.Presupuesto.orden_id == orden_id).all()
    return [enriquecer_presupuesto_out(p) for p in presupuestos]


@router.get("/{presupuesto_id}", response_model=schemas.PresupuestoOut)
def obtener_presupuesto(presupuesto_id: int, db: Session = Depends(get_db)):
    presupuesto = db.query(models.Presupuesto).filter(models.Presupuesto.id == presupuesto_id).first()
    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return enriquecer_presupuesto_out(presupuesto)


@router.post("/", response_model=schemas.PresupuestoOut, status_code=status.HTTP_201_CREATED)
def crear_presupuesto(data: schemas.PresupuestoCreate, db: Session = Depends(get_db)):
    datos = data.model_dump()
    items_data = datos.pop("items", []) or []

    # Calcular subtotal de piezas a partir de los ítems
    subtotal_piezas = Decimal("0")
    for item in items_data:
        cant = item.get("cantidad", 1)
        prec = Decimal(str(item.get("precio_unitario", 0)))
        subtotal_piezas += (prec * cant)

    if subtotal_piezas > 0:
        datos["subtotal_piezas"] = subtotal_piezas

    # Si se asocia a una orden existente, inferir cliente, vehículo, taller y mecánico
    if datos.get("orden_id"):
        orden = db.query(models.OrdenServicio).filter(models.OrdenServicio.id == datos["orden_id"]).first()
        if orden:
            if not datos.get("taller_id"):
                datos["taller_id"] = orden.taller_id
            if not datos.get("vehiculo_id"):
                datos["vehiculo_id"] = orden.vehiculo_id
            if not datos.get("cliente_id"):
                datos["cliente_id"] = orden.cliente_id
            if not datos.get("mecanico_id"):
                datos["mecanico_id"] = orden.mecanico_id

    # Si no hay orden pero hay vehiculo_id, inferir el cliente dueño del vehículo
    if datos.get("vehiculo_id") and not datos.get("cliente_id"):
        veh = db.query(models.Vehiculo).filter(models.Vehiculo.id == datos["vehiculo_id"]).first()
        if veh and veh.cliente_id:
            datos["cliente_id"] = veh.cliente_id

    # Asignar un taller por defecto si no viene especificado
    if not datos.get("taller_id"):
        primer_taller = db.query(models.Taller).first()
        if primer_taller:
            datos["taller_id"] = primer_taller.id
        else:
            datos["taller_id"] = 1

    # Calcular total si no viene provisto
    sub_mo = Decimal(str(datos.get("subtotal_mano_obra", 0)))
    sub_p = Decimal(str(datos.get("subtotal_piezas", 0)))
    subtotal = sub_mo + sub_p
    desc_pct = Decimal(str(datos.get("descuento_porcentaje", 0)))
    desc_monto = (subtotal * desc_pct) / Decimal("100")
    total_calculado = subtotal - desc_monto

    datos["descuento_monto"] = desc_monto
    datos["total"] = total_calculado

    presupuesto = models.Presupuesto(**datos)
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)

    # Insertar los ítems detallados de partes/repuestos
    for item in items_data:
        cant = item.get("cantidad", 1)
        prec = Decimal(str(item.get("precio_unitario", 0)))
        it_obj = models.ItemPresupuesto(
            presupuesto_id=presupuesto.id,
            nombre_pieza=item.get("nombre_pieza", "Repuesto"),
            cantidad=cant,
            precio_unitario=prec,
            precio_total=prec * cant
        )
        db.add(it_obj)

    db.commit()
    db.refresh(presupuesto)

    # Notificar internamente al cliente para que vea la cotización en su portal
    try:
        if presupuesto.cliente_id:
            cli = db.query(models.Cliente).filter(models.Cliente.id == presupuesto.cliente_id).first()
            if cli and cli.usuario:
                veh_info = f"para su vehículo"
                if presupuesto.vehiculo:
                    veh_info = f"para su vehículo {presupuesto.vehiculo.placa} ({presupuesto.vehiculo.marca} {presupuesto.vehiculo.modelo})"
                
                # Buscar remitente del taller
                remitente = db.query(models.Usuario).filter(models.Usuario.taller_id == presupuesto.taller_id).first()
                remitente_id = remitente.id if remitente else cli.usuario.id
                
                notificacion = models.Mensaje(
                    taller_id=presupuesto.taller_id or 1,
                    orden_id=presupuesto.orden_id,
                    remitente_id=remitente_id,
                    asunto=f"Nueva Cotización #{presupuesto.id} generada",
                    contenido=f"Hola {cli.usuario.nombre_completo}, hemos emitido una cotización detallada de repuestos y mano de obra {veh_info} por un valor total de ${float(presupuesto.total):,.0f} COP. Por favor ingresa a tu Portal para revisarla y aprobarla.",
                    leido=False
                )
                db.add(notificacion)
                db.commit()
    except Exception as e:
        print(f"[Aviso] No se pudo registrar mensaje de cotización: {e}")

    return enriquecer_presupuesto_out(presupuesto)


@router.put("/{presupuesto_id}", response_model=schemas.PresupuestoOut)
def actualizar_presupuesto(presupuesto_id: int, data: schemas.PresupuestoUpdate, db: Session = Depends(get_db)):
    presupuesto = db.query(models.Presupuesto).filter(models.Presupuesto.id == presupuesto_id).first()
    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    cambios = data.model_dump(exclude_unset=True)
    for key, value in cambios.items():
        setattr(presupuesto, key, value)

    # Sincronización automática con la orden de servicio asociada
    if presupuesto.orden_id:
        orden = db.query(models.OrdenServicio).filter(models.OrdenServicio.id == presupuesto.orden_id).first()
        if orden:
            if presupuesto.estado == "Aprobado":
                orden.costo_estimado = presupuesto.total
                if orden.estado in ["Recibido", "En Diagnóstico"]:
                    orden.estado = "En Reparación"
            elif presupuesto.estado == "Rechazado":
                pass

    db.commit()
    db.refresh(presupuesto)
    return enriquecer_presupuesto_out(presupuesto)


@router.delete("/{presupuesto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_presupuesto(presupuesto_id: int, db: Session = Depends(get_db)):
    presupuesto = db.query(models.Presupuesto).filter(models.Presupuesto.id == presupuesto_id).first()
    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    db.delete(presupuesto)
    db.commit()

