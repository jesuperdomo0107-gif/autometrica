// src/pages/Clientes.jsx
// Módulo de Gestión y Consulta de Clientes del Taller
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import { getUsuarios } from '../services/usuariosService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    setCargando(true);
    setError('');
    try {
      // Obtenemos los usuarios con rol cliente directamente de la base de datos
      const data = await getUsuarios({ rol: 'cliente' });
      setClientes(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError(err.message || 'Error al cargar los clientes.');
    } finally {
      setCargando(false);
    }
  }

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono && c.telefono.includes(busqueda))
  );

  const handleExportarPDF = () => {
    if (clientesFiltrados.length === 0) {
      alert('No hay clientes para exportar a PDF.');
      return;
    }
    const doc = new jsPDF();

    // Header decorativo
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AutoMétrica - Directorio de Clientes Registrados', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} | Total Clientes: ${clientesFiltrados.length}`, 14, 22);

    const tablaCuerpo = clientesFiltrados.map(c => [
      `#${c.id}`,
      c.nombre_completo || '—',
      c.correo || '—',
      c.telefono || '—',
      c.fecha_registro ? new Date(c.fecha_registro).toLocaleDateString('es-CO') : '—',
      c.activo ? 'Activo' : 'Inactivo'
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['ID', 'Nombre Completo', 'Correo Electrónico', 'Teléfono', 'Fecha Registro', 'Estado']],
      body: tablaCuerpo,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 8.5 },
    });

    doc.save(`Directorio_Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportarCSV = () => {
    if (clientesFiltrados.length === 0) {
      alert('No hay clientes para exportar.');
      return;
    }
    const encabezados = ['ID', 'Nombre_Completo', 'Correo', 'Telefono', 'Fecha_Registro', 'Estado'];
    const filas = clientesFiltrados.map(c => [
      c.id,
      `"${c.nombre_completo || ''}"`,
      `"${c.correo || ''}"`,
      `"${c.telefono || ''}"`,
      `"${c.fecha_registro ? new Date(c.fecha_registro).toLocaleDateString('es-CO') : ''}"`,
      c.activo ? 'Activo' : 'Inactivo'
    ]);
    const contenido = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `directorio_clientes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PanelLayout titulo="Gestión de Clientes">
      {error && <div className="alerta alerta--error">{error}</div>}

      {/* Banner visual de Clientes */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.88) 100%), url("https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
        color: 'white',
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px rgba(30, 58, 138, 0.25)'
      }}>
        <div style={{ maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <i className="fa-solid fa-users"></i> CRM & Fidelización
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Directorio de Clientes AutoMétrica</h2>
          <p style={{ margin: '6px 0 0', opacity: 0.92, fontSize: '0.9rem', lineHeight: 1.5 }}>
            Centraliza los datos de contacto, historial de vehículos y comunicaciones directas con los clientes del taller.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '10px 18px', textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{clientes.length}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Clientes Totales</div>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Barra superior de herramientas y búsqueda */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h3 className="panel-section-title" style={{ margin: 0 }}>
              <i className="fa-solid fa-users" style={{ color: 'var(--color-primario)' }}></i> Directorio de Clientes ({clientesFiltrados.length})
            </h3>
            <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Los clientes se registran automáticamente en el sistema al crear su cuenta en la plataforma.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ minWidth: '240px' }}
              placeholder="Buscar por nombre, correo o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button
              className="btn btn--primario"
              onClick={handleExportarPDF}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              title="Descargar lista en PDF"
            >
              <i className="fa-solid fa-file-pdf"></i> Exportar PDF
            </button>
            <button className="btn btn--outline" onClick={handleExportarCSV} title="Descargar lista en CSV">
              <i className="fa-solid fa-file-csv"></i> Exportar CSV
            </button>
            <button className="btn btn--outline" onClick={cargarClientes} title="Actualizar lista">
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>

        {/* Tabla de Clientes */}
        {cargando ? (
          <div className="flex-center" style={{ padding: '40px' }}>
            <span className="spinner spinner--dark"></span>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-users-slash"></i>
            <p>No se encontraron clientes registrados con ese criterio de búsqueda.</p>
          </div>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Correo Electrónico</th>
                  <th>Teléfono</th>
                  <th>Fecha Registro</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c) => (
                  <tr key={c.id}>
                    <td><code>#{c.id}</code></td>
                    <td><strong>{c.nombre_completo}</strong></td>
                    <td>{c.correo}</td>
                    <td>{c.telefono || '—'}</td>
                    <td>{c.fecha_registro ? new Date(c.fecha_registro).toLocaleDateString('es-CO') : '—'}</td>
                    <td>
                      <span className={`badge ${c.activo ? 'badge--finalizado' : 'badge--cancelado'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PanelLayout>
  );
}
