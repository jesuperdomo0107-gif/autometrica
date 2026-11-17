from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class TallerBase(BaseModel):
    nombre: str
    codigo_unico: Optional[str] = None
    nit: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    logo_url: Optional[str] = None
    activo: bool = True

class TallerCreate(TallerBase):
    pass

class TallerUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo_unico: Optional[str] = None
    nit: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    logo_url: Optional[str] = None
    activo: Optional[bool] = None

class TallerOut(TallerBase):
    id: int
    fecha_creacion: datetime
    model_config = {"from_attributes": True}


class UsuarioBase(BaseModel):
    taller_id: Optional[int] = None
    nombre_completo: str
    correo: str
    rol: str
    telefono: Optional[str] = None
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    contrasena_hash: str
    codigo_taller: Optional[str] = None  # Para vincularse al taller mediante su código único
    especialidad: Optional[str] = None    # Si es mecánico

class UsuarioUpdate(BaseModel):
    taller_id: Optional[int] = None
    nombre_completo: Optional[str] = None
    correo: Optional[str] = None
    contrasena_hash: Optional[str] = None
    rol: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None
    ultimo_acceso: Optional[datetime] = None

class UsuarioOut(UsuarioBase):
    id: int
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None
    taller_nombre: Optional[str] = None
    taller_codigo: Optional[str] = None
    taller_nit: Optional[str] = None
    taller_ciudad: Optional[str] = None
    model_config = {"from_attributes": True}

# Esquema para el inicio de sesión (recibe JSON desde el frontend)
class LoginRequest(BaseModel):
    correo: str
    password: str
    taller_id: Optional[int] = None
    rol: Optional[str] = None


# Esquemas para recuperación y restablecimiento de contraseña
class SolicitarRecuperacionRequest(BaseModel):
    correo: str

class RestablecerPasswordRequest(BaseModel):
    correo: str
    token: str
    nueva_password: str


class ClienteBase(BaseModel):
    usuario_id: int
    cedula: Optional[str] = None
    es_vip: bool = False
    notas: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    cedula: Optional[str] = None
    es_vip: Optional[bool] = None
    notas: Optional[str] = None

class ClienteOut(ClienteBase):
    id: int
    model_config = {"from_attributes": True}


class VehiculoBase(BaseModel):
    cliente_id: int
    placa: str
    tipo: str = "carro"
    marca: str
    modelo: str
    anio: int
    color: Optional[str] = None
    kilometraje_actual: int = 0
    activo: bool = True

class VehiculoCreate(VehiculoBase):
    pass

class VehiculoUpdate(BaseModel):
    placa: Optional[str] = None
    tipo: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    color: Optional[str] = None
    kilometraje_actual: Optional[int] = None
    activo: Optional[bool] = None

class VehiculoOut(VehiculoBase):
    id: int
    fecha_registro: datetime
    model_config = {"from_attributes": True}


class MecanicoBase(BaseModel):
    usuario_id: int
    taller_id: int
    especialidad: Optional[str] = None
    activo: bool = True

class MecanicoCreate(MecanicoBase):
    pass

class MecanicoUpdate(BaseModel):
    taller_id: Optional[int] = None
    especialidad: Optional[str] = None
    activo: Optional[bool] = None

class MecanicoOut(MecanicoBase):
    id: int
    nombre_completo: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    taller_nombre: Optional[str] = None
    taller_codigo: Optional[str] = None
    model_config = {"from_attributes": True}


class TipoReparacionBase(BaseModel):
    taller_id: Optional[int] = None
    mecanico_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    precio_base: Decimal = Decimal("0")
    tiempo_estimado_min: int = 60

class TipoReparacionCreate(TipoReparacionBase):
    pass

class TipoReparacionUpdate(BaseModel):
    taller_id: Optional[int] = None
    mecanico_id: Optional[int] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_base: Optional[Decimal] = None
    tiempo_estimado_min: Optional[int] = None

class TipoReparacionOut(TipoReparacionBase):
    id: int
    mecanico_nombre: Optional[str] = None
    mecanico_especialidad: Optional[str] = None
    model_config = {"from_attributes": True}
    model_config = {"from_attributes": True}


class OrdenServicioBase(BaseModel):
    taller_id: int
    vehiculo_id: int
    cliente_id: int
    mecanico_id: Optional[int] = None
    tipo_reparacion_id: Optional[int] = None
    numero_orden: str
    estado: str = "Recibido"
    descripcion_problema: Optional[str] = None
    diagnostico_tecnico: Optional[str] = None
    costo_estimado: Optional[Decimal] = None
    costo_final: Optional[Decimal] = None
    kilometraje_ingreso: Optional[int] = None
    es_urgente: bool = False
    fecha_estimada_entrega: Optional[date] = None
    fecha_finalizacion: Optional[datetime] = None
    calificacion: Optional[int] = None
    comentario_cliente: Optional[str] = None
    garantia_dias: Optional[int] = 0
    garantia_vencimiento: Optional[date] = None
    tiempo_inicio: Optional[datetime] = None
    tiempo_fin: Optional[datetime] = None
    tiempo_total_minutos: Optional[int] = 0
    fotos_urls: Optional[str] = None

