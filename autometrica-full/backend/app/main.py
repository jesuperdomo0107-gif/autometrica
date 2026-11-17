from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import settings

# En producción la documentación interactiva queda oculta salvo DEBUG=true.
_docs_activos = (not settings.is_production) or settings.DEBUG

app = FastAPI(
    title="Autometrica API",
    version="1.0.0",
    docs_url="/docs" if _docs_activos else None,
    redoc_url="/redoc" if _docs_activos else None,
    openapi_url="/openapi.json" if _docs_activos else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.database import engine, Base
from app.routers import (
    talleres,
    usuarios,
    clientes,
    vehiculos,
    mecanicos,
    tipos_reparacion,
    ordenes,
    repuestos,
    historial_estados,
    mensajes,
    proximos_servicios,
    reportes_ingresos,
    contactos_web,
    citas,
    inventario,
    presupuestos,
    facturas,
    proveedores,
    audit_logs,
)

# Crear tablas si no existen y aplicar columnas adicionales (idempotente)
from app import models
from app.db_init import init_db

try:
    init_db()
except Exception as e:
    print(f"[Advertencia] No se pudo sincronizar el esquema al iniciar: {e}")

PREFIX = "/api/v1"

app.include_router(talleres.router, prefix=PREFIX)
app.include_router(usuarios.router, prefix=PREFIX)
app.include_router(clientes.router, prefix=PREFIX)
app.include_router(vehiculos.router, prefix=PREFIX)
app.include_router(mecanicos.router, prefix=PREFIX)
app.include_router(tipos_reparacion.router, prefix=PREFIX)
app.include_router(ordenes.router, prefix=PREFIX)
app.include_router(repuestos.router, prefix=PREFIX)
app.include_router(historial_estados.router, prefix=PREFIX)
app.include_router(mensajes.router, prefix=PREFIX)
app.include_router(proximos_servicios.router, prefix=PREFIX)
app.include_router(reportes_ingresos.router, prefix=PREFIX)
app.include_router(contactos_web.router, prefix=PREFIX)
app.include_router(citas.router, prefix=PREFIX)
app.include_router(inventario.router, prefix=PREFIX)
app.include_router(presupuestos.router, prefix=PREFIX)
app.include_router(facturas.router, prefix=PREFIX)
app.include_router(proveedores.router, prefix=PREFIX)
app.include_router(audit_logs.router, prefix=PREFIX)


@app.get("/")
def root():
    return {"mensaje": "Autometrica API funcionando", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


def limpiar_base_datos():
    """Limpia completamente todas las tablas de la base de datos para iniciar pruebas limpias desde cero."""
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        # Eliminar registros en orden de dependencias
        for modelo in [
            models.ItemPresupuesto,
            models.Presupuesto,
            models.Pago,
            models.Factura,
            models.RepuestoOrden,
            models.HistorialEstado,
            models.Mensaje,
            models.ProximoServicio,
            models.Cita,
            models.OrdenCompra,
            models.OrdenServicio,
            models.TipoReparacion,
            models.InventarioItem,
            models.Proveedor,
            models.Vehiculo,
            models.Cliente,
            models.Mecanico,
            models.AuditLog,
            models.ContactoWeb,
            models.Usuario,
        ]:
            try:
                db.query(modelo).delete()
            except Exception:
                pass
        db.commit()
        db.close()
        return {"mensaje": "Base de datos limpiada exitosamente. Se preservaron los talleres y se eliminaron todos los usuarios, clientes, vehículos y órdenes."}
    except Exception as e:
        return {"error": f"Error al limpiar la base de datos: {e}"}


# ⚠️ Endpoint destructivo y SIN autenticación: solo se registra fuera de producción.
if not settings.is_production:
    app.post(f"{PREFIX}/sistema/limpiar-base-datos")(limpiar_base_datos)
