// src/pages/Facturacion.jsx
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getOrdenes } from '../services/ordenesService';
import { getVehiculos } from '../services/vehiculosService';
import { getClientes } from '../services/clientesService';
import { getFacturas, crearFactura, registrarPagoManual } from '../services/facturasService';
import { getPresupuestos, crearPresupuesto } from '../services/presupuestosService';
import './Facturacion.css';

export default function Facturacion() {
  const { usuario } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pestaña, setPestaña] = useState('presupuestos'); // 'presupuestos' | 'facturas'

  // Modales
  const [modalPresupuesto, setModalPresupuesto] = useState(false);
  const [modalDetallePresupuesto, setModalDetallePresupuesto] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
  const [modalFactura, setModalFactura] = useState(false);
  const [modalPago, setModalPago] = useState(false);

  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  // Formulario Cotización Detallada por Partes
  const [formPresupuesto, setFormPresupuesto] = useState({
    orden_id: '',
    vehiculo_id: '',
    cliente_id: '',
    subtotal_mano_obra: 120000,
    descuento_porcentaje: 0,
    observaciones: 'Diagnóstico técnico y cotización detallada de partes requeridas para el vehículo.',
    items: [
      { nombre_pieza: 'Pastillas de Freno Delanteras', cantidad: 1, precio_unitario: 85000 },
      { nombre_pieza: 'Líquido de Frenos DOT4', cantidad: 1, precio_unitario: 28000 },
    ],
  });

  // Formulario Pago
  const [formPago, setFormPago] = useState({
    monto_pagado: 0,
    metodo_pago: 'Efectivo',
    referencia_transaccion: '',
    notas: 'Pago recibido en caja presencial',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [ords, facts, pres, vehs, clis] = await Promise.all([
        getOrdenes(),
        getFacturas(),
        getPresupuestos(),
        getVehiculos(),
        getClientes(),
      ]);
      setOrdenes(Array.isArray(ords) ? ords : (ords?.data || []));
      setFacturas(Array.isArray(facts) ? facts : (facts?.data || []));
      setPresupuestos(Array.isArray(pres) ? pres : (pres?.data || []));
      setVehiculos(Array.isArray(vehs) ? vehs : (vehs?.data || []));
      setClientes(Array.isArray(clis) ? clis : (clis?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  // Manejo de ítems de partes en la cotización
  function handleAgregarItem() {
    setFormPresupuesto({
      ...formPresupuesto,
      items: [
        ...formPresupuesto.items,
        { nombre_pieza: '', cantidad: 1, precio_unitario: 0 },
      ],
    });
  }

  function handleEliminarItem(index) {
    const nuevos = formPresupuesto.items.filter((_, i) => i !== index);
    setFormPresupuesto({ ...formPresupuesto, items: nuevos });
  }

  function handleItemChange(index, campo, valor) {
    const nuevos = [...formPresupuesto.items];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setFormPresupuesto({ ...formPresupuesto, items: nuevos });
  }

  // Cálculos dinámicos
  const subtotalPiezas = formPresupuesto.items.reduce((acc, it) => {
    const cant = parseFloat(it.cantidad) || 0;
    const prec = parseFloat(it.precio_unitario) || 0;
    return acc + (cant * prec);
  }, 0);

  const subtotalManoObra = parseFloat(formPresupuesto.subtotal_mano_obra) || 0;
  const subtotalBruto = subtotalPiezas + subtotalManoObra;
  const descPct = parseFloat(formPresupuesto.descuento_porcentaje) || 0;
  const descuentoMonto = (subtotalBruto * descPct) / 100;
  const totalCotizacion = subtotalBruto - descuentoMonto;

  function abrirModalCotizarParaOrden(ord) {
    setOrdenSeleccionada(ord);
    setFormPresupuesto({
      orden_id: ord.id,
      vehiculo_id: ord.vehiculo_id,
      cliente_id: ord.cliente_id,
      subtotal_mano_obra: 120000,
      descuento_porcentaje: 0,
      observaciones: `Cotización de repuestos y mano de obra para ${ord.numero_orden}.`,
      items: [
        { nombre_pieza: 'Filtro de Aceite', cantidad: 1, precio_unitario: 35000 },
        { nombre_pieza: 'Aceite Sintético 5W-30 (Galón)', cantidad: 1, precio_unitario: 140000 },
      ],
    });
    setModalPresupuesto(true);
  }

  function abrirModalNuevaCotizacionLibre() {
    setOrdenSeleccionada(null);
    const primerVeh = vehiculos[0];
    setFormPresupuesto({
      orden_id: '',
      vehiculo_id: primerVeh ? primerVeh.id : '',
      cliente_id: primerVeh ? (primerVeh.cliente_id || '') : '',
      subtotal_mano_obra: 100000,
      descuento_porcentaje: 0,
      observaciones: 'Cotización inicial de piezas y mantenimiento para el vehículo del cliente.',
      items: [
        { nombre_pieza: 'Juego de Bujías de Iridio', cantidad: 4, precio_unitario: 25000 },
        { nombre_pieza: 'Limpiador de Inyectores', cantidad: 1, precio_unitario: 30000 },
      ],
    });
    setModalPresupuesto(true);
  }

  // Generar Cotización / Presupuesto con Partes Detalladas
  async function handleCrearPresupuesto(e) {
    e.preventDefault();

    if (formPresupuesto.items.length === 0) {
      alert('Por favor agrega al menos 1 parte o repuesto a la cotización.');
      return;
    }

    const payload = {
      orden_id: formPresupuesto.orden_id ? parseInt(formPresupuesto.orden_id) : null,
      vehiculo_id: formPresupuesto.vehiculo_id ? parseInt(formPresupuesto.vehiculo_id) : null,
      cliente_id: formPresupuesto.cliente_id ? parseInt(formPresupuesto.cliente_id) : (vehiculoModalInfo?.cliente_id || null),
      taller_id: usuario?.taller_id || 1,
      mecanico_id: usuario?.mecanico_id || null,
      subtotal_mano_obra: subtotalManoObra,
      subtotal_piezas: subtotalPiezas,
      descuento_porcentaje: descPct,
      descuento_monto: descuentoMonto,
      total: totalCotizacion,
      estado: 'Pendiente',
      observaciones: formPresupuesto.observaciones,
      items: formPresupuesto.items.map(it => ({
        nombre_pieza: it.nombre_pieza.trim() || 'Repuesto',
        cantidad: parseInt(it.cantidad) || 1,
        precio_unitario: parseFloat(it.precio_unitario) || 0,
      })),
    };

    try {
      await crearPresupuesto(payload);
      alert('¡Cotización por partes generada con éxito y enviada al cliente para su aprobación!');
      setModalPresupuesto(false);
      cargarDatos();
    } catch (err) {
      alert('Error al generar cotización: ' + (err.response?.data?.detail || err.message));
    }
  }

  // Ver Detalle de Cotización
  function verDetallePresupuesto(p) {
    setPresupuestoSeleccionado(p);
    setModalDetallePresupuesto(true);
  }

  // Generar Factura
  async function handleGenerarFactura(orden) {
    const subtotal = Number(orden.costo_estimado) || 250000;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    try {
      await crearFactura({
        orden_id: orden.id,
        numero_factura: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotal: subtotal,
        descuento: 0,
        iva_monto: iva,
        total_pagar: total,
        estado: 'Pendiente',
      });
      alert('Factura emitida correctamente.');
      cargarDatos();
    } catch (err) {
      alert('Error al generar factura');
    }
  }

  // Abrir Modal de Pago Manual
  function abrirModalPago(factura) {
    setFacturaSeleccionada(factura);
    setFormPago({
      monto_pagado: factura.total_pagar,
      metodo_pago: 'Efectivo',
      referencia_transaccion: `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      notas: 'Cobro registrado en caja central.',
    });
    setModalPago(true);
  }

  // Registrar Pago Manual
  async function handleRegistrarPago(e) {
    e.preventDefault();
    if (!facturaSeleccionada) return;

    try {
      await registrarPagoManual(facturaSeleccionada.id, formPago);
      alert(`Pago de $${Number(formPago.monto_pagado).toLocaleString()} registrado exitosamente.`);
      setModalPago(false);
      cargarDatos();
    } catch (err) {
      alert('Error al registrar el pago manual.');
    }
  }

  const vehiculoModalInfo = vehiculos.find(v => v.id === parseInt(formPresupuesto.vehiculo_id));

  return (
    <PanelLayout titulo="Cotizaciones, Facturación & Cobros">
      <div className="facturacion-page">
        {/* Banner visual de Facturación */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(5, 150, 105, 0.85) 100%), url("https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
          color: 'white',
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px rgba(5, 150, 105, 0.2)'
        }}>
          <div style={{ maxWidth: '580px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
              <i className="fa-solid fa-calculator"></i> Finanzas & Presupuestos Transparentes
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>
              Cotizaciones por Partes & Facturación
            </h2>
            <p style={{ margin: '6px 0 0', opacity: 0.92, fontSize: '0.9rem', lineHeight: 1.5 }}>
              Genera presupuestos detallados por repuestos y mano de obra del mecánico hacia el cliente para su aprobación.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn--primario" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }} onClick={abrirModalNuevaCotizacionLibre}>
              <i className="fa-solid fa-file-invoice-dollar"></i> Nueva Cotización por Partes
            </button>
          </div>
        </div>

        <div className="pestañas-header">
          <button
            className={`tab-btn ${pestaña === 'presupuestos' ? 'active' : ''}`}
            onClick={() => setPestaña('presupuestos')}
          >
            <i className="fa-solid fa-file-signature"></i> Cotizaciones & Presupuestos por Partes ({presupuestos.length})
          </button>
          <button
            className={`tab-btn ${pestaña === 'facturas' ? 'active' : ''}`}
            onClick={() => setPestaña('facturas')}
          >
            <i className="fa-solid fa-receipt"></i> Facturación & Registro de Pagos ({facturas.length})
          </button>
        </div>

        {cargando ? (
          <div className="flex-center" style={{ padding: '40px' }}>
            <span className="spinner spinner--dark"></span>
          </div>
        ) : pestaña === 'presupuestos' ? (
          <div className="seccion-tab">
            <div className="table-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Listado de Cotizaciones Emitidas</h3>
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  Presupuestos con desglose específico de piezas, repuestos, mano de obra y descuentos comerciales.
                </p>
              </div>
              <button className="btn btn--primario" onClick={abrirModalNuevaCotizacionLibre}>
                <i className="fa-solid fa-plus"></i> Crear Cotización
              </button>
            </div>

            <table className="tabla-custom">
              <thead>
                <tr>
                  <th>N° Cotización</th>
                  <th>Vehículo (Marca / Modelo / Año)</th>
                  <th>Cliente</th>
                  <th>Subtotal Piezas</th>
                  <th>Mano de Obra</th>
                  <th>Descuento</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {presupuestos.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No hay cotizaciones registradas aún. Haz clic en "Crear Cotización" o selecciona una orden abajo.
                    </td>
                  </tr>
                ) : (
                  presupuestos.map((p) => (
                    <tr key={p.id}>
                      <td><strong>COT-{p.id}</strong></td>
                      <td>
                        {p.vehiculo_placa ? (
                          <div>
                            <strong>{p.vehiculo_placa}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {p.vehiculo_marca} {p.vehiculo_modelo} ({p.vehiculo_anio})
                            </div>
                          </div>
                        ) : (
                          <span>Vehículo #{p.vehiculo_id || '—'}</span>
                        )}
                      </td>
                      <td>{p.cliente_nombre || (p.cliente_id ? `Cliente #${p.cliente_id}` : '—')}</td>
                      <td>
                        <div>${Number(p.subtotal_piezas || 0).toLocaleString()}</div>
                        {p.items && p.items.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                            {p.items.length} repuesto(s)
                          </div>
                        )}
                      </td>
                      <td>${Number(p.subtotal_mano_obra || 0).toLocaleString()}</td>
                      <td>
                        {p.descuento_porcentaje ? (
                          <span className="badge-desc">{p.descuento_porcentaje}% OFF</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0%</span>
                        )}
                      </td>
                      <td><strong>${Number(p.total || 0).toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${p.estado === 'Aprobado' ? 'badge-success' : p.estado === 'Rechazado' ? 'badge-danger' : 'badge-warning'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-primario-sm" style={{ padding: '4px 8px' }} onClick={() => verDetallePresupuesto(p)}>
                            <i className="fa-solid fa-eye"></i> Ver Desglose
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Órdenes activas para cotizar rápidamente */}
            <div className="seccion-ordenes-sin-presupuesto" style={{ marginTop: '20px' }}>
              <h4>Órdenes de Trabajo Disponibles para Cotizar</h4>
              {ordenes.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No hay órdenes activas registradas.</p>
              ) : (
                <div className="grid-ordenes-tarjetas">
                  {ordenes.map((ord) => (
                    <div key={ord.id} className="tarjeta-orden-pres">
                      <div className="top-tarjeta">
                        <span className="ord-num">{ord.numero_orden}</span>
                        <span className="ord-est">{ord.estado}</span>
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '0.88rem' }}>
                        <strong>Problema:</strong> {ord.descripcion_problema || 'Mantenimiento preventivo'}
                      </p>
                      <button
                        className="btn-primario-sm"
                        onClick={() => abrirModalCotizarParaOrden(ord)}
                      >
                        <i className="fa-solid fa-calculator"></i> Cotizar Repuestos y Mano de Obra
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="seccion-tab">
            <div className="table-actions">
              <h3>Facturas y Control de Cobros</h3>
              <p>Emite facturas formales con IVA y registra los pagos presenciales de clientes.</p>
            </div>
            <table className="tabla-custom">
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Orden</th>
                  <th>Subtotal</th>
                  <th>IVA (19%)</th>
                  <th>Total a Pagar</th>
                  <th>Estado Pago</th>
                  <th>Acción de Cobro</th>
                </tr>
              </thead>
              <tbody>
                {facturas.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No hay facturas emitidas aún. Selecciona una orden abajo para generar factura.
                    </td>
                  </tr>
                ) : (
                  facturas.map((f) => (
                    <tr key={f.id}>
                      <td><code>{f.numero_factura}</code></td>
                      <td>ORD-{f.orden_id}</td>
                      <td>${Number(f.subtotal).toLocaleString()}</td>
                      <td>${Number(f.iva_monto).toLocaleString()}</td>
                      <td><strong>${Number(f.total_pagar).toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${f.estado === 'Pagada' ? 'badge-success' : 'badge-danger'}`}>
                          {f.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {f.estado === 'Pendiente' ? (
                            <button className="btn-cobro" onClick={() => abrirModalPago(f)}>
                              <i className="fa-solid fa-hand-holding-dollar"></i> Registrar Pago
                            </button>
                          ) : (
                            <span className="pago-completado"><i className="fa-solid fa-circle-check"></i> Pagada</span>
                          )}
                          <button className="btn-secundario-sm" onClick={() => window.print()} title="Imprimir Factura">
                            <i className="fa-solid fa-print"></i> Imprimir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="seccion-emitir-factura" style={{ marginTop: '20px' }}>
              <h4>Emitir Factura para Órdenes en Proceso</h4>
              <div className="grid-ordenes-tarjetas">
                {ordenes.map((ord) => (
                  <div key={ord.id} className="tarjeta-orden-pres">
                    <div className="top-tarjeta">
                      <span className="ord-num">{ord.numero_orden}</span>
                      <span className="ord-est">{ord.estado}</span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '0.88rem' }}>
                      <strong>Costo Estimado:</strong> ${Number(ord.costo_estimado || 0).toLocaleString()}
                    </p>
                    <button className="btn-primario-sm" onClick={() => handleGenerarFactura(ord)}>
                      <i className="fa-solid fa-receipt"></i> Emitir Factura
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Cotización por Partes */}
      {modalPresupuesto && (
        <Modal titulo="Generar Cotización Detallada por Partes" onClose={() => setModalPresupuesto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos con asterisco son obligatorios.
          </div>
          <form onSubmit={handleCrearPresupuesto}>
            {/* Vehículo y Cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>
                  Vehículo del Cliente <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <select
                  className="form-input"
                  required
                  value={formPresupuesto.vehiculo_id}
                  onChange={(e) => {
                    const vId = parseInt(e.target.value);
                    const vObj = vehiculos.find(x => x.id === vId);
                    setFormPresupuesto({
                      ...formPresupuesto,
                      vehiculo_id: vId,
                      cliente_id: vObj ? vObj.cliente_id : formPresupuesto.cliente_id,
                    });
                  }}
                >
                  <option value="" disabled>Seleccione vehículo...</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.marca} {v.modelo} ({v.anio})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cliente Propietario</label>
                <select
                  className="form-input"
                  value={formPresupuesto.cliente_id}
                  onChange={(e) => setFormPresupuesto({ ...formPresupuesto, cliente_id: parseInt(e.target.value) })}
                >
                  <option value="">Seleccione cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo || c.usuario?.nombre_completo || `Cliente #${c.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Desglose de Partes y Repuestos */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#ffffff', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                  <i className="fa-solid fa-gears" style={{ color: '#0284c7', marginRight: '6px' }}></i>
                  Desglose de Repuestos y Partes Requeridas
                </strong>
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  style={{ color: '#0284c7', borderColor: '#0284c7' }}
                  onClick={handleAgregarItem}
                >
                  <i className="fa-solid fa-plus"></i> Agregar Repuesto
                </button>
              </div>

              <table className="items-cotizacion-tabla">
                <thead>
                  <tr>
                    <th>Nombre de la Pieza / Repuesto</th>
                    <th style={{ width: '80px' }}>Cant.</th>
                    <th style={{ width: '130px' }}>Precio Unit. ($)</th>
                    <th style={{ width: '120px' }}>Subtotal</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formPresupuesto.items.map((item, index) => {
                    const rowSubtotal = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0);
                    return (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '6px 8px' }}
                            required
                            placeholder="Ej: Disco de Freno, Amortiguador..."
                            value={item.nombre_pieza}
                            onChange={(e) => handleItemChange(index, 'nombre_pieza', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '6px 8px', textAlign: 'center' }}
                            required
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '6px 8px' }}
                            required
                            min="0"
                            step="1000"
                            value={item.precio_unitario}
                            onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                          />
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          ${rowSubtotal.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {formPresupuesto.items.length > 1 && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                              onClick={() => handleEliminarItem(index)}
                              title="Quitar repuesto"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mano de Obra y Descuento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Mano de Obra del Mecánico ($) <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="0"
                  step="1000"
                  value={formPresupuesto.subtotal_mano_obra}
                  onChange={(e) => setFormPresupuesto({ ...formPresupuesto, subtotal_mano_obra: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Descuento Comercial (%)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="100"
                  value={formPresupuesto.descuento_porcentaje}
                  onChange={(e) => setFormPresupuesto({ ...formPresupuesto, descuento_porcentaje: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Observaciones o Recomendaciones Técnicas</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="Observaciones para el cliente respecto a las piezas a sustituir..."
                value={formPresupuesto.observaciones}
                onChange={(e) => setFormPresupuesto({ ...formPresupuesto, observaciones: e.target.value })}
              ></textarea>
            </div>

            {/* Resumen de Totales */}
            <div className="totales-cotizacion-box">
              <div className="totales-fila">
                <span>Subtotal Piezas & Repuestos:</span>
                <strong>${subtotalPiezas.toLocaleString()}</strong>
              </div>
              <div className="totales-fila">
                <span>Subtotal Mano de Obra:</span>
                <strong>${subtotalManoObra.toLocaleString()}</strong>
              </div>
              {descPct > 0 && (
                <div className="totales-fila" style={{ color: '#059669' }}>
                  <span>Descuento ({descPct}%):</span>
                  <strong>-${descuentoMonto.toLocaleString()}</strong>
                </div>
              )}
              <div className="totales-fila totales-fila--gran-total">
                <span>Total Estimado al Cliente:</span>
                <span style={{ color: '#0284c7' }}>${totalCotizacion.toLocaleString()}</span>
              </div>
            </div>

            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalPresupuesto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario">
                Generar y Enviar Cotización
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Ver Detalle de Cotización */}
      {modalDetallePresupuesto && presupuestoSeleccionado && (
        <Modal titulo={`Detalle de Cotización #COT-${presupuestoSeleccionado.id}`} onClose={() => setModalDetallePresupuesto(false)}>
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>{presupuestoSeleccionado.taller_nombre || 'Taller AutoMétrica'}</h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Código Taller: {presupuestoSeleccionado.taller_codigo || 'TLR-001'}</div>
              </div>
              <span className={`badge ${presupuestoSeleccionado.estado === 'Aprobado' ? 'badge-success' : presupuestoSeleccionado.estado === 'Rechazado' ? 'badge-danger' : 'badge-warning'}`}>
                {presupuestoSeleccionado.estado}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Vehículo:</span>{' '}
                <strong>{presupuestoSeleccionado.vehiculo_placa || '—'}</strong> ({presupuestoSeleccionado.vehiculo_marca} {presupuestoSeleccionado.vehiculo_modelo} - Año {presupuestoSeleccionado.vehiculo_anio})
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Cliente:</span>{' '}
                <strong>{presupuestoSeleccionado.cliente_nombre || 'Cliente'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Mecánico Responsable:</span>{' '}
                <strong>{presupuestoSeleccionado.mecanico_nombre || 'Técnico Especialista'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Fecha:</span>{' '}
                <strong>{new Date(presupuestoSeleccionado.fecha_creacion || Date.now()).toLocaleDateString('es-CO')}</strong>
              </div>
            </div>

            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>Desglose de Repuestos y Partes:</h4>
            {presupuestoSeleccionado.items && presupuestoSeleccionado.items.length > 0 ? (
              <table className="items-cotizacion-tabla" style={{ marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Pieza / Repuesto</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Precio Unitario</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestoSeleccionado.items.map((it, idx) => (
                    <tr key={idx}>
                      <td><strong>{it.nombre_pieza}</strong></td>
                      <td style={{ textAlign: 'center' }}>{it.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>${Number(it.precio_unitario).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>${Number(it.precio_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No se registraron ítems desglosados en este presupuesto.</p>
            )}

            <div className="totales-cotizacion-box">
              <div className="totales-fila">
                <span>Subtotal Repuestos:</span>
                <strong>${Number(presupuestoSeleccionado.subtotal_piezas || 0).toLocaleString()}</strong>
              </div>
              <div className="totales-fila">
                <span>Mano de Obra:</span>
                <strong>${Number(presupuestoSeleccionado.subtotal_mano_obra || 0).toLocaleString()}</strong>
              </div>
              {presupuestoSeleccionado.descuento_porcentaje > 0 && (
                <div className="totales-fila" style={{ color: '#059669' }}>
                  <span>Descuento ({presupuestoSeleccionado.descuento_porcentaje}%):</span>
                  <strong>-${Number(presupuestoSeleccionado.descuento_monto || 0).toLocaleString()}</strong>
                </div>
              )}
              <div className="totales-fila totales-fila--gran-total">
                <span>Total a Pagar:</span>
                <span style={{ color: '#0284c7' }}>${Number(presupuestoSeleccionado.total || 0).toLocaleString()}</span>
              </div>
            </div>

            {presupuestoSeleccionado.observaciones && (
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                <strong>Observaciones:</strong> {presupuestoSeleccionado.observaciones}
              </div>
            )}

            <div className="modal__footer" style={{ marginTop: '16px' }}>
              <button type="button" className="btn btn--outline" onClick={() => setModalDetallePresupuesto(false)}>
                Cerrar
              </button>
              <button type="button" className="btn btn--primario" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Imprimir Cotización
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Pago Manual */}
      {modalPago && facturaSeleccionada && (
        <Modal titulo={`Registrar Pago - ${facturaSeleccionada.numero_factura}`} onClose={() => setModalPago(false)}>
          <form onSubmit={handleRegistrarPago}>
            <div className="form-group">
              <label>Monto Pagado ($)</label>
              <input
                type="number"
                className="form-input"
                required
                value={formPago.monto_pagado}
                onChange={(e) => setFormPago({ ...formPago, monto_pagado: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Método de Pago</label>
              <select
                className="form-input"
                value={formPago.metodo_pago}
                onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta Débito / Crédito</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalPago(false)}>Cancelar</button>
              <button type="submit" className="btn btn--primario" style={{ backgroundColor: '#059669' }}>Confirmar Pago</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