class OrdenServicioCreate(OrdenServicioBase):
    pass

class OrdenServicioUpdate(BaseModel):
    mecanico_id: Optional[int] = None
    tipo_reparacion_id: Optional[int] = None
    estado: Optional[str] = None
    descripcion_problema: Optional[str] = None
    diagnostico_tecnico: Optional[str] = None
    costo_estimado: Optional[Decimal] = None
    costo_final: Optional[Decimal] = None
    kilometraje_ingreso: Optional[int] = None
    es_urgente: Optional[bool] = None
    fecha_estimada_entrega: Optional[date] = None
    fecha_finalizacion: Optional[datetime] = None
    calificacion: Optional[int] = None
    comentario_cliente: Optional[str] = None
    garantia_dias: Optional[int] = None
    garantia_vencimiento: Optional[date] = None
    tiempo_inicio: Optional[datetime] = None
    tiempo_fin: Optional[datetime] = None
    tiempo_total_minutos: Optional[int] = None
    fotos_urls: Optional[str] = None

class OrdenServicioOut(OrdenServicioBase):
    id: int
    fecha_ingreso: datetime
    model_config = {"from_attributes": True}


class RepuestoOrdenBase(BaseModel):
    orden_id: int
    nombre_pieza: str
    cantidad: int = 1
    precio_unitario: Decimal

class RepuestoOrdenCreate(RepuestoOrdenBase):
    pass

class RepuestoOrdenUpdate(BaseModel):
    nombre_pieza: Optional[str] = None
    cantidad: Optional[int] = None
    precio_unitario: Optional[Decimal] = None

class RepuestoOrdenOut(RepuestoOrdenBase):
    id: int
    model_config = {"from_attributes": True}


class HistorialEstadoBase(BaseModel):
    orden_id: int
    usuario_id: Optional[int] = None
    estado_anterior: Optional[str] = None
    estado_nuevo: str
    observacion: Optional[str] = None

class HistorialEstadoCreate(HistorialEstadoBase):
    pass

class HistorialEstadoUpdate(BaseModel):
    observacion: Optional[str] = None

class HistorialEstadoOut(HistorialEstadoBase):
    id: int
    fecha_cambio: datetime
    model_config = {"from_attributes": True}


class MensajeBase(BaseModel):
    taller_id: int
    orden_id: Optional[int] = None
    remitente_id: int
    asunto: Optional[str] = None
    contenido: str
    leido: bool = False

class MensajeCreate(MensajeBase):
    pass

class MensajeUpdate(BaseModel):
    leido: Optional[bool] = None
    asunto: Optional[str] = None
    contenido: Optional[str] = None

class MensajeOut(MensajeBase):
    id: int
    fecha_envio: datetime
    model_config = {"from_attributes": True}


class ProximoServicioBase(BaseModel):
    vehiculo_id: int
    taller_id: int
    descripcion: str
    kilometraje_sugerido: Optional[int] = None
    fecha_sugerida: Optional[date] = None
    completado: bool = False

class ProximoServicioCreate(ProximoServicioBase):
    pass

class ProximoServicioUpdate(BaseModel):
    descripcion: Optional[str] = None
    kilometraje_sugerido: Optional[int] = None
    fecha_sugerida: Optional[date] = None
    completado: Optional[bool] = None

class ProximoServicioOut(ProximoServicioBase):
    id: int
    fecha_creacion: datetime
    model_config = {"from_attributes": True}


class ReporteIngresoBase(BaseModel):
    taller_id: int
    anio: int
    mes: int
    total_ingresos: Decimal = Decimal("0")
    total_ordenes: int = 0
    tiempo_promedio_horas: Optional[Decimal] = None
    satisfaccion_promedio: Optional[Decimal] = None

class ReporteIngresoCreate(ReporteIngresoBase):
    pass

class ReporteIngresoUpdate(BaseModel):
    total_ingresos: Optional[Decimal] = None
    total_ordenes: Optional[int] = None
    tiempo_promedio_horas: Optional[Decimal] = None
    satisfaccion_promedio: Optional[Decimal] = None

class ReporteIngresoOut(ReporteIngresoBase):
    id: int
    fecha_calculo: datetime
    model_config = {"from_attributes": True}


class ContactoWebBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    correo: str
    asunto: Optional[str] = None
    mensaje: str
    atendido: bool = False

class ContactoWebCreate(ContactoWebBase):
    pass

class ContactoWebUpdate(BaseModel):
    atendido: Optional[bool] = None
    asunto: Optional[str] = None

class ContactoWebOut(ContactoWebBase):
    id: int
    fecha: datetime
    model_config = {"from_attributes": True}


