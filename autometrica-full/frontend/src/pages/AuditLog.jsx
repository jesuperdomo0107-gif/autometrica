import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import { getAuditLogs, crearAuditLog } from '../services/auditLogsService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AuditLog.css';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('Todos');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarAuditLogs();
  }, []);

  async function cargarAuditLogs() {
    try {
      setCargando(true);
      const data = await getAuditLogs();
      setLogs(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  // Registrar evento de auditoría
  async function handleSimularAuditoria() {
    try {
      await crearAuditLog({
        taller_id: 1,
        usuario_nombre: 'Admin General',
        accion: 'REVISION_SISTEMA',
        entidad: 'Seguridad',
        detalle: 'Verificación y auditoría de integridad del sistema',
        ip_origen: '192.168.1.100',
      });
      alert('Evento de auditoría registrado con éxito.');
      cargarAuditLogs();
    } catch (err) {
      alert('Error al registrar evento de auditoría');
    }
  }

  function handleLimpiarFiltros() {
    setBusqueda('');
    setFiltroModulo('Todos');
  }

  function handleExportarPDF() {
    if (logsFiltrados.length === 0) {
      alert('No hay registros de auditoría para exportar a PDF.');
      return;
    }
    const doc = new jsPDF('landscape');

    // Header decorativo
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 297, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AutoMétrica - Registro y Pista de Auditoría del Sistema', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} | Total Eventos: ${logsFiltrados.length}`, 14, 21);

    const tablaCuerpo = logsFiltrados.map(l => [
      `LOG-${l.id}`,
      new Date(l.timestamp).toLocaleString(),
      l.usuario_nombre || 'Sistema',
      l.accion,
      l.entidad || 'General',
      l.detalle || '—',
      l.ip_origen || '127.0.0.1'
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['ID Log', 'Fecha & Hora', 'Usuario', 'Acción', 'Módulo', 'Detalle Operativo', 'IP Origen']],
      body: tablaCuerpo,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    doc.save(`Auditoria_AutoMetrica_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function handleExportarCSV() {
    if (logsFiltrados.length === 0) {
      alert('No hay registros de auditoría para exportar.');
      return;
    }
    const encabezados = ['ID', 'Fecha_Hora', 'Usuario', 'Accion', 'Modulo', 'Detalle', 'IP_Origen'];
    const filas = logsFiltrados.map(l => [
      l.id,
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.usuario_nombre || 'Sistema'}"`,
      `"${l.accion}"`,
      `"${l.entidad || 'General'}"`,
      `"${(l.detalle || '').replace(/"/g, '""')}"`,
      `"${l.ip_origen || '127.0.0.1'}"`
    ]);
    const contenido = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_autometrica_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const modulosDisponibles = ['Todos', ...new Set(logs.map(l => l.entidad).filter(Boolean))];

  const logsFiltrados = logs.filter(l => {
    const coincideTexto =
      (l.usuario_nombre && l.usuario_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (l.accion && l.accion.toLowerCase().includes(busqueda.toLowerCase())) ||
      (l.detalle && l.detalle.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideModulo = filtroModulo === 'Todos' || l.entidad === filtroModulo;
    return coincideTexto && coincideModulo;
  });

  return (
    <PanelLayout titulo="Historial de Auditoría del Sistema">
      <div className="audit-page">
        <div className="audit-header" style={{ flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div>
            <h3>Supervisión de Acciones Sensibles</h3>
            <p>Registra de forma inalterable timestamps, usuario, dirección IP y detalle de cambios de rol, precios y eliminaciones.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn--primario"
              onClick={handleExportarPDF}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              title="Descargar registro de auditoría en PDF"
            >
              <i className="fa-solid fa-file-pdf"></i> Exportar PDF
            </button>
            <button className="btn-secundario" onClick={handleExportarCSV} title="Descargar registros en CSV">
              <i className="fa-solid fa-file-csv"></i> Exportar CSV
            </button>
            <button className="btn-primario" onClick={handleSimularAuditoria}>
              <i className="fa-solid fa-shield-halved"></i> Registrar Evento
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            style={{ minWidth: '260px', flex: 1 }}
            placeholder="Buscar por usuario, acción o detalle..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '160px' }}
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
          >
            {modulosDisponibles.map(m => (
              <option key={m} value={m}>Módulo: {m}</option>
            ))}
          </select>
          <button className="btn btn--outline" onClick={handleLimpiarFiltros}>
            <i className="fa-solid fa-filter-circle-xmark"></i> Limpiar Filtros
          </button>
        </div>

        {cargando ? (
          <p>Cargando registros de auditoría...</p>
        ) : (
          <table className="tabla-custom">
            <thead>
              <tr>
                <th>ID Log</th>
                <th>Fecha & Hora (Timestamp)</th>
                <th>Usuario</th>
                <th>Acción Realizada</th>
                <th>Módulo Afectado</th>
                <th>Detalle Operativo</th>
                <th>IP Origen</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No se encontraron registros con los filtros actuales.</td>
                </tr>
              ) : (
                logsFiltrados.map((l) => (
                  <tr key={l.id}>
                    <td><code>LOG-{l.id}</code></td>
                    <td>{new Date(l.timestamp).toLocaleString()}</td>
                    <td><strong>{l.usuario_nombre || 'Sistema'}</strong></td>
                    <td>
                      <span className="badge-accion">{l.accion}</span>
                    </td>
                    <td>{l.entidad || 'General'}</td>
                    <td>{l.detalle}</td>
                    <td><code>{l.ip_origen || '127.0.0.1'}</code></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </PanelLayout>
  );
}
