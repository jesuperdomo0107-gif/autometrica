// src/pages/AgendaCitas.jsx
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getCitas, crearCita, actualizarCita, eliminarCita } from '../services/citasService';
import { getVehiculos } from '../services/vehiculosService';
import { getClientes } from '../services/clientesService';
import './AgendaCitas.css';

// Helper para formatear fecha limpia sin año (Ej: "12 de Marzo")
function formatearFechaLimpia(fechaStr) {
  if (!fechaStr) return '';
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  try {
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      const dia = parseInt(partes[2], 10);
      const mesIndex = parseInt(partes[1], 10) - 1;
      if (!isNaN(dia) && mesIndex >= 0 && mesIndex < 12) {
        return `${dia} de ${meses[mesIndex]}`;
      }
    }
    return fechaStr;
  } catch {
    return fechaStr;
  }
}

export default function AgendaCitas() {
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [form, setForm] = useState({
    taller_id: 1,
    cliente_id: '',
    vehiculo_id: '',
    fecha_cita: '',
    hora_cita: '09:00 AM',
    motivo: 'Mantenimiento Preventivo',
    estado: 'Confirmada',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [dataCitas, dataVehs, dataClis] = await Promise.all([
        getCitas(),
        getVehiculos(),
        getClientes(),
      ]);
      const listaCitas = Array.isArray(dataCitas) ? dataCitas : (dataCitas?.data || []);
      const listaVehs = Array.isArray(dataVehs) ? dataVehs : (dataVehs?.data || []);
      const listaClis = Array.isArray(dataClis) ? dataClis : (dataClis?.data || []);

      setCitas(listaCitas);
      setVehiculos(listaVehs);
      setClientes(listaClis);

      if (listaVehs.length > 0 && listaClis.length > 0) {
        setForm(f => ({
          ...f,
          vehiculo_id: listaVehs[0].id,
          cliente_id: listaClis[0].id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  const [filtroEstado, setFiltroEstado] = useState('Todos');

  async function handleCambiarEstado(id, nuevoEstado) {
    try {
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
      await actualizarCita(id, { estado: nuevoEstado });
      cargarDatos();
    } catch (err) {
      alert('Error al actualizar el estado de la cita: ' + (err.message || 'Error del servidor'));
      cargarDatos();
    }
  }

  async function handleEliminar(id) {
    if (window.confirm('¿Desea eliminar definitivamente este registro de cita de la base de datos?')) {
      try {
        await eliminarCita(id);
        cargarDatos();
      } catch (err) {
        alert('Error al eliminar cita: ' + (err.message || 'Error del servidor'));
      }
    }
  }

  async function handleCrearCita(e) {
    e.preventDefault();
    try {
      await crearCita({
        ...form,
        cliente_id: parseInt(form.cliente_id) || (clientes.length > 0 ? clientes[0].id : 1),
        vehiculo_id: parseInt(form.vehiculo_id) || (vehiculos.length > 0 ? vehiculos[0].id : 1),
      });
      alert('Cita programada con éxito en la base de datos.');
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      alert('Error al agendar cita: ' + (err.message || 'Verifica los datos'));
    }
  }

  // Mapa de vehículos para visualización
  const vehiculosMap = {};
  vehiculos.forEach(v => { vehiculosMap[v.id] = v; });

  // Filtrado de citas según la pestaña seleccionada
  const citasFiltradas = citas.filter((c) => {
    if (filtroEstado === 'Todos') return true;
    return c.estado === filtroEstado;
  });

  const totalPendientes = citas.filter(c => c.estado === 'Pendiente').length;
  const totalConfirmadas = citas.filter(c => c.estado === 'Confirmada').length;
  const totalCanceladas = citas.filter(c => c.estado === 'Cancelada').length;

  return (
    <PanelLayout titulo="Gestión de Agenda de Citas del Taller">
      <div className="agenda-page">
        {/* Banner visual de Agenda de Citas */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(37, 99, 235, 0.85) 100%), url("https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
          color: 'white',
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)'
        }}>
          <div style={{ maxWidth: '580px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
              <i className="fa-solid fa-calendar-check"></i> Bahías & Turnos de Atención
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Programación de Citas del Taller</h2>
            <p style={{ margin: '6px 0 0', opacity: 0.92, fontSize: '0.9rem', lineHeight: 1.5 }}>
              Coordina los horarios de ingreso vehicular, asigna bahías mecánicas y confirma las citas solicitadas en línea.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '10px 18px', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{citas.length}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Citas Totales</div>
            </div>
          </div>
        </div>

        <div className="agenda-header" style={{ flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div>
            <h3>Agenda de Citas Solicitadas por Clientes</h3>
            <p>Confirma, reprograma o cancela las solicitudes de atenciones diarias del taller.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secundario" onClick={cargarDatos}>
              <i className="fa-solid fa-rotate"></i> Actualizar
            </button>
            <button className="btn-primario" onClick={() => setModalAbierto(true)}>
              <i className="fa-solid fa-calendar-plus"></i> Agendar Cita
            </button>
          </div>
        </div>

        {/* Pestañas de filtrado rápido por estado */}
        <div className="filtros-citas-tabs">
          <button
            className={`tab-filtro ${filtroEstado === 'Todos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('Todos')}
          >
            Todas ({citas.length})
          </button>
          <button
            className={`tab-filtro tab-pendiente ${filtroEstado === 'Pendiente' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('Pendiente')}
          >
            <i className="fa-solid fa-clock"></i> Pendientes ({totalPendientes})
          </button>
          <button
            className={`tab-filtro tab-confirmada ${filtroEstado === 'Confirmada' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('Confirmada')}
          >
            <i className="fa-solid fa-circle-check"></i> Confirmadas ({totalConfirmadas})
          </button>
          <button
            className={`tab-filtro tab-cancelada ${filtroEstado === 'Cancelada' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('Cancelada')}
          >
            <i className="fa-solid fa-circle-xmark"></i> Canceladas ({totalCanceladas})
          </button>
        </div>

        {cargando ? (
          <p>Cargando agenda...</p>
        ) : (
          <table className="tabla-custom">
            <thead>
              <tr>
                <th>ID Cita</th>
                <th>Fecha & Hora</th>
                <th>Vehículo</th>
                <th>Motivo del Servicio</th>
                <th>Estado Actual</th>
                <th style={{ minWidth: '190px' }}>Acción Rápida</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '1.8rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}></i>
                    No hay citas en la categoría <strong>{filtroEstado}</strong>.
                  </td>
                </tr>
              ) : (
                citasFiltradas.map((c) => {
                  const veh = vehiculosMap[c.vehiculo_id];
                  const esConfirmada = c.estado === 'Confirmada' || c.estado === 'Aceptada';
                  const esCancelada = c.estado === 'Cancelada';
                  const esPendiente = c.estado === 'Pendiente';

                  return (
                    <tr key={c.id}>
                      <td><code>CIT-{c.id}</code></td>
                      <td><strong>{formatearFechaLimpia(c.fecha_cita)}</strong> ({c.hora_cita})</td>
                      <td>{veh ? <strong>{veh.placa} ({veh.marca} {veh.modelo})</strong> : `Vehículo #${c.vehiculo_id}`}</td>
                      <td>{c.motivo}</td>
                      <td>
                        <span className={`badge ${esConfirmada ? 'badge-success' : esCancelada ? 'badge-danger' : 'badge-warning'}`}>
                          {esConfirmada && <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>}
                          {esCancelada && <i className="fa-solid fa-circle-xmark" style={{ marginRight: '4px' }}></i>}
                          {esPendiente && <i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i>}
                          {c.estado}
                        </span>
                      </td>
                      <td className="acciones-agenda">
                        {/* Si está pendiente, permite Confirmar o Cancelar */}
                        {esPendiente && (
                          <>
                            <button
                              className="btn-confirmar"
                              title="Confirmar cita y notificar al cliente"
                              onClick={() => handleCambiarEstado(c.id, 'Confirmada')}
                            >
                              <i className="fa-solid fa-check"></i> Confirmar
                            </button>
                            <button
                              className="btn-cancelar"
                              title="Rechazar / Cancelar cita"
                              onClick={() => handleCambiarEstado(c.id, 'Cancelada')}
                            >
                              <i className="fa-solid fa-xmark"></i> Cancelar
                            </button>
                          </>
                        )}

                        {/* Si está confirmada, permite cancelar o marcar como atendida */}
                        {esConfirmada && (
                          <>
                            <button
                              className="btn-cancelar"
                              title="Cancelar esta cita confirmada"
                              onClick={() => handleCambiarEstado(c.id, 'Cancelada')}
                            >
                              <i className="fa-solid fa-xmark"></i> Cancelar
                            </button>
                            <button
                              className="btn-completar"
                              title="Marcar como servicio completado"
                              onClick={() => handleCambiarEstado(c.id, 'Completada')}
                            >
                              <i className="fa-solid fa-flag-checkered"></i> Atendida
                            </button>
                          </>
                        )}

                        {/* Si está cancelada, permite reabrir/confirmar o eliminar */}
                        {esCancelada && (
                          <>
                            <button
                              className="btn-reabrir"
                              title="Reactivar y Confirmar esta cita"
                              onClick={() => handleCambiarEstado(c.id, 'Confirmada')}
                            >
                              <i className="fa-solid fa-rotate-left"></i> Reabrir / Confirmar
                            </button>
                            <button
                              className="btn-eliminar"
                              title="Eliminar de la base de datos"
                              onClick={() => handleEliminar(c.id)}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </>
                        )}

                        {c.estado === 'Completada' && (
                          <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                            <i className="fa-solid fa-check-double"></i> Servicio Atendido
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal titulo="Agendar Cita en Taller" onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleCrearCita} className="form-grid">
            <div className="form-group">
              <label>
                Seleccionar Vehículo <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <select
                className="form-input"
                value={form.vehiculo_id}
                onChange={(e) => setForm({ ...form, vehiculo_id: e.target.value })}
                required
              >
                {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Fecha de la Cita <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={form.fecha_cita}
                onChange={(e) => setForm({ ...form, fecha_cita: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Hora <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <select
                className="form-input"
                value={form.hora_cita}
                onChange={(e) => setForm({ ...form, hora_cita: e.target.value })}
              >
                <option value="08:00 AM">08:00 AM</option>
                <option value="09:30 AM">09:30 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Motivo <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                required
                placeholder="Ej: Cambio de pastillas y revisión técnica..."
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn-primario">Guardar Cita</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
