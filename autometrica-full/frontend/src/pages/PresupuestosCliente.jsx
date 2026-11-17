// src/pages/PresupuestosCliente.jsx
// Módulo de Presupuestos y Cotizaciones del Cliente con Desglose Detallado por Partes
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getPresupuestos, actualizarPresupuesto } from '../services/presupuestosService';

export default function PresupuestosCliente() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalDetalle, setModalDetalle] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  async function cargarPresupuestos() {
    setCargando(true);
    setError('');
    try {
      const data = await getPresupuestos();
      setPresupuestos(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError('Error al cargar presupuestos del cliente.');
    } finally {
      setCargando(false);
    }
  }

  async function handleResponderPresupuesto(id, nuevoEstado) {
    try {
      await actualizarPresupuesto(id, { estado: nuevoEstado });
      setPresupuestos(presupuestos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
      if (presupuestoSeleccionado && presupuestoSeleccionado.id === id) {
        setPresupuestoSeleccionado({ ...presupuestoSeleccionado, estado: nuevoEstado });
      }
      alert(`Has marcado la cotización como ${nuevoEstado}. El taller y el mecánico han sido notificados.`);
    } catch (err) {
      alert('Error al actualizar el estado de la cotización.');
    }
  }

  function verDetalle(p) {
    setPresupuestoSeleccionado(p);
    setModalDetalle(true);
  }

  return (
    <PanelLayout titulo="Presupuestos & Cotizaciones">
      {error && <div className="alerta alerta--error">{error}</div>}

      {/* Banner visual de Presupuestos */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.92) 0%, rgba(15, 23, 42, 0.88) 100%), url("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
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
            <i className="fa-solid fa-file-invoice-dollar"></i> Cotizaciones Transparentes por Partes
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Presupuestos de tu Vehículo</h2>
          <p style={{ margin: '6px 0 0', opacity: 0.92, fontSize: '0.9rem', lineHeight: 1.5 }}>
            Revisa el desglose detallado de repuestos y mano de obra emitido por el mecánico antes de autorizar el trabajo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '10px 18px', textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{presupuestos.length}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Total Cotizaciones</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="panel-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#059669' }}></i> Presupuestos y Cotizaciones Recibidas ({presupuestos.length})
            </h3>
            <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Consulta las cotizaciones con el listado de piezas, repuestos, valores unitarios y autoriza en un clic.
            </p>
          </div>
          <button className="btn btn--outline" onClick={cargarPresupuestos} title="Actualizar lista">
            <i className="fa-solid fa-rotate"></i> Actualizar
          </button>
        </div>

        {cargando ? (
          <div className="flex-center" style={{ padding: '40px' }}>
            <span className="spinner spinner--dark"></span>
          </div>
        ) : presupuestos.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-file-circle-check"></i>
            <p>No tienes presupuestos pendientes ni cotizaciones activas en este momento.</p>
          </div>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>N° Cotización</th>
                  <th>Vehículo (Marca / Modelo / Año)</th>
                  <th>Taller / Mecánico</th>
                  <th>Desglose Piezas + Mano Obra</th>
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
                      <div><strong>{p.taller_nombre || 'Taller AutoMétrica'}</strong></div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {p.mecanico_nombre ? `Mec: ${p.mecanico_nombre}` : (p.taller_codigo ? `Cod: ${p.taller_codigo}` : '—')}
                      </div>
                    </td>
                    <td>
                      <div>Piezas: ${Number(p.subtotal_piezas || 0).toLocaleString()}</div>
                      <div style={{ color: 'var(--color-texto-suave)', fontSize: '0.82rem' }}>
                        Mano de Obra: ${Number(p.subtotal_mano_obra || 0).toLocaleString()}
                      </div>
                      {p.items && p.items.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '2px' }}>
                          <i className="fa-solid fa-layer-group"></i> {p.items.length} repuestos detallados
                        </div>
                      )}
                    </td>
                    <td>{p.descuento_porcentaje ? `${p.descuento_porcentaje}% OFF` : '0%'}</td>
                    <td><strong style={{ fontSize: '1rem', color: '#0f172a' }}>${Number(p.total || 0).toLocaleString()}</strong></td>
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
                          onClick={() => verDetalle(p)}
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

      {/* Modal Desglose Detallado de Cotización */}
      {modalDetalle && presupuestoSeleccionado && (
        <Modal titulo={`Cotización Detallada #COT-${presupuestoSeleccionado.id}`} onClose={() => setModalDetalle(false)}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>{presupuestoSeleccionado.taller_nombre || 'Taller Mecánico AutoMétrica'}</h3>
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
                <span>Subtotal Mano de Obra del Mecánico:</span>
                <strong>${Number(presupuestoSeleccionado.subtotal_mano_obra || 0).toLocaleString()}</strong>
              </div>
              {presupuestoSeleccionado.descuento_porcentaje > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#059669' }}>
                  <span>Descuento Comercial ({presupuestoSeleccionado.descuento_porcentaje}%):</span>
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
                <strong>Observaciones del Mecánico:</strong> {presupuestoSeleccionado.observaciones}
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
                <button type="button" className="btn btn--outline" onClick={() => setModalDetalle(false)}>
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </PanelLayout>
  );
}
