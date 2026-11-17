from sqlalchemy import (
    Column, Integer, SmallInteger, String, Text, Boolean,
    Numeric, Date, TIMESTAMP, ForeignKey, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Taller(Base):
    __tablename__ = "talleres"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    codigo_unico = Column(String(30), unique=True, index=True)  # Registro / Código Único Irrepetible
    nit = Column(String(30), unique=True, index=True)
    telefono = Column(String(30))
    correo = Column(String(100), unique=True)
    direccion = Column(String(200))
    ciudad = Column(String(80))
    logo_url = Column(Text)
    activo = Column(Boolean, nullable=False, default=True)
    fecha_creacion = Column(TIMESTAMP, nullable=False, default=func.now())

    usuarios = relationship("Usuario", back_populates="taller")
    mecanicos = relationship("Mecanico", back_populates="taller")
    tipos_reparacion = relationship("TipoReparacion", back_populates="taller")
    ordenes_servicio = relationship("OrdenServicio", back_populates="taller")
    proximos_servicios = relationship("ProximoServicio", back_populates="taller")
    reportes_ingresos = relationship("ReporteIngreso", back_populates="taller")
    mensajes = relationship("Mensaje", back_populates="taller")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id", ondelete="SET NULL"))
    nombre_completo = Column(String(150), nullable=False)
    correo = Column(String(100), nullable=False, unique=True)
    contrasena_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    telefono = Column(String(20))
    activo = Column(Boolean, nullable=False, default=True)
    fecha_registro = Column(TIMESTAMP, nullable=False, default=func.now())
    ultimo_acceso = Column(TIMESTAMP)

    __table_args__ = (
        CheckConstraint("rol IN ('admin','mecanico','cliente')", name="chk_usuario_rol"),
    )

    taller = relationship("Taller", back_populates="usuarios")
    cliente = relationship("Cliente", back_populates="usuario", uselist=False)
    mecanico = relationship("Mecanico", back_populates="usuario", uselist=False)
    historial_estados = relationship("HistorialEstado", back_populates="usuario")
    mensajes_enviados = relationship("Mensaje", back_populates="remitente")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, unique=True)
    cedula = Column(String(20), unique=True)
    es_vip = Column(Boolean, nullable=False, default=False)
    notas = Column(Text)

    usuario = relationship("Usuario", back_populates="cliente")
    vehiculos = relationship("Vehiculo", back_populates="cliente")
    ordenes_servicio = relationship("OrdenServicio", back_populates="cliente")


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    placa = Column(String(10), nullable=False, unique=True)
    tipo = Column(String(10), nullable=False, default="carro")
    marca = Column(String(50), nullable=False)
    modelo = Column(String(80), nullable=False)
    anio = Column(SmallInteger, nullable=False)
    color = Column(String(40))
    kilometraje_actual = Column(Integer, default=0)
    activo = Column(Boolean, nullable=False, default=True)
    fecha_registro = Column(TIMESTAMP, nullable=False, default=func.now())

    __table_args__ = (
        CheckConstraint("tipo IN ('carro','moto')", name="chk_vehiculo_tipo"),
    )

    cliente = relationship("Cliente", back_populates="vehiculos")
    ordenes_servicio = relationship("OrdenServicio", back_populates="vehiculo")
    proximos_servicios = relationship("ProximoServicio", back_populates="vehiculo")


class Mecanico(Base):
    __tablename__ = "mecanicos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, unique=True)
    taller_id = Column(Integer, ForeignKey("talleres.id", ondelete="CASCADE"), nullable=False)
    especialidad = Column(String(100))
    activo = Column(Boolean, nullable=False, default=True)

    usuario = relationship("Usuario", back_populates="mecanico")
    taller = relationship("Taller", back_populates="mecanicos")
    ordenes_servicio = relationship("OrdenServicio", back_populates="mecanico")
    tipos_reparacion = relationship("TipoReparacion", back_populates="mecanico_responsable")


class TipoReparacion(Base):
    __tablename__ = "tipos_reparacion"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id", ondelete="CASCADE"))
    mecanico_id = Column(Integer, ForeignKey("mecanicos.id", ondelete="SET NULL"), nullable=True)
    nombre = Column(String(80), nullable=False)
    descripcion = Column(Text)
    precio_base = Column(Numeric(10, 2), default=0)
    tiempo_estimado_min = Column(Integer, default=60)

    taller = relationship("Taller", back_populates="tipos_reparacion")
    mecanico_responsable = relationship("Mecanico", back_populates="tipos_reparacion")
    ordenes_servicio = relationship("OrdenServicio", back_populates="tipo_reparacion")


