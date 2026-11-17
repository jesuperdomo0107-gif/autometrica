// src/pages/PortalCliente.jsx
import React, { useState, useEffect } from 'react';
import SidebarCliente from '../components/SidebarCliente';
import Modal from '../components/Modal';
import { getVehiculos, crearVehiculo } from '../services/vehiculosService';
import { getOrdenes, actualizarOrden } from '../services/ordenesService';
import { getPresupuestos, actualizarPresupuesto } from '../services/presupuestosService';
import { useAuth } from '../context/AuthContext';
import './GestionVehiculos.css';

const currentYear = new Date().getFullYear();

export default function PortalCliente() {
  const { usuario } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCalificacion, setModalCalificacion] = useState(false);
  const [ordenCalificar, setOrdenCalificar] = useState(null);
  const [modalDetallePresupuesto, setModalDetallePresupuesto] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');

  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    placa: '',
    marca: '',
    modelo: '',
    anio: currentYear,
    color: 'Gris',
    tipo: 'carro',
    kilometraje_actual: 0,
    cliente_id: usuario?.id || 1,
  });

  useEffect(() => {
    cargarDatosCliente();
  }, []);

  async function cargarDatosCliente() {
    setCargando(true);
    try {
      const [dataVeh, dataOrd, dataPres] = await Promise.all([
        getVehiculos(),
        getOrdenes(),
        getPresupuestos(),
      ]);

      const listaVehs = Array.isArray(dataVeh) ? dataVeh : (dataVeh?.data || []);
      const listaOrds = Array.isArray(dataOrd) ? dataOrd : (dataOrd?.data || []);
      const listaPres = Array.isArray(dataPres) ? dataPres : (dataPres?.data || []);

      setVehiculos(listaVehs);
      setOrdenes(listaOrds);
      setPresupuestos(listaPres);
    } catch (err) {
      console.warn('Error al cargar datos del portal:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleGuardarVehiculo(e) {
    e.preventDefault();
    if (!nuevoVehiculo.placa.trim() || !nuevoVehiculo.marca.trim() || !nuevoVehiculo.modelo.trim() || !nuevoVehiculo.anio) {
      alert('Por favor completa todos los campos obligatorios: Placa, Marca, Modelo y Año.');
      return;
    }
    try {
      await crearVehiculo({
        ...nuevoVehiculo,
        placa: nuevoVehiculo.placa.trim().toUpperCase(),
        marca: nuevoVehiculo.marca.trim(),
        modelo: nuevoVehiculo.modelo.trim(),
        anio: parseInt(nuevoVehiculo.anio),
        cliente_id: usuario?.cliente_id || usuario?.id || 1,
      });
      alert('¡Vehículo registrado con éxito en tu Garaje Digital!');
      setModalAbierto(false);
      setNuevoVehiculo({
        placa: '',
        marca: '',
        modelo: '',
        anio: currentYear,
        color: 'Gris',
        tipo: 'carro',
        kilometraje_actual: 0,
        cliente_id: usuario?.id || 1,
      });
      cargarDatosCliente();
    } catch (err) {
      alert('Error al guardar vehículo: ' + (err.response?.data?.detail || err.message || 'Verifica los datos'));
    }
  }

  // Aprobar / Rechazar Presupuesto
  async function handleResponderPresupuesto(id, nuevoEstado) {
    try {
      await actualizarPresupuesto(id, { estado: nuevoEstado });
      alert(`Has marcado la cotización como ${nuevoEstado}. El taller y el mecánico han sido notificados.`);
      if (presupuestoSeleccionado && presupuestoSeleccionado.id === id) {
        setPresupuestoSeleccionado({ ...presupuestoSeleccionado, estado: nuevoEstado });
      }
      cargarDatosCliente();
    } catch (err) {
      alert('Error al actualizar el presupuesto');
    }
  }

  function verDetallePresupuesto(p) {
    setPresupuestoSeleccionado(p);
    setModalDetallePresupuesto(true);
  }

  // Enviar Calificación
  function abrirCalificacion(ord) {
    setOrdenCalificar(ord);
    setEstrellas(5);
    setComentario('');
    setModalCalificacion(true);
  }

  async function handleEnviarCalificacion(e) {
    e.preventDefault();
    if (!ordenCalificar) return;
    try {
      await actualizarOrden(ordenCalificar.id, {
        calificacion: estrellas,
        comentario_cliente: comentario,
      });
      alert(`¡Gracias por tu calificación de ${estrellas} estrellas! Tu retroalimentación fue guardada exitosamente.`);
      setModalCalificacion(false);
      cargarDatosCliente();
    } catch (err) {
      alert('Error al registrar calificación');
    }
  }

  return (
    <div className="panel-layout">
      <SidebarCliente />

      <div className="panel-layout__content">
        <header className="panel-layout__topbar">
          <span className="panel-layout__topbar-title">Portal del Cliente</span>
          <div className="panel-layout__topbar-right">
            <i className="fa-solid fa-circle-user"></i>
            {usuario?.nombre_completo || 'Cliente'}
          </div>
        </header>

        <main className="panel-layout__main">
          {/* Banner visual del portal del cliente */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(7, 26, 61, 0.92) 0%, rgba(0, 150, 245, 0.88) 100%), url("https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80") center/cover no-repeat',
            color: 'white',
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 10px 25px rgba(0, 150, 245, 0.2)'
          }}>
            <div style={{ maxWidth: '580px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px' }}>
                <i className="fa-solid fa-car-side"></i> Tu Garaje Digital AutoMétrica
              </div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#ffffff', fontWeight: 800 }}>¡Hola, {usuario?.nombre_completo || 'Bienvenido'}!</h2>
              <p style={{ margin: '8px 0 0', opacity: 0.92, fontSize: '0.95rem', lineHeight: 1.5 }}>
                Monitorea el avance de tus vehículos, revisa las cotizaciones de repuestos emitidas por los mecánicos y autoriza con 1 clic.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center', minWidth: '110px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{vehiculos.length}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Vehículos</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center', minWidth: '110px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{presupuestos.length}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Cotizaciones</div>
              </div>
            </div>
          </div>

          {/* Presupuestos Pendientes de Aprobación */}
          <div className="card" style={{ marginBottom: '24px' }} id="presupuestos">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="panel-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#059669' }}></i> Cotizaciones y Presupuestos por Partes ({presupuestos.length})
                </h3>
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  Desglose exacto de piezas, repuestos y mano de obra propuestos por el mecánico para tu vehículo.
                </p>
              </div>
            </div>

            {presupuestos.length === 0 ? (
              <p style={{ color: '#64748b' }}>No tienes presupuestos pendientes ni cotizaciones activas en este momento.</p>
            ) : (
              <div className="tabla-wrapper">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>N° Cotización</th>
                      <th>Vehículo</th>
                      <th>Desglose Piezas + Mano de Obra</th>
                      <th>Descuento</th>
                      <th>Total a Pagar</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map((p) => (
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
                        <td>
                          <div>Piezas: ${Number(p.subtotal_piezas || 0).toLocaleString()}</div>
                          <div style={{ color: 'var(--color-texto-suave)', fontSize: '0.82rem' }}>
                            Mano de Obra: ${Number(p.subtotal_mano_obra || 0).toLocaleString()}
                          </div>
                          {p.items && p.items.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                              {p.items.length} repuestos detallados
                            </div>
                          )}
                        </td>
                        <td>{p.descuento_porcentaje ? `${p.descuento_porcentaje}% OFF` : '0%'}</td>
                        <td><strong>${Number(p.total || 0).toLocaleString()}</strong></td>
                        <td>
                          <span className={`badge ${p.estado === 'Aprobado' ? 'badge--finalizado' : p.estado === 'Rechazado' ? 'badge--cancelado' : 'badge--reparacion'}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              className="btn btn--outline"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => verDetallePresupuesto(p)}
                            >
                              <i className="fa-solid fa-eye"></i> Ver Desglose
                            </button>
                            {p.estado === 'Pendiente' && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  className="btn btn--primario"
                                  style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#059669', flex: 1 }}
                                  onClick={() => handleResponderPresupuesto(p.id, 'Aprobado')}
                                >
                                  Aprobar
                                </button>
                                <button
                                  className="btn btn--outline"
                                  style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444', flex: 1 }}
                                  onClick={() => handleResponderPresupuesto(p.id, 'Rechazado')}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {cargando ? (
            <div className="flex-center" style={{ padding: '40px' }}>
              <span className="spinner spinner--dark"></span>
            </div>
          ) : (
            <>
              {/* Sección Mis Vehículos */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 className="panel-section-title" style={{ margin: 0 }}>
                    <i className="fa-solid fa-car" style={{ color: 'var(--color-primario)' }}></i> Mis Vehículos Registrados ({vehiculos.length})
                  </h3>
                  <button className="btn btn--primario" onClick={() => setModalAbierto(true)}>
                    <i className="fa-solid fa-plus"></i> Registrar Vehículo
                  </button>
                </div>

                {vehiculos.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px' }}>
                    <i className="fa-solid fa-car-side" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '8px' }}></i>
                    <p>No tienes vehículos registrados en tu garaje digital.</p>
                    <button className="btn btn--primario" style={{ marginTop: '8px' }} onClick={() => setModalAbierto(true)}>
                      Registrar mi vehículo
                    </button>
                  </div>
                ) : (
                  <div className="tabla-wrapper">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>Placa</th>
                          <th>Tipo</th>
                          <th>Marca</th>
                          <th>Modelo</th>
                          <th>Año</th>
                          <th>Color</th>
                          <th>Kilometraje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehiculos.map((v) => (
                          <tr key={v.id || v.placa}>
                            <td><strong>{v.placa}</strong></td>
                            <td>
                              <i className={v.tipo === 'moto' ? 'fa-solid fa-motorcycle' : 'fa-solid fa-car'} style={{ marginRight: '6px' }}></i>
                              {v.tipo === 'moto' ? 'Moto' : 'Carro'}
                            </td>
                            <td><strong>{v.marca || '—'}</strong></td>
                            <td><strong>{v.modelo || '—'}</strong></td>
                            <td><span className="badge badge--recibido">{v.anio || '—'}</span></td>
                            <td>{v.color || '—'}</td>
                            <td>{v.kilometraje_actual ? `${Number(v.kilometraje_actual).toLocaleString()} KM` : '0 KM'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sección Estado de Reparación & Feedback */}
              <div className="card" style={{ marginTop: '24px' }} id="servicios">
                <h3 className="panel-section-title">
                  <i className="fa-solid fa-wrench" style={{ color: '#F59E0B' }}></i> Estado de mis Servicios & Calificación
                </h3>

                {ordenes.length === 0 ? (
                  <p style={{ color: '#64748b' }}>No tienes órdenes de servicio activas en este momento.</p>
                ) : (
                  <div className="tabla-wrapper">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>N° Orden</th>
                          <th>Estado</th>
                          <th>Problema / Diagnóstico</th>
                          <th>Calificar Servicio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenes.map((o) => (
                          <tr key={o.id || o.numero_orden}>
                            <td><strong>{o.numero_orden}</strong></td>
                            <td><span className="badge badge--reparacion">{o.estado}</span></td>
                            <td>{o.descripcion_problema || o.diagnostico_tecnico || 'Mantenimiento de rutina'}</td>
                            <td>
                              <button className="btn btn--outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => abrirCalificacion(o)}>
                                ⭐ Calificar (1-5 Estrellas)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal Registrar Nuevo Vehículo */}
      {modalAbierto && (
        <Modal titulo="Registrar Mi Vehículo" onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleGuardarVehiculo}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Placa del Vehículo <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: XYZ-987"
                  value={nuevoVehiculo.placa}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, placa: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label>
                  Tipo <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <select
                  className="form-input"
                  value={nuevoVehiculo.tipo}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, tipo: e.target.value })}
                >
                  <option value="carro">Carro / Automóvil</option>
                  <option value="moto">Motocicleta</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Marca <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Chevrolet, Mazda, Toyota..."
                  value={nuevoVehiculo.marca}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, marca: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Modelo <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Onix, CX-30, Corolla..."
                  value={nuevoVehiculo.modelo}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Año <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="1950"
                  max={currentYear + 2}
                  value={nuevoVehiculo.anio}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, anio: parseInt(e.target.value) || currentYear })}
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Blanco, Gris..."
                  value={nuevoVehiculo.color}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, color: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Kilometraje Actual</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={nuevoVehiculo.kilometraje_actual}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, kilometraje_actual: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn btn--primario">Registrar Vehículo</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Desglose Detallado de Cotización */}
      {modalDetallePresupuesto && presupuestoSeleccionado && (
        <Modal titulo={`Cotización Detallada #COT-${presupuestoSeleccionado.id}`} onClose={() => setModalDetallePresupuesto(false)}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>{presupuestoSeleccionado.taller_nombre || 'Taller AutoMétrica'}</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Código de Taller: <strong>{presupuestoSeleccionado.taller_codigo || 'TLR-001'}</strong>
                </div>
              </div>
              <span className={`badge ${presupuestoSeleccionado.estado === 'Aprobado' ? 'badge--finalizado' : presupuestoSeleccionado.estado === 'Rechazado' ? 'badge--cancelado' : 'badge--reparacion'}`}>
                {presupuestoSeleccionado.estado}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Vehículo:</span>{' '}
                <strong>{presupuestoSeleccionado.vehiculo_placa}</strong> ({presupuestoSeleccionado.vehiculo_marca} {presupuestoSeleccionado.vehiculo_modelo} - Año {presupuestoSeleccionado.vehiculo_anio})
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Mecánico Responsable:</span>{' '}
                <strong>{presupuestoSeleccionado.mecanico_nombre || 'Especialista del Taller'}</strong>
              </div>
            </div>

            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#1e293b' }}>
              <i className="fa-solid fa-list-check" style={{ color: '#0284c7', marginRight: '6px' }}></i>
              Partes y Repuestos Cotizados:
            </h4>

            {presupuestoSeleccionado.items && presupuestoSeleccionado.items.length > 0 ? (
              <div className="tabla-wrapper" style={{ marginBottom: '16px' }}>
                <table className="tabla" style={{ fontSize: '0.88rem' }}>
                  <thead>
                    <tr>
                      <th>Repuesto / Parte</th>
                      <th style={{ textAlign: 'center' }}>Cantidad</th>
                      <th style={{ textAlign: 'right' }}>Precio Unit.</th>
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
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No se han listado ítems desglosados en este presupuesto.</p>
            )}

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Subtotal Piezas & Repuestos:</span>
                <strong>${Number(presupuestoSeleccionado.subtotal_piezas || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Subtotal Mano de Obra:</span>
                <strong>${Number(presupuestoSeleccionado.subtotal_mano_obra || 0).toLocaleString()}</strong>
              </div>
              {presupuestoSeleccionado.descuento_porcentaje > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#059669' }}>
                  <span>Descuento ({presupuestoSeleccionado.descuento_porcentaje}%):</span>
                  <strong>-${Number(presupuestoSeleccionado.descuento_monto || 0).toLocaleString()}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: '8px', marginTop: '4px', fontSize: '1.1rem', fontWeight: 800 }}>
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
              {presupuestoSeleccionado.estado === 'Pendiente' ? (
                <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn--outline"
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    onClick={() => handleResponderPresupuesto(presupuestoSeleccionado.id, 'Rechazado')}
                  >
                    <i className="fa-solid fa-xmark"></i> Rechazar Cotización
                  </button>
                  <button
                    type="button"
                    className="btn btn--primario"
                    style={{ backgroundColor: '#059669' }}
                    onClick={() => handleResponderPresupuesto(presupuestoSeleccionado.id, 'Aprobado')}
                  >
                    <i className="fa-solid fa-check"></i> Aprobar Cotización
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn--outline" onClick={() => setModalDetallePresupuesto(false)}>
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Encuesta de Calificación */}
      {modalCalificacion && ordenCalificar && (
        <Modal titulo={`Calificar Servicio - ${ordenCalificar.numero_orden}`} onClose={() => setModalCalificacion(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleEnviarCalificacion}>
            <div className="form-group">
              <label>
                Puntuación del Servicio (1 a 5 Estrellas) <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <select value={estrellas} onChange={(e) => setEstrellas(parseInt(e.target.value))} className="form-input">
                <option value="5">⭐⭐⭐⭐⭐ 5 Estrellas (Excelente)</option>
                <option value="4">⭐⭐⭐⭐ 4 Estrellas (Muy Bueno)</option>
                <option value="3">⭐⭐⭐ 3 Estrellas (Aceptable)</option>
                <option value="2">⭐⭐ 2 Estrellas (Regular)</option>
                <option value="1">⭐ 1 Estrella (Deficiente)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Comentario o Retroalimentación (opcional)</label>
              <textarea
                rows="3"
                className="form-input"
                placeholder="Escribe tus comentarios sobre la atención recibida..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalCalificacion(false)}>Cancelar</button>
              <button type="submit" className="btn btn--primario">Enviar Encuesta</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
