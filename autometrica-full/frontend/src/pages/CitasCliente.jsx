// src/pages/CitasCliente.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getCitasPorCliente, getCitas, crearCita, actualizarCita } from '../services/citasService';
import { getVehiculos } from '../services/vehiculosService';
import './CitasCliente.css';

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

export default function CitasCliente() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [form, setForm] = useState({
    vehiculo_id: '',
    fecha_cita: '',
    hora_cita: '08:00 AM',
    motivo: 'Mantenimiento Preventivo / Cambio de Aceite',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const clienteId = usuario?.id || 1;
      const [dataCitas, dataVehs] = await Promise.all([
        getCitasPorCliente(clienteId).catch(() => getCitas()),
        getVehiculos(),
      ]);

      const listaCitas = Array.isArray(dataCitas) ? dataCitas : (dataCitas?.data || []);
      const listaVehs = Array.isArray(dataVehs) ? dataVehs : (dataVehs?.data || []);

      setCitas(listaCitas);
      setVehiculos(listaVehs);

      if (listaVehs.length > 0) {
        setForm((f) => ({ ...f, vehiculo_id: listaVehs[0].id }));
      }
    } catch (err) {
      console.error('Error al cargar citas del cliente:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fecha_cita) {
      alert('Por favor selecciona una fecha para la cita.');
      return;
    }

    try {
      await crearCita({
        taller_id: 1,
        cliente_id: usuario?.id || 1,
        vehiculo_id: parseInt(form.vehiculo_id) || (vehiculos.length > 0 ? vehiculos[0].id : 1),
        fecha_cita: form.fecha_cita,
        hora_cita: form.hora_cita,
        motivo: form.motivo,
        estado: 'Pendiente',
      });
      alert('¡Tu cita de mantenimiento ha sido agendada con éxito en el sistema!');
      setModalAbierto(false);
      setForm((f) => ({
        ...f,
        fecha_cita: '',
        motivo: 'Mantenimiento Preventivo / Cambio de Aceite',
      }));
      cargarDatos();
    } catch (err) {
      alert('Error al agendar cita: ' + (err.message || 'Verifica los campos'));
    }
  }

  async function handleCancelarPorCliente(id) {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta cita agendada?')) {
      try {
        await actualizarCita(id, { estado: 'Cancelada' });
        cargarDatos();
      } catch (err) {
        alert('Error al cancelar cita: ' + (err.message || 'Error del servidor'));
      }
    }
  }

  // Mapa de vehículos para mostrar datos amigables
  const vehiculosMap = {};
  vehiculos.forEach(v => { vehiculosMap[v.id] = v; });

  return (
    <PanelLayout titulo="Programar Citas de Mantenimiento">
      <div className="citas-cliente-container">
        {/* Banner Superior de Citas */}
        <div className="citas-banner">
          <div>
            <h3>📅 Programa la atención de tu vehículo</h3>
            <p>Selecciona la fecha y horario disponible para asegurar tu cupo en el taller sin esperas.</p>
          </div>
          <button className="btn-primario" onClick={() => setModalAbierto(true)}>
            <i className="fa-solid fa-calendar-plus"></i> Solicitar Nueva Cita
          </button>
        </div>

        {/* Lista de Citas Solicitadas */}
        {cargando ? (
          <div className="flex-center" style={{ padding: '40px' }}>
            <span className="spinner spinner--dark"></span>
          </div>
        ) : (
          <div className="card">
            <h3 className="panel-section-title">
              <i className="fa-solid fa-calendar-check" style={{ color: 'var(--color-primario)' }}></i> Mis Citas Programadas ({citas.length})
            </h3>
            {citas.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-calendar-xmark"></i>
                <p>No tienes citas programadas actualmente. ¡Haz clic en "Solicitar Nueva Cita" para agendar tu mantenimiento!</p>
              </div>
            ) : (
              <div className="grid-citas">
                {citas.map((c) => {
                  const veh = vehiculosMap[c.vehiculo_id];
                  const esConfirmada = c.estado === 'Confirmada' || c.estado === 'Aceptada';
                  const esCancelada = c.estado === 'Cancelada';
                  const esPendiente = c.estado === 'Pendiente';
                  const fechaSinAnio = formatearFechaLimpia(c.fecha_cita);

                  return (
                    <div key={c.id} className={`tarjeta-cita ${esConfirmada ? 'tarjeta-confirmada' : esCancelada ? 'tarjeta-cancelada' : 'tarjeta-pendiente'}`}>
                      <div className="tarjeta-cita-header">
                        <div className="fecha-badge">
                          <i className="fa-solid fa-calendar-day"></i> {fechaSinAnio} • {c.hora_cita}
                        </div>
                        <span className={`badge ${esConfirmada ? 'badge--finalizado' : esCancelada ? 'badge--cancelado' : 'badge--diagnostico'}`}>
                          {esConfirmada && <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>}
                          {esCancelada && <i className="fa-solid fa-circle-xmark" style={{ marginRight: '4px' }}></i>}
                          {esPendiente && <i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i>}
                          {c.estado}
                        </span>
                      </div>

                      <h4>{c.motivo}</h4>
                      
                      <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                        <strong>Vehículo:</strong> {veh ? `${veh.placa} - ${veh.marca} ${veh.modelo}` : `Vehículo #${c.vehiculo_id}`}
                      </p>

                      {/* Notificación informativa del estado de la cita */}
                      {esConfirmada && (
                        <div className="alerta-estado-cita alerta-cita-confirmada">
                          <i className="fa-solid fa-circle-check"></i>
                          <div>
                            <strong>¡Cita Aceptada y Confirmada!</strong>
                            <p>El taller ha aprobado tu cupo. Te esperamos el <b>{fechaSinAnio}</b> a las <b>{c.hora_cita}</b>.</p>
                          </div>
                        </div>
                      )}

                      {esCancelada && (
                        <div className="alerta-estado-cita alerta-cita-cancelada">
                          <i className="fa-solid fa-circle-xmark"></i>
                          <div>
                            <strong>Cita Cancelada</strong>
                            <p>Esta cita no está activa. Puedes solicitar una nueva cita en el botón superior cuando lo desees.</p>
                          </div>
                        </div>
                      )}

                      {esPendiente && (
                        <div className="alerta-estado-cita alerta-cita-pendiente">
                          <i className="fa-solid fa-clock"></i>
                          <div>
                            <strong>Solicitud Pendiente de Confirmación</strong>
                            <p>Tu cita está en revisión por el equipo del taller. En breve la confirmaremos.</p>
                          </div>
                        </div>
                      )}

                      {!esCancelada && c.estado !== 'Completada' && (
                        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                          <button
                            type="button"
                            className="btn-cancelar-cliente"
                            onClick={() => handleCancelarPorCliente(c.id)}
                          >
                            <i className="fa-solid fa-xmark"></i> Cancelar Cita
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Agendar Cita */}
      {modalAbierto && (
        <Modal titulo="Solicitar Cita de Servicio Técnico" onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
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
                {vehiculos.length === 0 ? (
                  <option value="1">Vehículo Principal (Demo)</option>
                ) : (
                  vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.marca} {v.modelo}
                    </option>
                  ))
                )}
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
                Hora Deseada <span className="campo-obligatorio-asterisco">*</span>
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
                Motivo o Servicio Requerido <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                required
                placeholder="Ej: Cambio de aceite, revisión de frenos..."
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn-primario">Confirmar Solicitud de Cita</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