class OrdenServicio(Base):
    __tablename__ = "ordenes_servicio"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    mecanico_id = Column(Integer, ForeignKey("mecanicos.id", ondelete="SET NULL"))
    tipo_reparacion_id = Column(Integer, ForeignKey("tipos_reparacion.id", ondelete="SET NULL"))
    numero_orden = Column(String(20), nullable=False, unique=True)
    estado = Column(String(30), nullable=False, default="Recibido")
    descripcion_problema = Column(Text)
    diagnostico_tecnico = Column(Text)
    costo_estimado = Column(Numeric(12, 2))
    costo_final = Column(Numeric(12, 2))
    kilometraje_ingreso = Column(Integer)
    es_urgente = Column(Boolean, nullable=False, default=False)
    fecha_ingreso = Column(TIMESTAMP, nullable=False, default=func.now())
    fecha_estimada_entrega = Column(Date)
    fecha_finalizacion = Column(TIMESTAMP)
    calificacion = Column(SmallInteger)
    comentario_cliente = Column(Text)
    garantia_dias = Column(Integer, default=0)
    garantia_vencimiento = Column(Date)
    tiempo_inicio = Column(TIMESTAMP)
    tiempo_fin = Column(TIMESTAMP)
    tiempo_total_minutos = Column(Integer, default=0)
    fotos_urls = Column(Text)

    __table_args__ = (
        CheckConstraint(
            "estado IN ('Recibido','En Diagnóstico','En Reparación','Servicio Finalizado','Cancelado')",
            name="chk_orden_estado"
        ),
        CheckConstraint("calificacion BETWEEN 1 AND 5", name="chk_orden_calificacion"),
    )

    taller = relationship("Taller", back_populates="ordenes_servicio")
    vehiculo = relationship("Vehiculo", back_populates="ordenes_servicio")
    cliente = relationship("Cliente", back_populates="ordenes_servicio")
    mecanico = relationship("Mecanico", back_populates="ordenes_servicio")
    tipo_reparacion = relationship("TipoReparacion", back_populates="ordenes_servicio")
    repuestos = relationship("RepuestoOrden", back_populates="orden")
    historial = relationship("HistorialEstado", back_populates="orden")
    mensajes = relationship("Mensaje", back_populates="orden")


class RepuestoOrden(Base):
    __tablename__ = "repuestos_orden"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_servicio.id", ondelete="CASCADE"), nullable=False)
    nombre_pieza = Column(String(150), nullable=False)
    cantidad = Column(SmallInteger, nullable=False, default=1)
    precio_unitario = Column(Numeric(10, 2), nullable=False)

    orden = relationship("OrdenServicio", back_populates="repuestos")


class HistorialEstado(Base):
    __tablename__ = "historial_estados"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_servicio.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    estado_anterior = Column(String(30))
    estado_nuevo = Column(String(30), nullable=False)
    observacion = Column(Text)
    fecha_cambio = Column(TIMESTAMP, nullable=False, default=func.now())

    orden = relationship("OrdenServicio", back_populates="historial")
    usuario = relationship("Usuario", back_populates="historial_estados")


class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False)
    orden_id = Column(Integer, ForeignKey("ordenes_servicio.id", ondelete="SET NULL"))
    remitente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    asunto = Column(String(200))
    contenido = Column(Text, nullable=False)
    leido = Column(Boolean, nullable=False, default=False)
    fecha_envio = Column(TIMESTAMP, nullable=False, default=func.now())

    taller = relationship("Taller", back_populates="mensajes")
    orden = relationship("OrdenServicio", back_populates="mensajes")
    remitente = relationship("Usuario", back_populates="mensajes_enviados")


class ProximoServicio(Base):
    __tablename__ = "proximos_servicios"

    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=False)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False)
    descripcion = Column(String(200), nullable=False)
    kilometraje_sugerido = Column(Integer)
    fecha_sugerida = Column(Date)
    completado = Column(Boolean, nullable=False, default=False)
    fecha_creacion = Column(TIMESTAMP, nullable=False, default=func.now())

    vehiculo = relationship("Vehiculo", back_populates="proximos_servicios")
    taller = relationship("Taller", back_populates="proximos_servicios")


class ReporteIngreso(Base):
    __tablename__ = "reportes_ingresos"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id", ondelete="CASCADE"), nullable=False)
    anio = Column(SmallInteger, nullable=False)
    mes = Column(SmallInteger, nullable=False)
    total_ingresos = Column(Numeric(14, 2), nullable=False, default=0)
    total_ordenes = Column(Integer, nullable=False, default=0)
    tiempo_promedio_horas = Column(Numeric(5, 2))
    satisfaccion_promedio = Column(Numeric(3, 2))
    fecha_calculo = Column(TIMESTAMP, nullable=False, default=func.now())

    __table_args__ = (
        UniqueConstraint("taller_id", "anio", "mes", name="uq_reporte_taller_anio_mes"),
        CheckConstraint("mes BETWEEN 1 AND 12", name="chk_reporte_mes"),
    )

    taller = relationship("Taller", back_populates="reportes_ingresos")