class CitaBase(BaseModel):
    taller_id: int = 1
    cliente_id: int
    vehiculo_id: int
    fecha_cita: date
    hora_cita: str
    motivo: Optional[str] = None
    estado: str = "Pendiente"

class CitaCreate(CitaBase):
    pass

class CitaUpdate(BaseModel):
    taller_id: Optional[int] = None
    cliente_id: Optional[int] = None
    vehiculo_id: Optional[int] = None
    fecha_cita: Optional[date] = None
    hora_cita: Optional[str] = None
    motivo: Optional[str] = None
    estado: Optional[str] = None

class CitaOut(CitaBase):
    id: int
    fecha_creacion: datetime
    model_config = {"from_attributes": True}


class InventarioItemBase(BaseModel):
    taller_id: int = 1
    codigo: Optional[str] = None
    nombre: str
    categoria: Optional[str] = "General"
    cantidad_stock: int = 0
    stock_minimo: int = 5
    precio_compra: Decimal = Decimal("0")
    precio_venta: Decimal = Decimal("0")
    activo: bool = True

class InventarioItemCreate(InventarioItemBase):
    pass

class InventarioItemUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    cantidad_stock: Optional[int] = None
    stock_minimo: Optional[int] = None
    precio_compra: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    activo: Optional[bool] = None

class InventarioItemOut(InventarioItemBase):
    id: int
    model_config = {"from_attributes": True}


class ItemPresupuestoBase(BaseModel):
    nombre_pieza: str
    cantidad: int = 1
    precio_unitario: Decimal
    precio_total: Decimal = Decimal("0")

class ItemPresupuestoCreate(BaseModel):
    nombre_pieza: str
    cantidad: int = 1
    precio_unitario: Decimal

class ItemPresupuestoOut(ItemPresupuestoBase):
    id: int
    presupuesto_id: int
    model_config = {"from_attributes": True}


class PresupuestoBase(BaseModel):
    orden_id: Optional[int] = None
    taller_id: Optional[int] = None
    vehiculo_id: Optional[int] = None
    cliente_id: Optional[int] = None
    mecanico_id: Optional[int] = None
    subtotal_mano_obra: Decimal = Decimal("0")
    subtotal_piezas: Decimal = Decimal("0")
    descuento_porcentaje: Decimal = Decimal("0")
    descuento_monto: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
    estado: str = "Pendiente"
    observaciones: Optional[str] = None

class PresupuestoCreate(PresupuestoBase):
    items: Optional[List[ItemPresupuestoCreate]] = []

class PresupuestoUpdate(BaseModel):
    subtotal_mano_obra: Optional[Decimal] = None
    subtotal_piezas: Optional[Decimal] = None
    descuento_porcentaje: Optional[Decimal] = None
    descuento_monto: Optional[Decimal] = None
    total: Optional[Decimal] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None

class PresupuestoOut(PresupuestoBase):
    id: int
    fecha_creacion: datetime
    items: List[ItemPresupuestoOut] = []
    vehiculo_placa: Optional[str] = None
    vehiculo_modelo: Optional[str] = None
    vehiculo_marca: Optional[str] = None
    vehiculo_anio: Optional[int] = None
    cliente_nombre: Optional[str] = None
    mecanico_nombre: Optional[str] = None
    taller_nombre: Optional[str] = None
    taller_codigo: Optional[str] = None
    model_config = {"from_attributes": True}


class FacturaBase(BaseModel):
    orden_id: int
    numero_factura: str
    subtotal: Decimal
    descuento: Decimal = Decimal("0")
    iva_monto: Decimal
    total_pagar: Decimal
    estado: str = "Pendiente"

class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    estado: Optional[str] = None
    descuento: Optional[Decimal] = None
    total_pagar: Optional[Decimal] = None

class FacturaOut(FacturaBase):
    id: int
    fecha_emision: datetime
    model_config = {"from_attributes": True}


class PagoBase(BaseModel):
    factura_id: int
    monto_pagado: Decimal
    metodo_pago: str  # Efectivo, Tarjeta, Transferencia
    referencia_transaccion: Optional[str] = None
    notas: Optional[str] = None

class PagoCreate(PagoBase):
    pass

class PagoOut(PagoBase):
    id: int
    fecha_pago: datetime
    model_config = {"from_attributes": True}


class ProveedorBase(BaseModel):
    taller_id: int = 1
    nombre: str
    nit: Optional[str] = None
    contacto_nombre: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = True

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    nit: Optional[str] = None
    contacto_nombre: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None

class ProveedorOut(ProveedorBase):
    id: int
    model_config = {"from_attributes": True}


class AuditLogBase(BaseModel):
    taller_id: int = 1
    usuario_nombre: Optional[str] = "Sistema"
    accion: str
    entidad: Optional[str] = None
    detalle: Optional[str] = None
    ip_origen: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogOut(AuditLogBase):
    id: int
    timestamp: datetime
    model_config = {"from_attributes": True}

