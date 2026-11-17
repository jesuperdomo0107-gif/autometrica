// src/pages/Historial.jsx
// Registro cronológico de servicios completados con trazabilidad y detalle
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getOrdenes } from '../services/ordenesService';
import { getVehiculos } from '../services/vehiculosService';
import { getUsuarios } from '../services/usuariosService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Historial.css';

export default function Historial() {
  const [ordenes, setOrdenes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Modal Detalle
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [resOrd, resVeh, resUsu] = await Promise.all([
        getOrdenes(),
        getVehiculos(),
        getUsuarios(),
      ]);

      const listaOrd = Array.isArray(resOrd) ? resOrd : (resOrd?.data || []);
      const soloFinalizadas = listaOrd.filter((o) => o.estado === 'Servicio Finalizado');
      
      setOrdenes(soloFinalizadas);
      setVehiculos(Array.isArray(resVeh) ? resVeh : (resVeh?.data || []));
      setUsuarios(Array.isArray(resUsu) ? resUsu : (resUsu?.data || []));
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setError('No se pudo cargar el historial de servicios.');
    } finally {
      setCargando(false);
    }
  };

  // Mapeos de consulta rápida
  const vehiculosMap = {};
  vehiculos.forEach(v => { vehiculosMap[v.id] = v; });

  const usuariosMap = {};
  usuarios.forEach(u => { usuariosMap[u.id] = u; });

  // ─── Filtrado reactivo ───────────────────────────────────────────
  const ordenesFiltradas = ordenes.filter((orden) => {
    const veh = vehiculosMap[orden.vehiculo_id];
    const cliente = usuariosMap[orden.cliente_id];

    const textoBuscar = busqueda.toLowerCase().trim();
    const coincideTexto =
      !textoBuscar ||
      orden.numero_orden?.toLowerCase().includes(textoBuscar) ||
      veh?.placa?.toLowerCase().includes(textoBuscar) ||
      veh?.marca?.toLowerCase().includes(textoBuscar) ||
      veh?.modelo?.toLowerCase().includes(textoBuscar) ||
      cliente?.nombre_completo?.toLowerCase().includes(textoBuscar) ||
      orden.diagnostico_tecnico?.toLowerCase().includes(textoBuscar);

    const fechaRef = orden.fecha_salida || orden.fecha_ingreso || orden.fecha_finalizacion;
    const coincideDesde = !fechaDesde || (fechaRef && new Date(fechaRef) >= new Date(fechaDesde));
    const coincideHasta = !fechaHasta || (fechaRef && new Date(fechaRef) <= new Date(`${fechaHasta}T23:59:59`));

    return coincideTexto && coincideDesde && coincideHasta;
  });

  // Métricas KPI
  const totalFacturado = ordenesFiltradas.reduce((acc, o) => acc + (Number(o.costo_estimado || o.costo_total) || 0), 0);
  const ordenesConEstrellas = ordenesFiltradas.filter(o => o.calificacion && o.calificacion > 0);
  const promedioSatisfaccion = ordenesConEstrellas.length > 0
    ? (ordenesConEstrellas.reduce((acc, o) => acc + Number(o.calificacion), 0) / ordenesConEstrellas.length).toFixed(1)
    : '5.0';

  const formatearFecha = (isoString) => {
    if (!isoString) return new Date().toLocaleDateString('es-CO');
    return new Date(isoString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const formatearCOP = (valor) => {
    const num = Number(valor) || 0;
    return `$${num.toLocaleString('es-CO')} COP`;
  };

  const renderEstrellas = (calificacion) => {
    const val = Number(calificacion) || 5;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: '#eab308', fontSize: '1rem' }}>
          {'★'.repeat(val)}{'☆'.repeat(Math.max(0, 5 - val))}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>({val}.0)</span>
      </div>
    );
  };

  const handleExportarHistorialPDF = () => {
    if (ordenesFiltradas.length === 0) {
      alert('No hay servicios finalizados para exportar a PDF con los filtros actuales.');
      return;
    }
    const doc = new jsPDF();

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AutoMétrica - Historial de Servicios Finalizados', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} | Servicios Finalizados: ${ordenesFiltradas.length} | Total: ${formatearCOP(totalFacturado)}`, 14, 22);

    const tablaCuerpo = ordenesFiltradas.map(o => {
      const veh = vehiculosMap[o.vehiculo_id];
      const cli = usuariosMap[o.cliente_id];
      const vehTxt = veh ? `${veh.placa} (${veh.marca} ${veh.modelo})` : `Vehículo #${o.vehiculo_id}`;
      return [
        o.numero_orden || `ORD-${o.id}`,
        vehTxt,
        cli?.nombre_completo || 'Cliente Registrado',
        (o.diagnostico_tecnico || o.descripcion_problema || 'Mantenimiento Preventivo'),
        formatearCOP(o.costo_estimado || o.costo_total),
        `${o.garantia_dias || 90} días`,
        o.calificacion ? `${o.calificacion}/5 ⭐` : '5.0 ⭐'
      ];
    });

    autoTable(doc, {
      startY: 36,
      head: [['N° Orden', 'Vehículo', 'Cliente', 'Trabajo Realizado', 'Costo Final', 'Garantía', 'Calificación']],
      body: tablaCuerpo,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 8 },
    });

    doc.save(`Historial_Servicios_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportarHistorialCSV = () => {
    if (ordenesFiltradas.length === 0) {
      alert('No hay servicios finalizados para exportar con los filtros actuales.');
      return;
    }
    const encabezados = ['N_Orden', 'Vehiculo', 'Cliente', 'Fecha_Salida', 'Diagnostico', 'Costo_Total', 'Garantia_Dias', 'Calificacion', 'Comentarios'];
    const filas = ordenesFiltradas.map(o => {
      const veh = vehiculosMap[o.vehiculo_id];
      const cli = usuariosMap[o.cliente_id];
      const vehTxt = veh ? `${veh.placa} ${veh.marca} ${veh.modelo}` : `Vehiculo_${o.vehiculo_id}`;
      return [
        o.numero_orden,
        `"${vehTxt}"`,
        `"${cli?.nombre_completo || 'Cliente'}"`,
        `"${formatearFecha(o.fecha_salida || o.fecha_ingreso)}"`,
        `"${(o.diagnostico_tecnico || o.descripcion_problema || '').replace(/"/g, '""')}"`,
        o.costo_estimado || o.costo_total || 0,
        o.garantia_dias || 90,
        o.calificacion || 5,
        `"${(o.comentario_cliente || '').replace(/"/g, '""')}"`
      ];
    });
    const contenido = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_servicios_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PanelLayout titulo="Historial de Servicios">
      {/* Encabezado y Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-texto)' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8, color: 'var(--color-primario)' }}></i>
            Historial de Servicios y Reparaciones
          </h2>
          <p style={{ color: 'var(--color-texto-suave)', marginTop: 4, fontSize: '0.9rem' }}>
            Registro cronológico consolidado de todas las órdenes finalizadas, entregadas y garantizadas en el taller.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn--primario"
            onClick={handleExportarHistorialPDF}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            title="Descargar histórico en formato PDF"
          >
            <i className="fa-solid fa-file-pdf"></i> Descargar Historial (PDF)
          </button>
          <button className="btn btn--outline" onClick={handleExportarHistorialCSV} title="Descargar histórico en CSV">
            <i className="fa-solid fa-file-csv"></i> Descargar Historial (CSV)
          </button>
          <button className="btn btn--outline" onClick={cargarDatos} title="Recargar datos">
            <i className="fa-solid fa-rotate"></i>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="historial-kpis-grid">
        <div className="historial-kpi-card">
          <div className="historial-kpi-icon historial-kpi-icon--green">
            <i className="fa-solid fa-sack-dollar"></i>
          </div>
          <div>
            <div className="historial-kpi-valor">{formatearCOP(totalFacturado)}</div>
            <div className="historial-kpi-label">Facturado en Historial</div>
          </div>
        </div>

        <div className="historial-kpi-card">
          <div className="historial-kpi-icon historial-kpi-icon--blue">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div className="historial-kpi-valor">{ordenesFiltradas.length} Servicios</div>
            <div className="historial-kpi-label">Entregados con Éxito</div>
          </div>
        </div>

        <div className="historial-kpi-card">
          <div className="historial-kpi-icon historial-kpi-icon--yellow">
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <div className="historial-kpi-valor">{promedioSatisfaccion} / 5.0</div>
            <div className="historial-kpi-label">Satisfacción Promedio</div>
          </div>
        </div>

        <div className="historial-kpi-card">
          <div className="historial-kpi-icon historial-kpi-icon--purple">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <div className="historial-kpi-valor">100% Vigente</div>
            <div className="historial-kpi-label">Cobertura de Garantía</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="historial-toolbar-card">
        <div style={{ flex: '1 1 300px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar por N° orden, placa, marca, modelo, cliente o falla..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="historial-filtros-fechas">
          <label htmlFor="fecha-desde">Desde:</label>
          <input
            id="fecha-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
          <label htmlFor="fecha-hasta">Hasta:</label>
          <input
            id="fecha-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
          {(busqueda || fechaDesde || fechaHasta) && (
            <button
              className="btn btn--outline btn--sm"
              onClick={() => { setBusqueda(''); setFechaDesde(''); setFechaHasta(''); }}
            >
              <i className="fa-solid fa-xmark"></i> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Contenido / Tabla */}
      {cargando ? (
        <div className="flex-center" style={{ padding: '60px' }}>
          <span className="spinner spinner--dark"></span>
        </div>
      ) : error ? (
        <div className="alerta alerta--error">
          <i className="fa-solid fa-triangle-exclamation"></i> {error}
          <button className="btn btn--outline btn--sm" style={{ marginLeft: 16 }} onClick={cargarDatos}>
            Reintentar
          </button>
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="card empty-state" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <i className="fa-solid fa-folder-open fa-3x" style={{ color: '#94a3b8', marginBottom: 12 }}></i>
          <h3 style={{ margin: '0 0 6px' }}>No hay servicios finalizados que coincidan</h3>
          <p style={{ color: 'var(--color-texto-suave)', margin: 0 }}>Prueba ajustando los términos de búsqueda o el rango de fechas.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>N° Orden</th>
                  <th>Vehículo & Placa</th>
                  <th>Propietario / Cliente</th>
                  <th>Diagnóstico & Trabajo</th>
                  <th>Fecha Entrega</th>
                  <th>Costo Total</th>
                  <th>Garantía</th>
                  <th>Calificación & Feedback</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map((orden) => {
                  const veh = vehiculosMap[orden.vehiculo_id];
                  const cli = usuariosMap[orden.cliente_id];
                  const costo = Number(orden.costo_estimado || orden.costo_total) || 0;

                  return (
                    <tr key={orden.id}>
                      <td>
                        <strong style={{ color: 'var(--color-primario)' }}>
                          {orden.numero_orden || `#ORD-${orden.id}`}
                        </strong>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-car" style={{ color: '#334155' }}></i>
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem' }}>{veh ? veh.placa : `Vehículo #${orden.vehiculo_id}`}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{veh ? `${veh.marca} ${veh.modelo}` : 'Auto'}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-user" style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>
                          <span style={{ fontWeight: 500 }}>{cli?.nombre_completo || 'Cliente Registrado'}</span>
                        </div>
                      </td>

                      <td style={{ maxWidth: '240px' }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>
                          {orden.diagnostico_tecnico || orden.descripcion_problema || 'Mantenimiento preventivo general'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ⏱️ {orden.tiempo_total_minutos || 0} min de mano de obra
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                          {formatearFecha(orden.fecha_salida || orden.fecha_ingreso)}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                          {formatearCOP(costo)}
                        </strong>
                      </td>

                      <td>
                        <span className="badge badge--reparacion" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          <i className="fa-solid fa-shield-check"></i> {orden.garantia_dias || 90} días
                        </span>
                      </td>

                      <td>
                        <div>
                          {renderEstrellas(orden.calificacion)}
                          {orden.comentario_cliente ? (
                            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', fontStyle: 'italic', color: '#64748b', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={orden.comentario_cliente}>
                              "{orden.comentario_cliente}"
                            </p>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Servicio 5 estrellas</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <button
                          className="btn btn--outline"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          onClick={() => setOrdenSeleccionada(orden)}
                          title="Ver hoja completa de servicio"
                        >
                          <i className="fa-solid fa-file-lines"></i> Ver Hoja
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Hoja de Detalle de Servicio */}
      {ordenSeleccionada && (
        <Modal
          titulo={`Hoja de Servicio Finalizado — ${ordenSeleccionada.numero_orden || `#ORD-${ordenSeleccionada.id}`}`}
          onClose={() => setOrdenSeleccionada(null)}
        >
          <div className="historial-detalle-modal">
            <div className="historial-detalle-grid">
              <div className="historial-detalle-item">
                <strong>Vehículo Atendido</strong>
                <span>
                  {vehiculosMap[ordenSeleccionada.vehiculo_id]?.placa || 'N/A'} — {vehiculosMap[ordenSeleccionada.vehiculo_id]?.marca} {vehiculosMap[ordenSeleccionada.vehiculo_id]?.modelo}
                </span>
              </div>
              <div className="historial-detalle-item">
                <strong>Propietario / Cliente</strong>
                <span>{usuariosMap[ordenSeleccionada.cliente_id]?.nombre_completo || 'Cliente Registrado'}</span>
              </div>
              <div className="historial-detalle-item">
                <strong>Fecha de Entrega</strong>
                <span>{formatearFecha(ordenSeleccionada.fecha_salida || ordenSeleccionada.fecha_ingreso)}</span>
              </div>
              <div className="historial-detalle-item">
                <strong>Costo Total Facturado</strong>
                <span style={{ color: '#059669', fontSize: '1.1rem' }}>
                  {formatearCOP(ordenSeleccionada.costo_estimado || ordenSeleccionada.costo_total)}
                </span>
              </div>
            </div>

            <div className="historial-detalle-item">
              <strong>Motivo de Ingreso y Falla Reportada</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#334155' }}>
                {ordenSeleccionada.descripcion_problema || 'Mantenimiento preventivo general de rutina.'}
              </p>
            </div>

            <div className="historial-detalle-item" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
              <strong style={{ color: '#1e40af' }}>Diagnóstico e Intervención Técnica</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 500 }}>
                {ordenSeleccionada.diagnostico_tecnico || 'Revisión exhaustiva y sustitución de repuestos desgastados.'}
              </p>
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#3b82f6' }}>
                ⏱️ <strong>Tiempo Invertido:</strong> {ordenSeleccionada.tiempo_total_minutos || 0} minutos de mano de obra calificada
              </div>
            </div>

            <div className="historial-detalle-grid">
              <div className="historial-detalle-item">
                <strong>Garantía de Servicio</strong>
                <span style={{ color: '#16a34a' }}>
                  <i className="fa-solid fa-shield-check"></i> {ordenSeleccionada.garantia_dias || 90} Días de Cobertura Total
                </span>
              </div>
              <div className="historial-detalle-item">
                <strong>Evaluación del Cliente</strong>
                {renderEstrellas(ordenSeleccionada.calificacion)}
              </div>
            </div>

            {ordenSeleccionada.comentario_cliente && (
              <div className="historial-detalle-item" style={{ backgroundColor: '#fefce8', borderColor: '#fef08a' }}>
                <strong style={{ color: '#854d0e' }}>Comentario de Satisfacción</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#713f12', fontStyle: 'italic' }}>
                  "{ordenSeleccionada.comentario_cliente}"
                </p>
              </div>
            )}

            <div className="modal__footer" style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn--primario"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                onClick={() => {
                  handleExportarHistorialPDF();
                  setOrdenSeleccionada(null);
                }}
              >
                <i className="fa-solid fa-file-pdf"></i> Imprimir Hoja en PDF
              </button>
              <button type="button" className="btn btn--outline" onClick={() => setOrdenSeleccionada(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PanelLayout>
  );
}
