import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getOrdenes, crearOrden, actualizarOrden } from '../services/ordenesService';
import { getVehiculos } from '../services/vehiculosService';
import { getClientes } from '../services/clientesService';

function badgeEstado(estado) {
  const mapa = {
    'Recibido': 'badge--recibido',
    'En Diagnóstico': 'badge--diagnostico',
    'En Reparación': 'badge--reparacion',
    'Servicio Finalizado': 'badge--finalizado',
    'Cancelado': 'badge--cancelado',
  };
  return mapa[estado] || 'badge--recibido';
}

function formatearSegundosDigital(totalSegundos) {
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return `${horas > 0 ? String(horas).padStart(2, '0') + ':' : ''}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

export default function Reparaciones() {
  const { usuario } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Cronómetro en Vivo Reactivo (con segundero real cada 1s)
  const [ordenActivaId, setOrdenActivaId] = useState(null);
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [estaPausado, setEstaPausado] = useState(false);

  const [form, setForm] = useState({
    taller_id: usuario?.taller_id || 1,
    mecanico_id: usuario?.mecanico_id || null,
    vehiculo_id: '',
    cliente_id: '',
    numero_orden: `ORD-${Date.now().toString().slice(-4)}`,
    estado: 'Recibido',
    descripcion_problema: '',
    diagnostico_tecnico: '',
    costo_estimado: 180000,
    es_urgente: false,
    garantia_dias: 90,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // Intervalo de tictac del cronómetro en vivo
  useEffect(() => {
    let intervalo = null;
    if (ordenActivaId && !estaPausado) {
      intervalo = setInterval(() => {
        setSegundosTranscurridos((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [ordenActivaId, estaPausado]);

  async function cargarDatos() {
    setCargando(true);
    try {
      const [dataOrd, dataVeh, dataCli] = await Promise.all([
        getOrdenes(),
        getVehiculos(),
        getClientes(),
      ]);
      const ords = Array.isArray(dataOrd) ? dataOrd : (dataOrd?.data || []);
      const vehs = Array.isArray(dataVeh) ? dataVeh : (dataVeh?.data || []);
      const clis = Array.isArray(dataCli) ? dataCli : (dataCli?.data || []);

      setOrdenes(ords);
      setVehiculos(vehs);
      setClientes(clis);

      if (vehs.length > 0) {
        setForm(f => ({
          ...f,
          taller_id: usuario?.taller_id || 1,
          mecanico_id: usuario?.mecanico_id || null,
          vehiculo_id: vehs[0].id,
          cliente_id: vehs[0].cliente_id || (clis[0]?.id || 1),
        }));
      }
    } catch (err) {
      console.warn('Error al cargar datos de reparaciones:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarEstado(ordenId, nuevoEstado) {
    try {
      await actualizarOrden(ordenId, { estado: nuevoEstado });
      setOrdenes(ordenes.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o));
    } catch (err) {
      alert('Error al actualizar el estado de la orden');
    }
  }

  // Controles de Cronómetro en Vivo
  function handleIniciarCronometro(ordenId) {
    if (ordenActivaId && ordenActivaId !== ordenId) {
      if (!window.confirm('Ya tienes un cronómetro en marcha en otra orden. ¿Deseas pausarlo y cambiar a esta?')) {
        return;
      }
    }
    setOrdenActivaId(ordenId);
    setSegundosTranscurridos(0);
    setEstaPausado(false);

    // Auto-transición a "En Reparación" si estaba en recibido o diagnóstico
    const o = ordenes.find(x => x.id === ordenId);
    if (o && (o.estado === 'Recibido' || o.estado === 'En Diagnóstico')) {
      handleCambiarEstado(ordenId, 'En Reparación');
    }
  }

  function handlePausarReanudar() {
    setEstaPausado(!estaPausado);
  }

  async function handleFinalizarCronometro(ordenId) {
    const minutosGanados = Math.max(1, Math.round(segundosTranscurridos / 60));
    const orden = ordenes.find(o => o.id === ordenId);
    const nuevoTotal = (Number(orden?.tiempo_total_minutos) || 0) + minutosGanados;

    try {
      await actualizarOrden(ordenId, {
        tiempo_total_minutos: nuevoTotal,
        estado: orden?.estado === 'Recibido' ? 'En Reparación' : orden?.estado
      });
      alert(`⏱️ Mano de obra guardada con éxito en la base de datos: +${minutosGanados} min (Total orden: ${nuevoTotal} min).`);
      setOrdenActivaId(null);
      setSegundosTranscurridos(0);
      setEstaPausado(false);
      cargarDatos();
    } catch (err) {
      alert('Error al guardar el tiempo de mano de obra en el servidor.');
    }
  }

  function handleVehiculoChange(vehId) {
    const vSeleccionado = vehiculos.find(v => v.id === parseInt(vehId));
    setForm({
      ...form,
      vehiculo_id: parseInt(vehId),
      cliente_id: vSeleccionado ? vSeleccionado.cliente_id : (clientes[0]?.id || 1),
    });
  }

  function abrirModalNuevaOrden() {
    setForm({
      taller_id: usuario?.taller_id || 1,
      mecanico_id: usuario?.mecanico_id || null,
      vehiculo_id: vehiculos.length > 0 ? vehiculos[0].id : '',
      cliente_id: vehiculos.length > 0 ? (vehiculos[0].cliente_id || clientes[0]?.id || 1) : 1,
      numero_orden: `ORD-${Date.now().toString().slice(-4)}`,
      estado: 'Recibido',
      descripcion_problema: '',
      diagnostico_tecnico: '',
      costo_estimado: 180000,
      es_urgente: false,
      garantia_dias: 90,
    });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await crearOrden(form);
      alert('Orden de servicio creada exitosamente en la base de datos.');
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      alert('Error al crear orden: ' + (err.message || 'Verifica los datos'));
    }
  }

  const ordenesFiltradas = filtroEstado === 'Todos'
    ? ordenes
    : ordenes.filter(o => o.estado === filtroEstado);

  // Mapeo auxiliar de vehículos por ID
  const vehiculosMap = {};
  vehiculos.forEach(v => { vehiculosMap[v.id] = v; });

  const ordenActiva = ordenes.find(o => o.id === ordenActivaId);
  const vehiculoActivo = ordenActiva ? vehiculosMap[ordenActiva.vehiculo_id] : null;

  return (
    <PanelLayout titulo="Gestión de Reparaciones">
      {/* Banner visual del área técnica */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.85) 100%), url("https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1100&q=80") center/cover no-repeat',
        color: 'white',
        marginBottom: '20px',
        borderRadius: '14px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <i className="fa-solid fa-wrench"></i> Bahías Técnicas y Mano de Obra
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Gestión de Reparaciones y Órdenes</h2>
          <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Monitoreo de tareas en vivo, cronómetro reactivo por mecánico, cambio dinámico de estado y diagnóstico técnico.
          </p>
        </div>
        <button className="btn btn--primario" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }} onClick={abrirModalNuevaOrden}>
          <i className="fa-solid fa-plus"></i> Nueva Orden de Servicio
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="panel-section-title" style={{ margin: 0 }}>
              <i className="fa-solid fa-list-check" style={{ color: '#F59E0B' }}></i> Listado de Órdenes en Taller ({ordenesFiltradas.length})
            </h3>
            <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Control de diagnósticos técnicos, garantías, tiempos de mano de obra y cronómetro en vivo.
            </p>
          </div>
          <button className="btn btn--outline" onClick={cargarDatos} title="Recargar órdenes">
            <i className="fa-solid fa-rotate"></i> Actualizar
          </button>
        </div>

        {/* Banner Flotante de Reparación en Curso Activa */}
        {ordenActivaId && (
          <div className="cronometro-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="cronometro-activo">
                <i className="fa-solid fa-stopwatch fa-spin" style={{ animationDuration: '3s' }}></i>
                <span>TRABAJO EN PROGRESO</span>
              </div>
              <div>
                <strong>Orden {ordenActiva?.numero_orden}:</strong> {vehiculoActivo ? `${vehiculoActivo.placa} (${vehiculoActivo.marca} ${vehiculoActivo.modelo})` : 'Vehículo en taller'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="cronometro-banner__timer">
                {formatearSegundosDigital(segundosTranscurridos)}
              </div>
              <button
                type="button"
                className="btn btn--sm btn--outline"
                style={{ color: '#ffffff', borderColor: '#64748b' }}
                onClick={handlePausarReanudar}
              >
                <i className={`fa-solid ${estaPausado ? 'fa-play' : 'fa-pause'}`}></i>
                {estaPausado ? 'Reanudar' : 'Pausar'}
              </button>
              <button
                type="button"
                className="btn btn--sm btn--primario"
                style={{ backgroundColor: '#16a34a' }}
                onClick={() => handleFinalizarCronometro(ordenActivaId)}
              >
                <i className="fa-solid fa-check"></i> Finalizar y Guardar
              </button>
            </div>
          </div>
        )}

        {/* Pestañas de Filtro Rápido por Estado */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['Todos', 'Recibido', 'En Diagnóstico', 'En Reparación', 'Servicio Finalizado'].map((est) => (
            <button
              key={est}
              type="button"
              className={`btn btn--sm ${filtroEstado === est ? 'btn--primario' : 'btn--outline'}`}
              onClick={() => setFiltroEstado(est)}
            >
              {est}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="flex-center" style={{ padding: '40px' }}>
            <span className="spinner spinner--dark"></span>
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-clipboard-list"></i>
            <p>No hay órdenes de reparación registradas con el estado seleccionado.</p>
          </div>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>N° Orden</th>
                  <th>Vehículo</th>
                  <th>Garantía</th>
                  <th>Tiempo Mano de Obra</th>
                  <th>Costo Estimado</th>
                  <th>Estado Actual</th>
                  <th>Actualizar Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map((o) => {
                  const veh = vehiculosMap[o.vehiculo_id];
                  const esLaOrdenActiva = ordenActivaId === o.id;

                  return (
                    <tr key={o.id} style={esLaOrdenActiva ? { backgroundColor: '#f0fdf4' } : {}}>
                      <td>
                        <strong>{o.numero_orden}</strong>
                        {o.es_urgente && (
                          <span style={{ color: '#EF4444', marginLeft: '6px', fontSize: '0.8rem' }} title="Urgente">
                            <i className="fa-solid fa-circle-exclamation"></i> URG
                          </span>
                        )}
                      </td>
                      <td>
                        {veh ? (
                          <span><strong>{veh.placa}</strong> ({veh.marca} {veh.modelo})</span>
                        ) : (
                          <span>Vehículo #{o.vehiculo_id}</span>
                        )}
                      </td>
                      <td><span className="badge badge--recibido">{o.garantia_dias || 90} Días</span></td>
                      <td>
                        {esLaOrdenActiva ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="cronometro-activo">
                              <i className="fa-solid fa-stopwatch"></i> {formatearSegundosDigital(segundosTranscurridos)}
                            </span>
                            <button
                              className="btn btn--sm btn--outline"
                              style={{ color: '#ef4444', borderColor: '#ef4444', padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleFinalizarCronometro(o.id)}
                              title="Detener y guardar tiempo en base de datos"
                            >
                              Finalizar
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn--outline"
                            style={{ color: '#059669', borderColor: '#059669', padding: '4px 10px', fontSize: '0.82rem' }}
                            onClick={() => handleIniciarCronometro(o.id)}
                          >
                            <i className="fa-solid fa-play"></i> {o.tiempo_total_minutos ? `${o.tiempo_total_minutos} min (Iniciar)` : '▶ Iniciar Tarea'}
                          </button>
                        )}
                      </td>
                      <td>${Number(o.costo_estimado || 0).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${badgeEstado(o.estado)}`}>
                          {o.estado}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto' }}
                          value={o.estado}
                          onChange={(e) => handleCambiarEstado(o.id, e.target.value)}
                        >
                          <option value="Recibido">Recibido</option>
                          <option value="En Diagnóstico">En Diagnóstico</option>
                          <option value="En Reparación">En Reparación</option>
                          <option value="Servicio Finalizado">Servicio Finalizado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Orden */}
      {modalAbierto && (
        <Modal titulo="Crear Nueva Orden de Servicio" onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="modal_num_orden">
                Número de Orden <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input id="modal_num_orden" type="text" className="form-input" required value={form.numero_orden} onChange={(e) => setForm({ ...form, numero_orden: e.target.value })} />
            </div>

            <div className="form-group">
              <label htmlFor="modal_vehiculo">
                Seleccionar Vehículo <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <select
                id="modal_vehiculo"
                className="form-input"
                required
                value={form.vehiculo_id}
                onChange={(e) => handleVehiculoChange(e.target.value)}
              >
                <option value="" disabled>Seleccione un vehículo registrado...</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.marca} {v.modelo} (Año {v.anio})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modal_costo">
                Costo Estimado de Reparación ($) <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                id="modal_costo"
                type="number"
                className="form-input"
                required
                value={form.costo_estimado}
                onChange={(e) => setForm({ ...form, costo_estimado: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modal_garantia">Garantía Ofrecida (Días)</label>
              <input id="modal_garantia" type="number" className="form-input" value={form.garantia_dias} onChange={(e) => setForm({ ...form, garantia_dias: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="form-group">
              <label htmlFor="modal_problema">
                Descripción del Problema <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <textarea
                id="modal_problema"
                className="form-input"
                rows="2"
                required
                placeholder="Falla reportada por el cliente..."
                value={form.descripcion_problema}
                onChange={(e) => setForm({ ...form, descripcion_problema: e.target.value })}
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="modal_diagnostico">Diagnóstico Técnico Inicial</label>
              <textarea
                id="modal_diagnostico"
                className="form-input"
                rows="2"
                placeholder="Diagnóstico inicial del mecánico o técnico..."
                value={form.diagnostico_tecnico}
                onChange={(e) => setForm({ ...form, diagnostico_tecnico: e.target.value })}
              ></textarea>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="es_urgente"
                checked={form.es_urgente}
                onChange={(e) => setForm({ ...form, es_urgente: e.target.checked })}
              />
              <label htmlFor="es_urgente" style={{ margin: 0, cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                ¿Es un servicio de carácter urgente?
              </label>
            </div>

            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn btn--primario">Crear Orden</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