class ContactoWeb(Base):
    __tablename__ = "contactos_web"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20))
    correo = Column(String(100), nullable=False)
    asunto = Column(String(50))
    mensaje = Column(Text, nullable=False)
    atendido = Column(Boolean, nullable=False, default=False)
    fecha = Column(TIMESTAMP, nullable=False, default=func.now())


class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False, default=1)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    fecha_cita = Column(Date, nullable=False)
    hora_cita = Column(String(10), nullable=False)
    motivo = Column(Text)
    estado = Column(String(20), nullable=False, default="Pendiente")  # Pendiente, Confirmada, Cancelada, Completada
    fecha_creacion = Column(TIMESTAMP, nullable=False, default=func.now())


class InventarioItem(Base):
    __tablename__ = "inventario"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False, default=1)
    codigo = Column(String(50), unique=True)
    nombre = Column(String(150), nullable=False)
    categoria = Column(String(80))
    cantidad_stock = Column(Integer, nullable=False, default=0)
    stock_minimo = Column(Integer, nullable=False, default=5)
    precio_compra = Column(Numeric(10, 2), nullable=False, default=0)
    precio_venta = Column(Numeric(10, 2), nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)


class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_servicio.id", ondelete="CASCADE"), nullable=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=True)
    mecanico_id = Column(Integer, ForeignKey("mecanicos.id", ondelete="SET NULL"), nullable=True)
    subtotal_mano_obra = Column(Numeric(10, 2), nullable=False, default=0)
    subtotal_piezas = Column(Numeric(10, 2), nullable=False, default=0)
    descuento_porcentaje = Column(Numeric(5, 2), default=0)
    descuento_monto = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), nullable=False, default=0)
    estado = Column(String(20), nullable=False, default="Pendiente")  # Pendiente, Aprobado, Rechazado
    observaciones = Column(Text)
    fecha_creacion = Column(TIMESTAMP, nullable=False, default=func.now())

    orden = relationship("OrdenServicio")
    taller = relationship("Taller")
    vehiculo = relationship("Vehiculo")
    cliente = relationship("Cliente")
    mecanico = relationship("Mecanico")
    items = relationship("ItemPresupuesto", back_populates="presupuesto", cascade="all, delete-orphan")


class ItemPresupuesto(Base):
    __tablename__ = "items_presupuesto"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False)
    nombre_pieza = Column(String(150), nullable=False)
    cantidad = Column(SmallInteger, nullable=False, default=1)
    precio_unitario = Column(Numeric(10, 2), nullable=False, default=0)
    precio_total = Column(Numeric(10, 2), nullable=False, default=0)

    presupuesto = relationship("Presupuesto", back_populates="items")


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_servicio.id", ondelete="CASCADE"), nullable=False)
    numero_factura = Column(String(30), nullable=False, unique=True)
    subtotal = Column(Numeric(12, 2), nullable=False)
    descuento = Column(Numeric(10, 2), default=0)
    iva_monto = Column(Numeric(10, 2), nullable=False)
    total_pagar = Column(Numeric(12, 2), nullable=False)
    estado = Column(String(20), nullable=False, default="Pendiente")  # Pendiente, Pagada, Anulada
    fecha_emision = Column(TIMESTAMP, nullable=False, default=func.now())


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False)
    monto_pagado = Column(Numeric(12, 2), nullable=False)
    metodo_pago = Column(String(30), nullable=False)  # Efectivo, Tarjeta de Crédito, Tarjeta de Débito, Transferencia Bancaria
    referencia_transaccion = Column(String(100))
    notas = Column(Text)
    fecha_pago = Column(TIMESTAMP, nullable=False, default=func.now())


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False, default=1)
    nombre = Column(String(120), nullable=False)
    nit = Column(String(30))
    contacto_nombre = Column(String(100))
    telefono = Column(String(30))
    correo = Column(String(100))
    direccion = Column(String(200))
    activo = Column(Boolean, nullable=False, default=True)


class OrdenCompra(Base):
    __tablename__ = "ordenes_compra"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False, default=1)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    numero_compra = Column(String(30), nullable=False, unique=True)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    estado = Column(String(20), nullable=False, default="Pendiente")  # Pendiente, Recibida, Cancelada
    fecha_creacion = Column(TIMESTAMP, nullable=False, default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False, default=1)
    usuario_nombre = Column(String(150))
    accion = Column(String(100), nullable=False)
    entidad = Column(String(80))
    detalle = Column(Text)
    ip_origen = Column(String(45))
    timestamp = Column(TIMESTAMP, nullable=False, default=func.now())

